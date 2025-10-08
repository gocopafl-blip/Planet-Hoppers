// scripts/managers/game_manager.js

const gameManager = {
    activeScene: null,
    savedState: null, // Add this to store the saved scene state
    spaceScene: null, // Store reference to space scene
    fleetDispatchMode: null, // Store fleet dispatch mode

    loop() {
        if (this.activeScene) {
            this.activeScene.update();
            this.activeScene.draw();
        }
        requestAnimationFrame(this.loop.bind(this));
    },

    switchScene(scene, newSettings = {}) {
        if (this.activeScene?.stop) {
            this.activeScene.stop();
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