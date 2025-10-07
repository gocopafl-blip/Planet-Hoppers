const spaceDockScene = {
    name: 'menu', // We can reuse the menu music for now

    start(settings) {
        console.log("Starting SpaceDock Scene...");
        // Hide other UI elements and show the ones for this scene
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        //zoomControls.style.display = 'none';
        document.getElementById('dock-ui').style.display = 'block';

        canvas.style.display = 'block';

        // Add dock menu listeners
        this._orbitalCargoLi = document.querySelector('#dock-menu li:nth-child(2)');
        this._galacticTradeHubLi = document.querySelector('#dock-menu li:nth-child(4)');
        this._fleetManagerLi = document.querySelector('#dock-menu li:nth-child(7)');
        if (this._orbitalCargoLi) {
            this._orbitalCargoLi.addEventListener('click', this.handleOrbitalCargoClick);
        }
        if (this._galacticTradeHubLi) {
            this._galacticTradeHubLi.addEventListener('click', this.handleGalacticTradeHubClick);
        }
        if (this._fleetManagerLi) {
            this._fleetManagerLi.addEventListener('click', this.handleFleetManagerClick);
        }
    },

    stop() {
        // This function will be called when we leave the scene
        console.log("Stopping SpaceDock Scene...");
        document.getElementById('dock-ui').style.display = 'none';
        document.getElementById('mission-board').style.display = 'none';

        // Remove dock menu listeners
        if (this._orbitalCargoLi) {
            this._orbitalCargoLi.removeEventListener('click', this.handleOrbitalCargoClick);
        }
        if (this._galacticTradeHubLi) {
            this._galacticTradeHubLi.removeEventListener('click', this.handleGalacticTradeHubClick);
        }
        if (this._fleetManagerLi) {
            this._fleetManagerLi.removeEventListener('click', this.handleFleetManagerClick);
        }
    },

    update() {
        // Nothing is moving yet, so this is empty for now.
    },

    draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the background image, covering the whole canvas
        const spaceDockTerminal = assetManager.getImage('space_dock_terminal');
        if (spaceDockTerminal && spaceDockTerminal.complete) {
            ctx.drawImage(spaceDockTerminal, 0, 0, canvas.width, canvas.height);
        }
    },

    handleKeys(e, isDown) {
        // We will use this later for keyboard shortcuts.
    },
    // Handler functions for dock menu
    handleOrbitalCargoClick(event) {
        gameManager.switchScene(missionBoardScene);
    },
    handleGalacticTradeHubClick(event) {
        gameManager.switchScene(galacticTradeHubScene);
    },
    handleFleetManagerClick(event) {
        gameManager.switchScene(fleetManagerScene);
    }
};

