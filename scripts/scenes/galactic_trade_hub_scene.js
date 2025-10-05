// scripts/scenes/galactic_trade_hub_scene.js

const galacticTradeHubScene = {
    name: 'menu', // We can reuse the menu music

    start(settings) {
        console.log("Starting Galactic Trade Hub Scene...");
        // This scene just shows a background. The trade hub UI is a separate HTML element.
        canvas.style.display = 'block';
        const tradeHub = document.getElementById('trade-hub');

        // Make sure it's visible before the animation starts
        tradeHub.style.display = 'none';

        // Remove any old animation classes
        tradeHub.classList.remove('slide-out');

        // Add a delay before showing the missions and animating
        setTimeout(() => {
            tradeHub.style.display = 'flex';
            this.showTradeHub();
            tradeHub.classList.add('slide-in');
        }, 500); // A 0.5 second delay

        // Add Accept Trade and Close listeners
        this._tradeList = document.getElementById('trade-list');
        this._closeBtn = document.getElementById('closeTradeHubBtn');
        if (this._tradeList) {
            this._tradeList.addEventListener('click', this.handleAcceptTrade);
        }
        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this.handleCloseTradeHub);
        }
    },

    stop() {
        // We will no longer hide the board here directly.
        // The animation will handle it.
        console.log("Stopping Galactic Trade Hub Scene...");

        // Remove Accept Trade and Close listeners
        if (this._tradeList) {
            this._tradeList.removeEventListener('click', this.handleAcceptTrade);
        }
        if (this._closeBtn) {
            this._closeBtn.removeEventListener('click', this.handleCloseTradeHub);
        }
        const tradeHub = document.getElementById('trade-hub');
        tradeHub.style.display = 'none';
        //tradeHub.classList.remove('slide-in', 'slide-out');
    },

    handleAcceptTrade(event) {
        if (event.target.classList.contains('accept-btn')) {
            const shipId = event.target.dataset.shipId;
            fleetManager.buyShip(shipId);

            const tradeHub = document.getElementById('trade-hub');
            tradeHub.classList.remove('slide-in');
            tradeHub.classList.add('slide-out');

            setTimeout(() => {
                if (gameManager.activeScene === galacticTradeHubScene) {
                    gameManager.switchScene(spaceDockScene);
                }
            }, 500);
        }
    },

    handleCloseTradeHub() {
        if (gameManager.activeScene === galacticTradeHubScene) {
            const tradeHub = document.getElementById('trade-hub');
            tradeHub.classList.remove('slide-in');
            tradeHub.classList.add('slide-out');

            setTimeout(() => {
                gameManager.switchScene(spaceDockScene);
            }, 500);
        }
    },


    showTradeHub() {
        const tradeHub = document.getElementById('trade-hub');
        const tradeList = document.getElementById('trade-list');

        // Get all ships from the ship catalogue
        const ships = Object.entries(shipCatalogue); // [ [id, shipData], ... ]

        tradeList.innerHTML = '';

        ships.forEach(([shipKey, ship]) => {
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade-item';
            tradeElement.innerHTML = `
                <h3>${ship.shipID}</h3>
                <p>${ship.shipDescription || ''}</p>
                <div class="trade-footer">
                    <span class="trade-reward">BUY: ¢ ${ship.shipBuyValue ? ship.shipBuyValue.toLocaleString() : 'N/A'}</span>
                    <span class="trade-reward">SELL: ¢ ${ship.shipSellValue ? ship.shipSellValue.toLocaleString() : 'N/A'}</span>
                    <span class="trade-cargo">Cargo: ${ship.shipCargoCapacity || 0}</span>
                    <span class="trade-thrust">Thrust: ${ship.shipThrustPower || 0}</span>
                    <button class="accept-btn" data-ship-id="${shipKey}">Buy</button>
                </div>
            `;
            tradeList.appendChild(tradeElement);
        });

        tradeHub.style.display = 'flex';
    },

    update() {
        // This scene is static, so there's nothing to update each frame.
    },

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the background image for the trade hub.
        const tradeHubBg = assetManager.getImage('galactic_trade_hub');
        if (tradeHubBg && tradeHubBg.complete) {
            ctx.drawImage(tradeHubBg, 0, 0, canvas.width, canvas.height);
        }
    },

    handleKeys(e, isDown) {
        // Handle any keyboard input for the trade hub
        if (isDown && e.key === 'Escape') {
            // Example: ESC key returns to space dock
            gameManager.switchScene(spaceDockScene);
        }
    },

};