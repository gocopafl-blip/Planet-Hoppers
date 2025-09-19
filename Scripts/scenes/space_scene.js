 // --- Space Scene ---
class SpaceScene {
    constructor() {
        // --- Scene State ---
        this.name = 'space'; // Give the scene a name for the MusicManager
        this.ship = null;
        this.stars = [];
        this.particles = []; // For thruster effects
        this.spaceDocks = []; // Array to hold all space docks
        this.difficulty = 'easy';
        this.isPaused = false;
        this.camera = null;
        //this.orbitData = null;
        this.dockingRadius = 1000;
        
        // --- World Settings ---
        this.WORLD_WIDTH = canvas.width * 200;
        this.WORLD_HEIGHT = canvas.height * 200;

        // --- Core Movement Settings ---
        this.ROTATION_SPEED = 0.005;  // Halved for more precise rotation control
        this.THRUST_POWER = 0.03;    // Reduced for smoother acceleration

        // --- Orbital Mechanics Settings ---
        this.GRAVITY_BOUNDARY_MULTIPLIER = 1.35;  // Gravity well extends to 1.5x planet radius
        this.ORBITAL_CONSTANT = 0.00035;         // Reduced for more manageable orbital velocities
        this.PLANET_MASS_SCALAR = 0.4;           // Reduced mass to prevent excessive gravitational acceleration

        // --- Camera Settings ---
        this.minZoom = 0.1; // minZoom is now used to configure the camera
        this.maxZoom = 2.0;
        //this.maxSpeedForZoom = 15; Used for dynamic zoom - currently disabled
        this.zoomSmoothing = 0.03;

        // --- Orbit Lock Settings ---
        this.ORBIT_LOCK_DURATION = 2;       // Time in seconds to lock orbit.
        this.orbitLockTimer = 0;

        // Central place for all flight model speed definitions
        this.MIN_DOCKING_SPEED = 0.1;
        this.MAX_DOCKING_SPEED = 1.0;
        this.MIN_ORBIT_SPEED = 2.0;
        this.MAX_ORBIT_SPEED = 5.0;
        this.GRAVITY_ASSIST_MIN_SPEED = 5.01;
        this.GRAVITY_ASSIST_MAX_SPEED = 10.0;
        this.MAX_SAFE_STRUCTURAL_SPEED = 25.0;
    }

getRotatedPosition(offsetX, offsetY) {
    const ship = this.ship;
    const correctedAngle = ship.angle + Math.PI / 2;
    const cos = Math.cos(correctedAngle);
    const sin = Math.sin(correctedAngle);
    return {
        x: ship.x + (offsetX * cos) - (offsetY * sin),
        y: ship.y + (offsetX * sin) + (offsetY * cos)
    };
}

emitThrusterParticles() {
    if (!this.ship) return;
    const ship = this.ship;

    // Helper function to emit a particle from a thruster
    const emitFromThruster = (thruster, baseAngle, speed, isRotation = false) => {
        const pos = this.getRotatedPosition(thruster.x, thruster.y);
        // Calculate final angle based on ship's orientation and thruster's outward angle
        const particleAngle = ship.angle + baseAngle + thruster.outwardAngle;
        this.particles.push(new SpaceParticle(
            pos.x, pos.y, 
            particleAngle, 
            speed, 
            isRotation,
            ship.velX,    // Pass ship's current X velocity
            ship.velY     // Pass ship's current Y velocity
        ));
    };

    if (ship.thrusting) { // Main engines (rear thrusters) firing backward
        emitFromThruster(ship.thrusters.rear_left, Math.PI, 3);   // Rear left fires backward
        emitFromThruster(ship.thrusters.rear_right, Math.PI, 3);  // Rear right fires backward
    }

    if (ship.reversing) { // Front RCS thrusters firing forward
        emitFromThruster(ship.thrusters.front_left, 0, 2);    // Front left fires forward
        emitFromThruster(ship.thrusters.front_right, 0, 2);   // Front right fires forward
    }

    if (ship.rotatingRight) { // Clockwise rotation
        // Right side thrusters fire outward
        emitFromThruster(ship.thrusters.front_left, 0, 1, true);       // Front right fires outward
        emitFromThruster(ship.thrusters.rear_right, Math.PI, 1, true);  // Rear right fires outward
    }

    if (ship.rotatingLeft) { // Counter-clockwise rotation
        // Left side thrusters fire outward
        emitFromThruster(ship.thrusters.front_right, 0, 1, true);       // Front left fires outward
        emitFromThruster(ship.thrusters.rear_left, Math.PI, 1, true);  // Rear left fires outward
    }

    if (ship.strafingRight) { // Strafe right (left thrusters fire right)
        // Left thrusters fire to the right
        emitFromThruster(ship.thrusters.front_left, -Math.PI/4, 1.5, true);  // Front left fires right
        emitFromThruster(ship.thrusters.rear_left, -Math.PI/1.4, 1.5, true);   // Rear left fires right
    }

    if (ship.strafingLeft) { // Strafe left (right thrusters fire left)
        // Right thrusters fire to the left
        emitFromThruster(ship.thrusters.front_right, Math.PI/4, 1.5, true); // Front right fires left
        emitFromThruster(ship.thrusters.rear_right, Math.PI/1.4, 1.5, true);  // Rear right fires left
    }
}


