// scripts/main.js

const dockTypes = {
    alpha: {
        src: 'images/spacedockalpha.png',
        img: new Image()
    },
    // When you're ready for a second dock, you'd just add it here!
    // beta: { 
    //     src: 'images/spacedockbeta.png', 
    //     img: new Image() 
    // }
};
const shipTypes = {
    scout: { src: 'images/lander-scout.png', width: 40, height: 40, img: new Image(), thrusterOffset: 20 },
    classic: { src: 'images/lander-classic.png', width: 80, height: 80, img: new Image(), thrusterOffset: 40 },
    heavy: { src: 'images/lander-heavy.png', width: 160, height: 160, img: new Image(), thrusterOffset: 65 }
};
//const spaceShipImage = new Image();
const planetImages = [new Image(), new Image(), new Image()];
let celestialBodies = [];
let settings = {};
const playerDataManager = new PlayerDataManager();
const planetManager = new PlanetManager();
const missionManager = new MissionManager();
const tradeManager = new TradeManager();
const fleetManager = new FleetManager();






// AssetManager instance is now created in asset_manager.js

// Link AssetManager assets to existing game objects
function linkAssetsToGameObjects() {
    // Link ship images
    shipTypes.scout.img = assetManager.getImage('lander_scout') || shipTypes.scout.img;
    shipTypes.classic.img = assetManager.getImage('lander_classic') || shipTypes.classic.img;
    shipTypes.heavy.img = assetManager.getImage('lander_heavy') || shipTypes.heavy.img;

    // Link dock images
    dockTypes.alpha.img = assetManager.getImage('space_dock_alpha') || dockTypes.alpha.img;

    // Link planet images (keeping these for legacy compatibility)
    const planet1 = assetManager.getImage('planet1');
    const planet2 = assetManager.getImage('planet2');
    const planet3 = assetManager.getImage('planet3');

    if (planet1) Object.assign(planetImages[0], planet1);
    if (planet2) Object.assign(planetImages[1], planet2);
    if (planet3) Object.assign(planetImages[2], planet3);

    console.log("🔗 Assets linked to game objects successfully!");
}

