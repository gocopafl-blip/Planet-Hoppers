const fleetManagerScene = {
    name: 'menu', // We can reuse the menu music

    start(settings) {
        console.log("Starting Fleet Manager Scene...");
        // This scene just shows a background. The fleet manager UI is a separate HTML element.
        canvas.style.display = 'block';
        const fleetManager = document.getElementById('fleet-manager');

        // Make sure it's visible before the animation starts
        fleetManager.style.display = 'none';

        // Remove any old animation classes
        fleetManager.classList.remove('slide-out', 'slide-in', 'clip-reveal', 'clip-close');

        // Add a delay before showing the missions and animating
        
        setTimeout(() => {
            fleetManager.style.display = 'flex';
            this.showFleetManager();
            // Animation is handled in showFleetManager()
        }, 500); // A 0.5 second delay

        // Add Accept Trade and Close listeners
        //this._tradeList = document.getElementById('fleet-list');
        this._closeBtn = document.getElementById('closeFleetManagerBtn');
        //if (this._tradeList) {
        //    this._tradeList.addEventListener('click', this.handleAcceptTrade);
        //}
    
        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this.handleCloseFleetManager);
        }
    },

    showFleetManager() {
        const fleetManager = document.getElementById('fleet-manager');
        // Display is already set in start(), no need to repeat
        //fleetManager.classList.add('slide-in'); // Alternative: slides in from bottom
        fleetManager.classList.add('clip-reveal'); // Expanding chamfer effect
        /*const fleetList = document.getElementById('fleet-list');

        // Get all ships from the ship catalogue
        const ships = Object.entries(shipCatalogue); // [ [id, shipData], ... ]

        tradeList.innerHTML = '';

        ships.forEach(([shipKey, ship]) => {
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade-item';
            const glamShotImage = assetManager.getImage(ship.shipGlamShot);
            const imageSrc = glamShotImage ? glamShotImage.src : '';

            tradeElement.innerHTML = `
                <img class="trade-item-image" src="${imageSrc}" alt="${ship.shipID}">
                
                <div class="trade-item-info">
                    <h3>${ship.shipID}</h3>
                    <p>${ship.shipDescription || ''}</p>
                    <div class="trade-footer">
                        <span class="trade-reward">Max Speed: ${ship.shipMaxSpeed ? ship.shipMaxSpeed.toLocaleString() : 'N/A'} %LightSpeed</span>
                        <span class="trade-cargo">Cargo Capacity: ${ship.shipCargoCapacity || 0} m<sup>3</sup></span>
                        <span class="trade-thrust">Acceleration: ${ship.shipThrustPower || 0} %LightSpeed</span>
                        <span class="trade-reward">BUY: ¢ ${ship.shipBuyValue ? ship.shipBuyValue.toLocaleString() : 'N/A'}</span>
                        <button class="accept-btn" data-ship-id="${shipKey}">Buy</button>
                    </div>
                </div>
            `;
            tradeList.appendChild(tradeElement);
        });
*/
        fleetManager.style.display = 'flex';
    },
    
    handleCloseFleetManager() {
        if (gameManager.activeScene === fleetManagerScene) {
            const fleetManager = document.getElementById('fleet-manager');
            fleetManager.classList.remove('clip-reveal');
            fleetManager.classList.add('clip-close');

            setTimeout(() => {
                gameManager.switchScene(spaceDockScene);
            }, 800); // Match the clip-close animation duration
        }
    },

    stop() {
        // We will no longer hide the board here directly.
        // The animation will handle it.
        console.log("Stopping Fleet Manager Scene...");

        // Remove Accept Trade and Close listeners
        //if (this._tradeList) {
        //    this._tradeList.removeEventListener('click', this.handleAcceptTrade);
        //}
        if (this._closeBtn) {
            this._closeBtn.removeEventListener('click', this.handleCloseFleetManager);
        }
        const fleetManager = document.getElementById('fleet-manager');
        fleetManager.style.display = 'none';
        //tradeHub.classList.remove('slide-in', 'slide-out');
    },

    update() {
        // This scene is static, so there's nothing to update each frame.
    },

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the background image for the fleet manager.
        const fleetManagerBg = assetManager.getImage('fleet_manager');
        const holodeskOverlay = assetManager.getImage('holodesk_overlay');
        
        if (fleetManagerBg && fleetManagerBg.complete) {
            ctx.drawImage(fleetManagerBg, 0, 0, canvas.width, canvas.height);
        }
        if (holodeskOverlay && holodeskOverlay.complete) {
            ctx.drawImage(holodeskOverlay, 300, 0, 600, 700);
        }
    },

    handleKeys(e, isDown) {
        // Handle any keyboard input for the fleet manager
        if (isDown && e.key === 'Escape') {
            // Example: ESC key returns to space dock
            this.handleCloseFleetManager();
        }
    },

};