    createStars() {
        this.stars = [];
        for (let i = 0; i < 10000; i++) {
            this.stars.push({ x: Math.random() * this.WORLD_WIDTH, y: Math.random() * this.WORLD_HEIGHT, radius: Math.random() * 1.5 });
        }
    }

    calculatePlanetParameters(minRadius, maxRadius) {
        const radius = Math.random() * (maxRadius - minRadius) + minRadius;
        const mass = Math.pow(radius, 3) * this.PLANET_MASS_SCALAR; // Mass scales with volume
        return {
            radius,
            mass
        };
    }

    createPlanets() {
        celestialBodies = [];
        const numPlanets = 8;
        const minDistance = 4000; 
        let attempts = 0; 
        const minRadius = 1200;  // Allows for smaller planets
        const maxRadius = 2000; // Allows for larger planets

        while (celestialBodies.length < numPlanets && attempts < 1000) {
            const params = this.calculatePlanetParameters(minRadius, maxRadius);
            let newPlanet = {
                x: Math.random() * this.WORLD_WIDTH * 0.8 + this.WORLD_WIDTH * 0.1,
                y: Math.random() * this.WORLD_HEIGHT * 0.8 + this.WORLD_HEIGHT * 0.1,
                radius: params.radius,
                mass: params.mass,
                image: planetImages[celestialBodies.length % planetImages.length]
            };

            let overlapping = false;
            for (const existingPlanet of celestialBodies) {
                const dist = Math.hypot(newPlanet.x - existingPlanet.x, newPlanet.y - existingPlanet.y);
                const existingWell = existingPlanet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;
                const newWell = newPlanet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;
                if (dist < existingWell + newWell + minDistance) {
                    overlapping = true;
                    break;
                }
            }
            // Check distance from space dock
            for (const dock of this.spaceDocks) {
            const distFromDock = Math.hypot(newPlanet.x - dock.x, newPlanet.y - dock.y);
            const safeDockDistance = 6000;  // Safe distance from any dock
            if (distFromDock < safeDockDistance + newPlanet.radius) {
                overlapping = true;
                break;
            }
            }

            if (!overlapping) {
                celestialBodies.push(newPlanet);
            
            }

            attempts++;
        }
        if (attempts >= 1000) {
            console.warn("Could not place all planets without overlapping. The world might be too crowded.");
        }
    }
    createSpaceDock(type, image, x, y, width, height) {
        const dock = new SpaceDock(x, y, width, height, image, type);
        this.spaceDocks.push(dock);
        return dock;
    }
    start(settings) {
        console.log("Starting Space Scene...");
        this.difficulty = settings.difficulty;
        this.isPaused = false;
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';

        // Initialize game world if not already done
        if (!this.stars.length) { 
            this.createStars(); 
            // Create the main space dock BEFORE creating planets
            this.createSpaceDock('alpha', dockTypes.alpha.img, this.WORLD_WIDTH / 2 - 1000, this.WORLD_HEIGHT / 2, 2400, 2000);
            // Now create planets - they will avoid the dock
            this.createPlanets();
        }

        // Get the alpha dock's position for ship placement
        const alphaDock = this.spaceDocks[0];
        if (alphaDock) {
            // Position the ship 1000 units to the right of the dock, and 300 units below
            this.ship = new Ship(alphaDock.x + 980, alphaDock.y + 270, this);
        } else {
            // Fallback position if no dock exists
            this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this);
        }

