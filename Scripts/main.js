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
    scout:  { src: 'images/lander-scout.png',  width: 40,  height: 40,  img: new Image(), thrusterOffset: 20 },
    classic:{ src: 'images/lander-classic.png', width: 80,  height: 80,  img: new Image(), thrusterOffset: 40 },
    heavy:  { src: 'images/lander-heavy.png',   width: 160, height: 160, img: new Image(), thrusterOffset: 65 }
};
const spaceShipImage = new Image();
const planetImages = [new Image(), new Image(), new Image()];
const spaceDockImages = [new Image()];
const spaceDockTerminalImage = new Image();
let celestialBodies = [];
let settings = {};

// --- INITIALIZATION ---
function init() {
    let imagesLoaded = 0;
    let fontsLoaded = false;
    const allImages = [
        ...Object.values(shipTypes).map(s => s.img),
        ...Object.values(dockTypes).map(d => d.img),
        spaceShipImage,
        ...planetImages,
    ];
    const totalImages = allImages.length;

    function checkAllAssetsLoaded() {
        if (imagesLoaded === totalImages && fontsLoaded) {
            console.log("All game assets loaded!");
            loadingScreen.style.display = 'none';
            startScreen.style.display = 'block';
        }
    }

    function onAssetLoad() {
        imagesLoaded++;
        console.log(`Asset loaded (${imagesLoaded}/${totalImages})`);
        checkAllAssetsLoaded();
    }

    // Font loading check
    function waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            // Modern browsers with Font Loading API
            document.fonts.ready.then(() => {
                console.log("Fonts loaded!");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                console.log("Font loading fallback completed");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            }, 1000);
        }
    }

    waitForFonts();
    
    // Attach event handlers *before* setting src
    allImages.forEach(img => {
        img.onload = onAssetLoad;
        img.onerror = (e) => {
            console.error("An image failed to load:", e.target.src);
            onAssetLoad(); // Still count it as "loaded" to not block the game
        }
    });

    // Now set the src to trigger loading
    spaceShipImage.src = ASSET_BASE_URL + 'images/ship.png';
    spaceDockTerminalImage.src = ASSET_BASE_URL + 'images/spaceDockTerminal.png';
    planetImages.forEach((img, index) => {
        img.src = ASSET_BASE_URL + `images/planet${index + 1}.png`;
        img.onerror = () => {
            console.error(`Failed to load planet image ${index + 1}`);
            // Load a backup image or show a placeholder
            img.src = ASSET_BASE_URL + 'images/planet1.png';
        };
    });
    Object.values(shipTypes).forEach(ship => {
        ship.img.src = ASSET_BASE_URL + ship.src;
    });
    Object.values(dockTypes).forEach(dock => {
        dock.img.src = ASSET_BASE_URL + dock.src;
    });
    landerScene.createStars();
    
    const spaceScene = new SpaceScene();
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
    document.getElementById('descentBtn').addEventListener('click', () => {
        // We only want this to work if we are in the space scene and orbit is locked
        if (gameManager.activeScene === spaceScene && spaceScene.ship.isOrbitLocked) {
            console.log("Descent button clicked, changing scene.");

            // This is the same logic from the old collision check
            spaceScene.isPaused = true;
            if (thrusterSound.isLoaded) thrusterSound.pause();
            canvas.style.display = 'none';
            shipSelectionMenu.style.display = 'block';
            
            // Also hide the descent button itself
            descentUI.style.display = 'none'; 
        }
    });
// ADD THIS NEW EVENT LISTENER
    document.getElementById('startBtn').addEventListener('click', () => {
        startScreen.style.display = 'none'; // Hide the start screen
        //menu.style.display = 'block';      // Show the main menu
        // DISABLED DURING REFACTOR FOR SPACE DOCK SCENE
        //musicManager.playPlaylistForScene('menu');
        gameManager.switchScene(spaceDockScene); // Start with the Space Dock scene
    });
    document.getElementById('departBtn').addEventListener('click', () => {
        gameManager.switchScene(spaceScene, { difficulty: 'easy' }); // For now, it will always be 'easy'
    });

    document.getElementById('accessDockBtn').addEventListener('click', () => {
        // Check if the current scene is the spaceScene before switching
        if (gameManager.activeScene === spaceScene) {
            gameManager.switchScene(spaceDockScene);
        }
    });
    document.getElementById('launchBtn').addEventListener('click', () => {
    if (gameManager.activeScene === spaceScene && spaceScene.ship.isOrbitLocked) {
        spaceScene.saveState(); // Save space scene state before switching
        
        // Get the planet the ship is orbiting
        const orbitingPlanet = spaceScene.ship.orbitingPlanet;
        
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
    
    window.addEventListener('keydown', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, true); }});
    window.addEventListener('keyup', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, false); }});
    
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
        // This now takes you back to the space scene instead of the menu
        gameManager.switchScene(spaceScene, settings);
        gameManager.restoreState(); // <-- ADD THIS LINE
    }
});
    canvas.addEventListener('wheel', event => {
    // First, prevent the browser from scrolling the whole page
    event.preventDefault();

    // Only apply zoom if we are in the space scene
    if (gameManager.activeScene === spaceScene) {
        // Determine zoom direction (deltaY is negative for scroll up, positive for scroll down)
        const zoomAmount = 0.1;
        let newZoom;

        if (event.deltaY < 0) {
            // Scrolling up -> Zoom In
            newZoom = spaceScene.camera.targetZoom + zoomAmount;
        } else {
            // Scrolling down -> Zoom Out
            newZoom = spaceScene.camera.targetZoom - zoomAmount;
        }

        // Clamp the zoom level to the min/max values to prevent extreme zooming
        spaceScene.camera.targetZoom = Math.max(spaceScene.minZoom, Math.min(newZoom, spaceScene.maxZoom));
    }
}, { passive: false }); // passive: false is needed to allow preventDefault
    
    // Start the main game loop
    gameManager.loop();
}

// Run the game
init();

