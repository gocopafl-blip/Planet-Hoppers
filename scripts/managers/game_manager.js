// scripts/managers/game_manager.js

// Task 8.1.3: BackgroundFleetSimulator class for continuous fleet physics simulation
class BackgroundFleetSimulator {
    constructor() {
        this.isActive = false;
        this.updateRate = FLEET_BACKGROUND_UPDATE_RATE; // Default to background rate (12fps)
        this.lastUpdateTime = 0;
        this.updateInterval = FLEET_UPDATE_INTERVAL_MS; // ~83ms for 12fps
        this.accumulatedTime = 0; // For time-based updates
    }

    start() {
        if (this.isActive) {
            console.warn('BackgroundFleetSimulator is already active');
            return;
        }
        this.isActive = true;
        this.lastUpdateTime = 0; // Will be set on first update
        this.accumulatedTime = 0;
        console.log('BackgroundFleetSimulator started');
    }

    stop() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        console.log('BackgroundFleetSimulator stopped');
    }

    setUpdateRate(rate) {
        this.updateRate = rate;
        this.updateInterval = 1000 / rate;
        console.log(`BackgroundFleetSimulator update rate set to ${rate} fps`);
    }

    update(currentTime) {
        if (!this.isActive) {
            return;
        }

        // Calculate deltaTime since last frame
        const deltaTime = this.lastUpdateTime === 0 ? 0 : (currentTime - this.lastUpdateTime);
        this.lastUpdateTime = currentTime;
        this.accumulatedTime += deltaTime;

        // Check if enough time has passed for next update
        // We may need to do multiple updates if frame rate is slower than update rate
        while (this.accumulatedTime >= this.updateInterval) {
            // Get fleet data from playerDataManager
            const fleet = playerDataManager.data.fleet;
            if (!fleet || fleet.length === 0) {
                this.accumulatedTime = 0; // Reset accumulator
                return;
            }

            const planets = planetManager.celestialBodies || [];
            if (planets.length === 0) {
                this.accumulatedTime -= this.updateInterval;
                continue;
            }

            // Get world dimensions (use space scene's world dimensions if available, otherwise default)
            let worldWidth, worldHeight;
            if (gameManager.spaceScene) {
                worldWidth = gameManager.spaceScene.WORLD_WIDTH || canvas.width * 200;
                worldHeight = gameManager.spaceScene.WORLD_HEIGHT || canvas.height * 200;
            } else {
                // Default world dimensions if space scene not initialized yet
                worldWidth = canvas.width * 200;
                worldHeight = canvas.height * 200;
            }

            const physicsDeltaSec = this.updateInterval / 1000;

            fleetManager.updateFleetPhysics(fleet, planets, worldWidth, worldHeight, physicsDeltaSec);

            // Subtract one interval from accumulator (carry over remainder for smooth timing)
            this.accumulatedTime -= this.updateInterval;
        }
    }
}

const gameManager = {
    activeScene: null,
    savedState: null, // Add this to store the saved scene state
    spaceScene: null, // Store reference to space scene
    fleetDispatchMode: null, // Store fleet dispatch mode
    backgroundFleetSimulator: new BackgroundFleetSimulator(), // Task 8.1.3: Background simulator instance
    _lastLoopTime: 0,
    _loopBound: null,
    _hiddenTabIntervalId: null,
    _gameLoopStarted: false,

    isPilotingInSpaceScene() {
        return this.activeScene?.name === 'space';
    },

    startGameLoop() {
        if (this._gameLoopStarted) return;
        this._gameLoopStarted = true;
        this._loopBound = (time) => this.tick(time);
        document.addEventListener('visibilitychange', () => this._onVisibilityChange());
        if (document.hidden) {
            this._startHiddenTabInterval();
        } else {
            this._scheduleNextFrame();
        }
    },

    _onVisibilityChange() {
        if (document.hidden) {
            this._startHiddenTabInterval();
        } else {
            this._stopHiddenTabInterval();
            this._lastLoopTime = 0;
            this._scheduleNextFrame();
        }
    },

    _startHiddenTabInterval() {
        if (this._hiddenTabIntervalId) return;
        this._hiddenTabIntervalId = setInterval(() => {
            this.tick(performance.now());
        }, HIDDEN_TAB_UPDATE_INTERVAL_MS);
    },

    _stopHiddenTabInterval() {
        if (!this._hiddenTabIntervalId) return;
        clearInterval(this._hiddenTabIntervalId);
        this._hiddenTabIntervalId = null;
    },

    _scheduleNextFrame() {
        if (!document.hidden && this._loopBound) {
            requestAnimationFrame(this._loopBound);
        }
    },

    tick(currentTime) {
        let deltaSec = 0;
        if (this._lastLoopTime > 0) {
            deltaSec = (currentTime - this._lastLoopTime) / 1000;
            deltaSec = Math.min(deltaSec, GAME_LOOP_MAX_DELTA_SEC);
        }
        this._lastLoopTime = currentTime;

        this.backgroundFleetSimulator.update(currentTime);

        if (this.activeScene) {
            this.activeScene.update(deltaSec);
            if (!document.hidden) {
                this.activeScene.draw();
            }
        }

        this._scheduleNextFrame();
    },

    /** @deprecated Use startGameLoop() — kept for callers that still invoke loop() once */
    loop() {
        this.startGameLoop();
    },

    switchScene(scene, newSettings = {}) {
        if (this.activeScene?.stop) {
            this.activeScene.stop();
        }
        
        // Task 8.1.5: Implement rate switching logic for active/background modes
        const wasSpaceScene = this.activeScene && this.activeScene.name === 'space';
        const isSpaceScene = scene && scene.name === 'space';
        
        // Switch update rate based on scene
        if (isSpaceScene && !wasSpaceScene) {
            // Entering space scene - switch to active rate (60fps)
            this.backgroundFleetSimulator.setUpdateRate(FLEET_ACTIVE_UPDATE_RATE);
        } else if (!isSpaceScene && wasSpaceScene) {
            // Leaving space scene - switch to background rate (12fps)
            this.backgroundFleetSimulator.setUpdateRate(FLEET_BACKGROUND_UPDATE_RATE);
        }
        
        Object.assign(settings, newSettings);
        this.activeScene = scene;
        musicManager.playPlaylistForScene(scene.name || 'menu');
        scene.start(settings);
    },
    
    // Method to get space scene instance
    getSpaceScene() {
        if (!this.spaceScene) {
            this.spaceScene = new SpaceScene();
        }
        return this.spaceScene;
    },

    // NEW: Function to save the state of the current scene
    saveState() {
        if (this.activeScene && this.activeScene.name === 'space') {
            this.savedState = {
                shipX: this.activeScene.ship.x,
                shipY: this.activeScene.ship.y,
                shipVelX: this.activeScene.ship.velX,
                shipVelY: this.activeScene.ship.velY,
                shipAngle: this.activeScene.ship.angle,
            };
            console.log("SpaceScene state SAVED:", this.savedState);
        }
    },

    // NEW: Function to restore the state to the space scene
    restoreState() {
        if (this.savedState && this.activeScene && this.activeScene.name === 'space') {
            const ship = this.activeScene.ship;
            ship.x = this.savedState.shipX;
            ship.y = this.savedState.shipY;
            ship.velX = this.savedState.shipVelX;
            ship.velY = this.savedState.shipVelY;
            ship.angle = this.savedState.shipAngle;
            console.log("SpaceScene state RESTORED.");
            this.savedState = null; // Clear the saved state after restoring
        }
    }
};