        // Set up the camera to follow the ship
        this.camera = new Camera(this.ship, this.WORLD_WIDTH, this.WORLD_HEIGHT, { 
            zoomSmoothing: this.zoomSmoothing,
            followSmoothing: 0.5  // Instant camera following for tight ship centering
        });

        canvas.style.display = 'block';
        zoomControls.style.display = 'flex';
    }

    stop() {
        if (thrusterSound.isLoaded) thrusterSound.pause();
        zoomControls.style.display = 'none';
        document.getElementById('access-dock-ui').style.display = 'none';
        document.getElementById('launch-ui').style.display = 'none';
    }

    update() {
        if (!this.ship || this.isPaused) return;
        // --- ORBIT LOCK LOGIC ---
        if (this.ship.isOrbitLocked && this.ship.orbitingPlanet) {
            const ship = this.ship;
            const planet = this.ship.orbitingPlanet;

            // Check if the player wants to break orbit by thrusting
            const wantsToMove = ship.thrusting || ship.reversing || ship.strafingLeft || ship.strafingRight;
            if (wantsToMove) {
            // Calculate the current orbital velocity before breaking orbit
            const orbitalSpeed = ship.lockedOrbitSpeed / ship.orbitRadius;
            
            // Convert orbital angular velocity to linear velocity components
            // The velocity is tangential to the orbit (perpendicular to the radius)
            const tangentAngle = ship.orbitAngle + Math.PI / 2; // 90 degrees to the radius
            ship.velX = orbitalSpeed * ship.orbitRadius * Math.cos(tangentAngle);
            ship.velY = orbitalSpeed * ship.orbitRadius * Math.sin(tangentAngle);
            
            ship.isOrbitLocked = false;
            ship.orbitingPlanet = null;
            this.orbitLockTimer = 0;
            this.camera.targetZoom = 1.0;
                                    
            } else {
                const orbitalSpeed = ship.lockedOrbitSpeed / ship.orbitRadius;
                
                ship.orbitAngle += orbitalSpeed;
                const targetX = planet.x + Math.cos(ship.orbitAngle) * ship.orbitRadius;
                const targetY = planet.y + Math.sin(ship.orbitAngle) * ship.orbitRadius;
                const targetAngle = ship.orbitAngle + Math.PI / 2; // Target orbital angle
                
                // Smooth transition from approach angle to orbital angle
                if (ship.orbitTransitionProgress < 1) {
                    ship.orbitTransitionProgress += 0.01; // Adjust this for faster/slower transition
                    ship.orbitTransitionProgress = Math.min(ship.orbitTransitionProgress, 1); // Cap at 100%
                    
                    // Smoothly interpolate the ship's angle
                    const angleDiff = targetAngle - ship.initialApproachAngle;
                    // Handle angle wrapping (shortest path between angles)
                    let adjustedAngleDiff = angleDiff;
                    if (angleDiff > Math.PI) adjustedAngleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) adjustedAngleDiff += 2 * Math.PI;
                    
                    ship.angle = ship.initialApproachAngle + (adjustedAngleDiff * ship.orbitTransitionProgress);
                    
                    // Position follows orbital path immediately
                    ship.x = targetX;
                    ship.y = targetY;
                } else {
                    // Full orbital motion once transition is complete
                    ship.x = targetX;
                    ship.y = targetY;
                    ship.angle = targetAngle;
                }

                this.camera.update();
                return; 
            }
        }
        // --- UNDOCKING LOGIC ---
        const wantsToMove = this.ship.thrusting || this.ship.reversing || this.ship.strafingLeft || this.ship.strafingRight;
        if (this.ship.isDocked && wantsToMove) {
            this.ship.isDocked = false;
        }

        this.ship.update();
        // --- DOCKING LOGIC ---    
        const dock = this.spaceDocks[0];
        if (dock) {
            const distance = Math.hypot(this.ship.x - dock.x, this.ship.y - dock.y);
            const speed = Math.hypot(this.ship.velX, this.ship.velY);
            
            if (!wantsToMove && distance < this.dockingRadius && speed < this.MAX_DOCKING_SPEED && speed > this.MIN_DOCKING_SPEED) {
                this.ship.isDocked = true;

                this.ship.velX = 0; // Reduce residual velocity
                this.ship.velY = 0; // Reduce residual velocity
                if (this.ship.isDocked){
                    if (!airlockSoundPlayed) {
                        airlockSound.play();
                        airlockSoundPlayed = true;
                    }
                }
            }

            // Reset the sound flag when not docked (moved outside the docking condition)
            if (!this.ship.isDocked) {
                airlockSoundPlayed = false;
            }
        }
        
        // --- 4. FINALLY, HANDLE VISUALS AND OTHER PHYSICS ---
        this.emitThrusterParticles();
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifespan > 0;
        });
        this.camera.update();
        
    /*    if (this.ship.isDocked) {
             this.orbitData = null;
             return;
        }
        
        // Only clear orbital data if we're not in a locked orbit and not thrusting
        if (!this.ship.isOrbitLocked && !this.ship.thrusting) {
            this.orbitData = null;
        }
    */
        // --- Orbital Mechanics Logic ---
        for (const planet of celestialBodies) {
            // If we are locked in an orbit, ignore all other planets.
            if (this.ship.isOrbitLocked && this.ship.orbitingPlanet !== planet) {
                continue;
            }
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);
            
            
            const gravityWellEdge = planet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;

            // Only apply gravity if the ship is within the planet's gravity well
            if (distance < gravityWellEdge && distance > planet.radius) {
            const shipSpeed = Math.hypot(this.ship.velX, this.ship.velY);
            const startSpeed = this.MAX_ORBIT_SPEED; // Starts ramping up at 5.0
            const fullSpeed = this.GRAVITY_ASSIST_MAX_SPEED; // Reaches 100% at 10.0
            
            let gravityFactor = 0; // Default to 0% gravity
            if (shipSpeed > startSpeed) {
                // Calculate how far the ship's speed is into the transition zone
                const progress = (shipSpeed - startSpeed) / (fullSpeed - startSpeed);
                // Clamp the value between 0 and 1 to create the 0% to 100% factor
                gravityFactor = Math.max(0, Math.min(progress, 1));
            }

            if (gravityFactor > 0) {
                const baseForce = this.ORBITAL_CONSTANT * planet.mass / (distance * distance);
                // Apply the force scaled by our gravityFactor
                const appliedForce = baseForce * gravityFactor;
                
                const angle = Math.atan2(dy, dx);
                this.ship.velX += appliedForce * Math.cos(angle);
                this.ship.velY += appliedForce * Math.sin(angle);
            }

            // 2. Check for stable orbit conditions to engage the lock-in timer.
            if (shipSpeed > this.MIN_ORBIT_SPEED && shipSpeed < this.MAX_ORBIT_SPEED && !this.ship.isOrbitLocked) {
                this.ship.inStableOrbit = true;
                this.orbitLockTimer += 1 / 60; // Convert frames to seconds

                if (this.orbitLockTimer >= this.ORBIT_LOCK_DURATION) {
                    this.ship.isOrbitLocked = true;
                    this.ship.orbitingPlanet = planet;
                    this.ship.orbitRadius = distance;
                    this.ship.orbitAngle = Math.atan2(dy, dx) + Math.PI;
                    this.ship.lockedOrbitSpeed = Math.hypot(this.ship.velX, this.ship.velY);
                    this.ship.orbitTransitionProgress = 0; // Start transition at 0%
                    this.ship.initialApproachAngle = this.ship.angle; // Store current ship angle
                    this.camera.targetZoom = 0.5; // Set target zoom for orbit view
                }
            } else {
                this.ship.inStableOrbit = false;
                this.orbitLockTimer = 0;
            }
            }

            // Collision check (functionality disabled - handled by orbit lock system)
            if (distance < planet.radius) {
                //console.log("Approaching planet, showing ship selection...");
                //this.isPaused = true;
                //if (thrusterSound.isLoaded) thrusterSound.pause();
                //canvas.style.display = 'none';
                //shipSelectionMenu.style.display = 'block';
            }
        }

        // --- Dynamic Zoom Logic ---
        //const speed = Math.hypot(this.ship.velX, this.ship.velY);
        //const speedRatio = Math.min(speed / this.maxSpeedForZoom, 1); 
        //this.camera.targetZoom = this.maxZoom - (this.maxZoom - this.minZoom) * speedRatio;
    }
 
    draw() {
        if (!this.ship || this.isPaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.camera.begin(ctx);
        
        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        
        // Draw orbital indicators if we have orbital data
 /*       if (this.orbitData) {
            const { planet, distance, shipAngle, orbitQuality, velocityRatio } = this.orbitData;
            
            // Visual feedback for orbital mechanics
            ctx.lineWidth = 2;
            if (this.ship.isOrbitLocked && this.ship.orbitingPlanet === planet) {
                // Locked orbit indicator - always visible while locked
                const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // 0 to 1 pulsing
                // Locked orbit indicator - pulsing green ring
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + pulse * 0.2})`; // More subtle pulsing
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, distance, 0, Math.PI * 2);
                ctx.stroke();

                // Draw orbit locked text at top
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ORBIT LOCKED', canvas.width / 2, 30);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                ctx.fillText('ORBIT LOCKED', canvas.width / 2, 30);
                ctx.restore();
            } else if (velocityRatio < 0.6 || velocityRatio > 1.4) {
                // Too fast or too slow - red indicator
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, distance, 0, Math.PI * 2);
                ctx.stroke();
                
                // Speed guidance text
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                const text = velocityRatio > 1.4 ? 'Too fast' : 'Too slow';
                ctx.fillText(text, this.ship.x, this.ship.y - 30);
                ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
                ctx.fillText(text, this.ship.x, this.ship.y - 30);
                ctx.restore();
            }
            
            // Draw predicted trajectory arc
            if (!this.ship.thrusting && velocityRatio > 0.6 && velocityRatio < 1.4) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
                // Draw an arc that shows the next quarter orbit
                ctx.arc(planet.x, planet.y, distance, shipAngle, shipAngle + Math.PI/2);
                ctx.stroke();
            }
        }
     */   
        // Draw planets over the trajectory lines
        celestialBodies.forEach(p => { 
            ctx.drawImage(p.image, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2); 
        });
        
        for (const dock of this.spaceDocks) {
        dock.draw(ctx);
        }

        this.ship.draw();
        this.particles.forEach(p => p.draw(ctx));
        this.camera.end(ctx);
/*
        if (this.ship.isOrbitLocked) {
            descentUI.style.display = 'block';
        } else {
            descentUI.style.display = 'none';

            }
*/
        this.drawSpeedometer.call(this);
        this.drawCompass.call(this);
        this.drawRadar.call(this);
        this.drawHud.call(this);
        this.drawDebugInfo.call(this);

            // Show or hide the "Access Dock" UI based on docking status
        const accessDockUI = document.getElementById('access-dock-ui');
        if (this.ship.isDocked) {
            accessDockUI.style.display = 'block';
        } else {
            accessDockUI.style.display = 'none';
        }

        // Launch Drop Ship Button visibility based on stable orbit
        const launchUI = document.getElementById('launch-ui');
        if (this.ship.isOrbitLocked) {
            launchUI.style.display = 'block';
        } else {
            launchUI.style.display = 'none';
        }
    }
    drawSpeedometer() {
            if (!this.ship) return;

            const speed = Math.hypot(this.ship.velX, this.ship.velY);
            const maxSpeed = 20; // The max speed we want the gauge to show.

            // --- Gauge settings ---
            const centerX = 120;
            const centerY = 120;
            const radius = 80;
            const startAngle = Math.PI * 0.75; // Start angle (bottom-left)
            const endAngle = Math.PI * 2.25;   // End angle (bottom-right)
            const totalAngle = endAngle - startAngle;

            ctx.save();
            ctx.lineWidth = 15;
            ctx.font = '16px "Orbitron", Arial, sans-serif';

            // --- Draw the color-coded arcs ---
            // Arc Outline (White)
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffffff'; // White
            ctx.beginPath();
            ctx.arc(centerX, centerY, 90, startAngle, endAngle);
            ctx.stroke();
            ctx.restore();

            // Docking Speed (Blue)
            ctx.strokeStyle = '#a0e0ff'; // Light Blue
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle * 0.05);
            ctx.stroke();

            // Orbit Speed (Green)
            ctx.strokeStyle = '#00ff00'; // Green
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.1, startAngle + totalAngle * 0.25);
            ctx.stroke();
            
            // Gravity Assist Speed (Yellow)
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.251, startAngle + totalAngle * 0.5);
            ctx.stroke();

            // --- Draw the needle ---
            const speedRatio = Math.min(speed / maxSpeed, 1.0); // Cap at 1.0
            const needleAngle = startAngle + (speedRatio * totalAngle);
            
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(needleAngle) * (radius + 10), centerY + Math.sin(needleAngle) * (radius + 10));
            ctx.stroke();

            // --- Draw the speed text ---
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(speed.toFixed(2), centerX, centerY + 40);

            // Draw the speed range labels
            ctx.save();
            if (speed >= 0.01 && speed <= 1.0) {
            ctx.fillStyle = '#a0e0ff'; // Light blue like docking arc
            ctx.fillText('DOCK OK', centerX, centerY + 80);
            } else if (speed >= 2.0 && speed <= 5.0) {
            ctx.fillStyle = '#00ff00'; // Green like orbit arc
            ctx.fillText('ORBIT OK', centerX, centerY + 80);
            } else if (speed >= 5.0 && speed <= 10.0) {
            ctx.fillStyle = 'yellow'; // Yellow like gravity assist arc
            ctx.fillText('GRAV ASSIST', centerX, centerY + 80);
            } else if (speed > 20.0) {
            ctx.font = '20px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'red'; // Red for dangerous speeds
            ctx.fillText('OVERSPEED', centerX, centerY + 80);
            }
            ctx.restore();
        }
    drawCompass() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Find the closest planet
        let closestPlanet = null;
        let minDistance = Infinity;

        // --- REPLACE THE LOOP WITH THIS ---
        for (const planet of celestialBodies) {
            const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestPlanet = planet;
            }
        }

        // Only proceed if we found a closest planet
        if (closestPlanet) {
            // Only draw the compass if the planet is far away, based on its size
            const compassMaxViewDistance = closestPlanet.radius * 1.5; 
            if (minDistance > compassMaxViewDistance) {
                const angleToPlanet = Math.atan2(closestPlanet.y - this.ship.y, closestPlanet.x - this.ship.x);
                
                const hudX = canvas.width / 2;
                const hudY = canvas.height / 2;
                const compassRadius = 120;

                ctx.save();
                ctx.translate(hudX + Math.cos(angleToPlanet) * compassRadius, hudY + Math.sin(angleToPlanet) * compassRadius);
                ctx.rotate(angleToPlanet + Math.PI / 2);
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.moveTo(0, -7.5);
                ctx.lineTo(-5, 5);
                ctx.lineTo(5, 5);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '22px "Consolas", "Courier New", "Monaco", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.floor(minDistance)}m`, hudX, hudY + compassRadius + 30);
            }
        }
    }

    drawRadar() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Cache ship position and radar settings
        const shipPos = {
            x: this.ship.x,
            y: this.ship.y
        };

        // --- Radar Settings (tweak these to change the look and feel!) ---
        const radarRadius = 100; // The size of the radar circle
        const radarX = canvas.width - radarRadius - 20; // Position from the right edge
        const radarY = radarRadius + 20; // Position from the top edge
        const radarRange = this.WORLD_WIDTH / 4; // The max distance the radar can "see". Tied to world size!
        const radarScale = radarRadius / radarRange; // How to scale world distances to radar distances

        ctx.save();
        
        // Draw the semi-transparent background circle
        ctx.beginPath();
        ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 50, 0, 0.5)'; // Dark green, semi-transparent
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Brighter green border
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the player's blip in the center
        ctx.beginPath();
        ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'lime';
        ctx.fill();

        // Draw each planet as a blip on the radar
        for (const planet of celestialBodies) {
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);

            let blipX, blipY;

            if (distance < radarRange) {
                // Planet is inside radar range, position it proportionally
                blipX = radarX + dx * radarScale;
                blipY = radarY + dy * radarScale;
            } else {
                // Planet is outside range, pin it to the edge of the radar
                const angle = Math.atan2(dy, dx);
                blipX = radarX + Math.cos(angle) * radarRadius;
                blipY = radarY + Math.sin(angle) * radarRadius;
            }
            
            // Draw the planet's blip
            ctx.beginPath();
            ctx.arc(blipX, blipY, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.fill();
        }

        ctx.restore();
    }
        drawHud() {
        if (this.ship && this.ship.isDocked) {
            ctx.save();
            ctx.font = '30px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'cyan';
            ctx.textAlign = 'center'; // Ensure text is centered
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            // Center the text exactly like the CSS button: canvas.width / 2
            ctx.fillText('SHIP DOCKED', canvas.width / 2, canvas.height * 0.10); // 10% down the screen
            ctx.restore();
            return;
        }
        //if (!this.orbitData) return; // Don't draw if there's no data

    }
        drawDebugInfo() {
            if (!this.ship || !celestialBodies.length) return;

            // Find the closest planet to the ship
            const closestPlanet = celestialBodies.reduce((closest, planet) => {
                const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
                if (dist < closest.dist) {
                    return { dist, planet };
                }
                return closest;
            }, { dist: Infinity, planet: null }).planet;

            if (!closestPlanet) return;
            
            // Calculate the distance (radius) from the ship to the center of the planet
            const radius = Math.hypot(this.ship.x - closestPlanet.x, this.ship.y - closestPlanet.y);
            const zoom = this.camera.zoomLevel;

            // --- Draw the text on the screen ---
            ctx.save();
            ctx.font = '16px "Orbitron"';
            ctx.fillStyle = 'yellow';
            ctx.textAlign = 'left';
            ctx.fillText(`Radius: ${radius.toFixed(0)}`, 10, canvas.height - 30);
            ctx.fillText(`Zoom: ${zoom.toFixed(2)}`, 10, canvas.height - 10);
            ctx.restore();
        }
    
        handleKeys(e, isDown) {
            if (!this.ship || this.isPaused) return;

            const oldThrusting = this.ship.thrusting || this.ship.reversing;
            switch (e.key) {
            case 'ArrowUp': case 'w': this.ship.thrusting = isDown; break;
            case 'ArrowDown': case 's': this.ship.reversing = isDown; break;
            case 'ArrowLeft': case 'a': this.ship.rotatingLeft = isDown; break;
            case 'ArrowRight': case 'd': this.ship.rotatingRight = isDown; break;
            case 'q': case ',': this.ship.strafingLeft = isDown; break;
            case 'e': case '.': this.ship.strafingRight = isDown; break;
            case ' ': if (isDown) this.ship.rotation = 0; break;
        }
        const newThrusting = this.ship.thrusting || this.ship.reversing;
        if (thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    }
};

