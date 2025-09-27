// scripts/ui/nav_screen.js

class NavScreen {
    constructor(spaceScene) {
        // --- State ---
        this.isOpen = false;
        this.spaceScene = spaceScene; // Keep a reference to the main scene

        // --- HTML Elements ---
        this.navScreenElement = document.getElementById('nav-screen');
        this.navCanvas = document.getElementById('navCanvas');
        this.navCtx = this.navCanvas.getContext('2d');

        // --- Map View State ---
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;

        // --- Waypoints ---
        this.waypoints = [];
        this.finalWaypoint = null;
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
        this.navScreenElement.style.display = 'block';

        // Make sure the canvas drawing buffer matches its display size
        this.navCanvas.width = this.navCanvas.clientWidth;
        this.navCanvas.height = this.navCanvas.clientHeight;

        // When the map opens, reset the view to show the whole world
        const worldRatio = this.spaceScene.WORLD_WIDTH / this.spaceScene.WORLD_HEIGHT;
        const canvasRatio = this.navCanvas.width / this.navCanvas.height;

        if (worldRatio > canvasRatio) {
            this.zoom = this.navCanvas.width / this.spaceScene.WORLD_WIDTH;
        } else {
            this.zoom = this.navCanvas.height / this.spaceScene.WORLD_HEIGHT;
        }

        // Center the view
        this.panX = this.navCanvas.width / 2;
        this.panY = this.navCanvas.height / 2;

        console.log("Nav Screen Shown");
    }

    hide() {
        this.isOpen = false;
        this.navScreenElement.style.display = 'none';
        console.log("Nav Screen Hidden");
    }

    // --- NEW DRAWING LOGIC ---
    draw() {
        if (!this.isOpen) return;



        const ctx = this.navCtx; // Use our dedicated nav canvas context
        ctx.clearRect(0, 0, this.navCanvas.width, this.navCanvas.height);

        // --- Apply Pan and Zoom ---
        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        // Center the view on the middle of the world, not the top-left
        ctx.translate(-this.spaceScene.WORLD_WIDTH / 2, -this.spaceScene.WORLD_HEIGHT / 2);

        // --- Draw Grid Lines (optional but cool!) ---
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1 / this.zoom; // Keep lines thin even when zoomed in
        for (let x = 0; x <= this.spaceScene.WORLD_WIDTH; x += 5000) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.spaceScene.WORLD_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= this.spaceScene.WORLD_HEIGHT; y += 5000) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.spaceScene.WORLD_WIDTH, y);
            ctx.stroke();
        }


        // --- Draw Planets ---
        celestialBodies.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fill();
        });

        // --- Draw Docks ---
        this.spaceScene.spaceDocks.forEach(d => {
            ctx.beginPath();
            const spikes = 6;
            const outerRadius = 2800;
            const innerRadius = 1400;
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes;
                const x = d.x + Math.cos(angle) * radius;
                const y = d.y + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(40, 219, 239, 0.9)';
            ctx.fill();
        });

        // --- Draw Ship ---
        const ship = this.spaceScene.ship;
        if (ship) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle);
            ctx.fillStyle = 'red';
            ctx.beginPath(); // Draw an equilateral triangle for the ship
            const sideLength = 3000;
            const height = sideLength * (Math.sqrt(3) / 2); // Height of equilateral triangle
            const halfBase = sideLength / 2;

            ctx.moveTo(0, -height / 2);           // Top point
            ctx.lineTo(halfBase, height / 2);     // Bottom right
            ctx.lineTo(-halfBase, height / 2);    // Bottom left
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore(); // This restores the context, removing the pan and zoom for any UI drawing
    }

    update() {
        if (!this.isOpen) return;
        // Logic for handling pan, zoom, and hover will go here in the next steps
    }
}