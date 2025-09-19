const spaceDockScene = {
    name: 'menu', // We can reuse the menu music for now
    
    start(settings) {
        console.log("Starting SpaceDock Scene...");
        // Hide other UI elements and show the ones for this scene
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        descentUI.style.display = 'none';
        zoomControls.style.display = 'none';
        document.getElementById('dock-ui').style.display = 'block';

        canvas.style.display = 'block';
    },

    stop() {
        // This function will be called when we leave the scene
        console.log("Stopping SpaceDock Scene...");
        document.getElementById('dock-ui').style.display = 'none';
    },

    update() {
        // Nothing is moving yet, so this is empty for now.
    },

    draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the background image, covering the whole canvas
        if (spaceDockTerminalImage.isLoaded || spaceDockTerminalImage.complete) {
            ctx.drawImage(spaceDockTerminalImage, 0, 0, canvas.width, canvas.height);
        }
    },

    handleKeys(e, isDown) {
        // We will use this later for keyboard shortcuts.
    }
};