// --- INITIALIZATION ---
function init() {
    playerDataManager.loadData();

    // Phase 2: Clean AssetManager-based loading
    console.log("🚀 Loading all game assets...");

    let fontsLoaded = false;

    // Font loading check
    function waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                console.log("✅ Fonts loaded!");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            });
        } else {
            setTimeout(() => {
                console.log("✅ Font loading fallback completed");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            }, 1000);
        }
    }

    function checkAllAssetsLoaded() {
        if (fontsLoaded && assetManager.getProgress() === 1) {
            console.log("🎉 All game assets loaded!");

            // Link assets to existing objects
            linkAssetsToGameObjects();

            // Initialize audio now that assets are loaded
            if (window.musicManager && typeof musicManager.preloadAll === 'function') {
                musicManager.preloadAll();
            }
            if (typeof window.initializeSfx === 'function') {
                window.initializeSfx();
            }

            // Setup event listeners
            setupEventListeners();

            // Initialize the game
            landerScene.createStars();
            loadingScreen.style.display = 'none';
            startScreen.style.display = 'block';

            // Start the game loop
            startGame();
        }
    }

    // Load all assets through AssetManager
    assetManager.loadAllAssets(
        () => {
            console.log("✅ AssetManager: All assets loaded!");
            checkAllAssetsLoaded();
        },
        (loaded, total) => {
            const percent = Math.round(loaded / total * 100);
            console.log(`📦 Asset loading progress: ${loaded}/${total} (${percent}%)`);

            // Update loading screen
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: white; font-family: 'Orbitron', Arial, sans-serif;">
                    <h2>LOADING PLANET HOPPERS</h2>
                    <div style="width: 300px; height: 20px; border: 2px solid #00ff00; margin: 20px auto; background: rgba(0,0,0,0.5);">
                        <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #00ff00, #00aa00); transition: width 0.3s;"></div>
                    </div>
                    <p>${loaded}/${total} assets loaded (${percent}%)</p>
                </div>
            `;
            // Properly center the loading screen
            loadingScreen.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
            `;
        }
    );

    waitForFonts();
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
    const missionBoard = document.getElementById('mission-board');
    const missionList = document.getElementById('mission-list');

    // --- Removed: Dock menu, mission board, and trade hub listeners now handled in their respective scene files ---

    const spaceScene = new SpaceScene();
    const navScreenElement = document.getElementById('nav-screen');
    canvas.addEventListener('click', (event) => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space') {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Define the radar's position and size (from space_scene.js)
            const radarRadius = 100;
            const radarX = canvas.width - radarRadius - 20;
            const radarY = radarRadius + 20;

            // Check if the click was inside the radar circle
            if (Math.hypot(x - radarX, y - radarY) <= radarRadius) {
                gameManager.activeScene.navScreen.toggle();
            }
        }
    });

    document.getElementById('closeNavScreenBtn').addEventListener('click', () => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space') {
            gameManager.activeScene.navScreen.hide();
        }
    });
    navScreenElement.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevents the whole page from scrolling
        if (gameManager.activeScene && gameManager.activeScene.name === 'space' && gameManager.activeScene.navScreen && gameManager.activeScene.navScreen.isOpen) {
            gameManager.activeScene.navScreen.handleZoom(event);
        }
    });


    // This event listener handles left, middle, and right clicks
    navScreenElement.addEventListener('mousedown', (event) => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space' && gameManager.activeScene.navScreen && gameManager.activeScene.navScreen.isOpen) {
            event.preventDefault(); // Prevent default browser actions for all buttons

            if (event.button === 0) { // 0 is the left mouse button
                gameManager.activeScene.navScreen.handleSetWaypoint(event);
            } else if (event.button === 1) { // 1 is the middle mouse button
                gameManager.activeScene.navScreen.handlePanStart(event);
            } else if (event.button === 2) { // 2 is the right mouse button
                gameManager.activeScene.navScreen.handleSetWaypoint(event);
            }
        }
    });

    // We also need to prevent the right-click context menu from appearing
    navScreenElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Listen for mouse move to pan the map
    navScreenElement.addEventListener('mousemove', (event) => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space' && gameManager.activeScene.navScreen && gameManager.activeScene.navScreen.isOpen) {
            gameManager.activeScene.navScreen.handlePanMove(event);
            gameManager.activeScene.navScreen.handleMouseMove(event);
        }
    });

    // Listen for mouse up to stop panning
    navScreenElement.addEventListener('mouseup', (event) => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space' && gameManager.activeScene.navScreen && gameManager.activeScene.navScreen.isOpen) {
            gameManager.activeScene.navScreen.handlePanEnd(event);
        }
    });
    /*
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (gameManager.activeScene === spaceScene) {
            // Calculate the new zoom level, adding 0.2 for a noticeable change
            const newZoom = spaceScene.camera.targetZoom + 0.2;
            // Use Math.min to ensure the zoom doesn't go past the maximum
            spaceScene.camera.targetZoom = Math.min(newZoom, spaceScene.maxZoom);
        }
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (gameManager.activeScene === spaceScene) {
            // Calculate the new zoom level
            const newZoom = spaceScene.camera.targetZoom - 0.2;
            // Use Math.max to ensure the zoom doesn't go past the minimum
            spaceScene.camera.targetZoom = Math.max(newZoom, spaceScene.minZoom);
        }
    });
    */
    // ADD THIS NEW EVENT LISTENER
    document.getElementById('startBtn').addEventListener('click', () => {
        startScreen.style.display = 'none'; // Hide the start screen
        gameManager.switchScene(spaceDockScene); // Start with the Space Dock scene
    });
/*
    document.getElementById('departBtn').addEventListener('click', () => {
        gameManager.switchScene(spaceScene, { difficulty: 'easy' }); // For now, it will always be 'easy'
    });
    */
