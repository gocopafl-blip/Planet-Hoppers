// scripts/ui/nav_screen.js

class NavScreen {
    constructor() {
        this.isOpen = false;
        this.zoom = 1.0; // The zoom level of the map
        this.panX = 0;   // The horizontal pan/offset of the map
        this.panY = 0;   // The vertical pan/offset of the map

        this.waypoints = [];       // Array to store intermediate waypoints
        this.finalWaypoint = null; // The final destination
        this.navScreenElement = document.getElementById('nav-screen');
        this.navCanvas = document.getElementById('navCanvas');
        this.navCtx = this.navCanvas.getContext('2d');
    }

    // Toggles the nav screen between open and closed
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        this.isOpen = true;
        this.navScreenElement.style.display = 'block';// Logic to show the HTML element will go here
        console.log("Nav Screen Opened");
    }

    hide() {
        this.isOpen = false;
        this.navScreenElement.style.display = 'none';
        console.log("Nav Screen Closed");
    }

    update() {
        if (!this.isOpen) return;
        // Logic for handling pan, zoom, and hover will go here
    }

    draw(ctx) {
        if (!this.isOpen) return;
        // All the map drawing logic will go here
    }
}