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

        // --- Mouse State ---
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseWorldX = 0; // Mouse position in world coordinates
        this.mouseWorldY = 0; // Mouse position in world coordinates
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
        // --- Tooltip Logic Hover & Display Data ---
        let hoveredObject = null;
        // Check for hover over planets
        for (const p of celestialBodies) {
            const dist = Math.hypot(this.mouseWorldX - p.x, this.mouseWorldY - p.y);
            if (dist < p.radius) {
                hoveredObject = { ...p, type: 'Planet' };
                break;
            }
        }

        // Check for hover over docks (if no planet was found)
        if (!hoveredObject) {
            for (const d of this.spaceScene.spaceDocks) {
                if (this.mouseWorldX > d.x - 1000 && this.mouseWorldX < d.x + 1000 &&
                    this.mouseWorldY > d.y - 1000 && this.mouseWorldY < d.y + 1000) {
                    hoveredObject = { ...d, type: 'Dock', name: 'Space Dock Alpha' };
                    break;
                }
            }
        }

        // If we found a hovered object, draw its tooltip
        if (hoveredObject) {
            const ship = this.spaceScene.ship;
            const distance = Math.hypot(ship.x - hoveredObject.x, ship.y - hoveredObject.y);

            const fontSize = Math.max(800, 25 / this.zoom); // Dynamic font size that scales with zoom
            ctx.font = `bold ${fontSize}px "Orbitron"`;
            ctx.fillStyle = '#a0e0ff';
            ctx.textAlign = 'center';

            const textYOffset = (hoveredObject.radius || 500) + fontSize * 1.5;

            ctx.fillText(hoveredObject.name, hoveredObject.x, hoveredObject.y + textYOffset);
            ctx.font = `${fontSize * 0.8}px "Consolas"`;
            ctx.fillText(`${Math.floor(distance).toLocaleString()} m`, hoveredObject.x, hoveredObject.y + textYOffset + fontSize);
        }
        // --- NEW WAYPOINT DRAWING LOGIC ---
        ctx.lineWidth = 400; // Make rings thick enough to see when zoomed out

        // Draw intermediate waypoints (white rings)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.waypoints.forEach(wp => {
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, (wp.radius || 2000) + 800, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw the final waypoint (yellow ring)
        if (this.finalWaypoint) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(this.finalWaypoint.x, this.finalWaypoint.y, (this.finalWaypoint.radius || 2000) + 800, 0, Math.PI * 2);
            ctx.stroke();
        }
        // --- NEW NAVIGATION LINE LOGIC ---
        // First, create a complete, ordered list of all points on the route.
        const routePoints = [this.spaceScene.ship, ...this.waypoints];
        if (this.finalWaypoint) {
            routePoints.push(this.finalWaypoint);
        }

        // Now, draw the lines connecting each point in the route.
        if (routePoints.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 250; // Thin line
            ctx.setLineDash([1000, 1500]); // Creates a dashed line effect!

            ctx.beginPath();
            // Start the line at the first point (always the ship)
            ctx.moveTo(routePoints[0].x, routePoints[0].y);

            // Draw a line to each subsequent point in the array
            for (let i = 1; i < routePoints.length; i++) {
                ctx.lineTo(routePoints[i].x, routePoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]); // Reset to a solid line for other drawing
        }
        ctx.restore(); // This restores the context, removing the pan and zoom for any UI drawing
    }

    handleZoom(event) {
        const zoomAmount = 0.1;
        // event.deltaY is negative when scrolling up (zoom in), positive when scrolling down (zoom out)
        if (event.deltaY < 0) {
            this.zoom *= (1 + zoomAmount);
        } else {
            this.zoom *= (1 - zoomAmount);
        }

        // Calculate minimum zoom to ensure the world always fits in the canvas
        const minZoomX = this.navCanvas.width / this.spaceScene.WORLD_WIDTH;
        const minZoomY = this.navCanvas.height / this.spaceScene.WORLD_HEIGHT;
        const minZoom = Math.min(minZoomX, minZoomY); // Use the smaller value to ensure both dimensions fit

        // Calculate maximum zoom - let's say 10x the minimum zoom for reasonable detail viewing
        const maxZoom = minZoom * 10;

        // Clamp the zoom to reasonable limits
        this.zoom = Math.max(minZoom, Math.min(this.zoom, maxZoom));

        // After changing zoom, re-clamp the pan to prevent showing empty space
        this.clampPan();
    }

    handlePanStart(event) {
        this.isPanning = true;
        this.lastPanX = event.clientX;
        this.lastPanY = event.clientY;
        this.navScreenElement.style.cursor = 'grabbing'; // Change cursor to show panning is active
    }

    handlePanMove(event) {
        if (this.isPanning) {
            const dx = event.clientX - this.lastPanX;
            const dy = event.clientY - this.lastPanY;

            this.panX += dx;
            this.panY += dy;

            this.lastPanX = event.clientX;
            this.lastPanY = event.clientY;

            // Clamp the pan to prevent showing empty space
            this.clampPan();
        }
    }

    handlePanEnd(event) {
        this.isPanning = false;
        this.navScreenElement.style.cursor = 'default'; // Change cursor back to normal
    }


    clampPan() {
        // Calculate the position of the world's center point on the map
        const worldCenterX = this.spaceScene.WORLD_WIDTH / 2;
        const worldCenterY = this.spaceScene.WORLD_HEIGHT / 2;

        // Calculate the maximum distance the pan can be from the center
        const maxPanX = worldCenterX * this.zoom;
        const maxPanY = worldCenterY * this.zoom;

        // Calculate the minimum distance needed to keep the map on screen
        const minPanX = this.navCanvas.width - maxPanX;
        const minPanY = this.navCanvas.height - maxPanY;

        // Clamp the pan values. The logic is slightly different if the map is smaller than the canvas.
        if (maxPanX > this.navCanvas.width / 2) {
            this.panX = Math.max(minPanX, Math.min(this.panX, maxPanX));
        } else {
            this.panX = this.navCanvas.width / 2;
        }

        if (maxPanY > this.navCanvas.height / 2) {
            this.panY = Math.max(minPanY, Math.min(this.panY, maxPanY));
        } else {
            this.panY = this.navCanvas.height / 2;
        }
    }

    handleMouseMove(event) {
        const rect = this.navCanvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        // Convert screen coordinates to world coordinates
        const worldCenterX = this.spaceScene.WORLD_WIDTH / 2;
        const worldCenterY = this.spaceScene.WORLD_HEIGHT / 2;
        this.mouseWorldX = (this.mouseX - this.panX) / this.zoom + worldCenterX;
        this.mouseWorldY = (this.mouseY - this.panY) / this.zoom + worldCenterY;
    }

    getObjectAtMouse() {
        // Check for planets first
        for (const p of celestialBodies) {
            if (Math.hypot(this.mouseWorldX - p.x, this.mouseWorldY - p.y) < p.radius) {
                return p;
            }
        }
        // Then check for docks
        for (const d of this.spaceScene.spaceDocks) {
            if (this.mouseWorldX > d.x - 1000 && this.mouseWorldX < d.x + 1000 &&
                this.mouseWorldY > d.y - 1000 && this.mouseWorldY < d.y + 1000) {
                return { ...d, name: 'Space Dock Alpha' }; // Return a consistent object
            }
        }
        return null; // Nothing found
    }
    // --- ADD THIS MAIN WAYPOINT FUNCTION ---
    handleSetWaypoint(event) {
        const clickedObject = this.getObjectAtMouse();
        if (!clickedObject) return; // Exit if the click was on empty space

        // --- LEFT CLICK LOGIC (Final Waypoint) ---
        if (event.button === 0) {
            // If we clicked the object that is ALREADY the final waypoint, deselect it.
            if (this.finalWaypoint && this.finalWaypoint.id === clickedObject.id) {
                this.finalWaypoint = null;
            } else {
                // Otherwise, set it as the new final waypoint.
                this.finalWaypoint = clickedObject;
            }
        }

        // --- RIGHT CLICK LOGIC (Intermediate Waypoints) ---
        if (event.button === 2) {
            const index = this.waypoints.findIndex(wp => wp.id === clickedObject.id);
            // If the object is already in the waypoints array, remove it.
            if (index > -1) {
                this.waypoints.splice(index, 1);
            } else {
                // Otherwise, add it to the array.
                this.waypoints.push(clickedObject);
            }
        }
    }

    arriveAtNextWaypoint() {
        if (this.waypoints.length > 0) {
            // Remove the first waypoint from the list.
            this.waypoints.shift();
            console.log("Waypoint reached. Advancing to next.");
        } else if (this.finalWaypoint) {
            // If there are no more intermediate waypoints, clear the final one.
            this.finalWaypoint = null;
            console.log("Final destination reached.");
        }
    }


    update() {
        if (!this.isOpen) return;
        // Logic for handling pan, zoom, and hover will go here in the next steps
    }
}