// Event listener for our new test button
    document.getElementById('getPaidBtn').addEventListener('click', () => {
        playerDataManager.addMoney(5000); // Give the player 500 credits
    });
    /*document.getElementById('completeMissionBtn').addEventListener('click', () => {
        missionManager.completeMission();
    });*/

    document.getElementById('accessDockBtn').addEventListener('click', () => {
        // Check if the current scene is the spaceScene before switching
        if (gameManager.activeScene && gameManager.activeScene.name === 'space') {
            gameManager.switchScene(spaceDockScene);
        }
    });
    
    document.getElementById('terminateRemoteCommandBtn').addEventListener('click', () => {
        // Check if the current scene is the spaceScene before switching
        if (gameManager.activeScene && gameManager.activeScene.name === 'space') {
            // Save space scene state before switching to fleet manager
            gameManager.activeScene.saveState();
            
            // ENHANCED: Also save ship state to fleet manager for proper fleet persistence (Task 3.6 fix)
            // This ensures the ship's current position/velocity is saved to PlayerDataManager fleet data
            fleetManager.saveCurrentShipState(playerDataManager.getActiveShip(), gameManager.activeScene);
            
            // ENHANCED: Pass settings to indicate we're returning from space scene (Task 4.6)
            gameManager.switchScene(fleetManagerScene, { fromSpaceScene: true });
        }
    });
    document.getElementById('launchBtn').addEventListener('click', () => {
        if (gameManager.activeScene && gameManager.activeScene.name === 'space' && gameManager.activeScene.ship && gameManager.activeScene.ship.isOrbitLocked) {
            gameManager.activeScene.saveState(); // Save space scene state before switching

            // Get the planet the ship is orbiting
            const orbitingPlanet = gameManager.activeScene.ship.orbitingPlanet;

            settings.selectedShip = shipTypes.classic;
            settings.planet = orbitingPlanet; // Pass the planet data to lander scene

            console.log('Launching to planet:', orbitingPlanet);
            gameManager.switchScene(landerScene, settings);
        }
    });
    document.getElementById('easyBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'easy' }));
    document.getElementById('mediumBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'medium' }));
    document.getElementById('hardBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'hard' }));

    // Mute button click handler
    document.getElementById('muteBtn').addEventListener('click', () => {
        const isMuted = musicManager.toggleMute();
        const btn = document.getElementById('muteBtn');
        btn.textContent = isMuted ? '♪̷' : '♪';
        btn.blur(); // Remove focus to prevent space bar from triggering this button
    });

    shipSelectionMenu.addEventListener('click', (event) => {
        const shipOption = event.target.closest('.ship-option');
        if (!shipOption) return;

        const shipName = shipOption.getAttribute('data-ship');
        settings.selectedShip = shipTypes[shipName];
        gameManager.switchScene(landerScene, settings);
    });

    window.addEventListener('keydown', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, true); } });
    window.addEventListener('keyup', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, false); } });

    // Global mute key handler - M key toggles music
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            e.preventDefault(); // Prevent any other handlers from processing this key
            const isMuted = musicManager.toggleMute();
            // Update the button display if it exists
            const muteBtn = document.getElementById('muteBtn');
            if (muteBtn) {
                muteBtn.textContent = isMuted ? '♪̷' : '♪';
            }
        }
    });

    canvas.addEventListener('click', () => {
        if (gameManager.activeScene === landerScene && (landerScene.gameState === 'landed' || landerScene.gameState === 'crashed')) {
            if (thrusterSound.isLoaded) thrusterSound.pause();

            if (landerScene.gameState === 'landed') {
                // SUCCESS: Return to space scene with preserved state
                console.log('Lander mission successful, returning to space scene with preserved state');
                gameManager.switchScene(spaceScene, settings);
            } else {
                // CRASHED: Return to spacedock scene (no state preservation needed)
                console.log('Lander mission failed, returning to spacedock');
                gameManager.switchScene(spaceDockScene);
            }
        }
    });
    canvas.addEventListener('wheel', event => {
        // First, prevent the browser from scrolling the whole page
        event.preventDefault();
        const scene = gameManager.activeScene; // Get the currently active scene

        // Check if the active scene has a camera and zoom limits
        if (scene && scene.camera && scene.minZoom && scene.maxZoom) {
            const zoomAmount = 0.1;
            let newZoom;

            if (event.deltaY < 0) {
                // Scrolling up -> Zoom In
                newZoom = scene.camera.targetZoom + zoomAmount;
            } else {
                // Scrolling down -> Zoom Out
                newZoom = scene.camera.targetZoom - zoomAmount;
            }

            // Clamp the zoom level to the min/max values to prevent extreme zooming
            scene.camera.targetZoom = Math.max(scene.minZoom, Math.min(newZoom, scene.maxZoom));
        }
    }, { passive: false }); // passive: false is needed to allow preventDefault
}

// --- GAME INITIALIZATION ---
function startGame() {
    // Start the main game loop
    gameManager.loop();
}

// Run the game
init();

