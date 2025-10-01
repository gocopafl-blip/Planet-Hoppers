// scripts/game_objects/ship.js

class Ship {
    constructor(x, y, game, shipData) {
        // Core properties
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.game = game; // Keep a reference to the scene for world boundaries

        // --- NEW: Properties from the catalogue ---
        this.width = shipData.shipWidth;
        this.height = shipData.shipHeight;
        this.thrustPower = shipData.shipThrustPower;
        this.rotationSpeed = shipData.shipRotationSpeed;
        this.thrusters = shipData.shipThrusters; // Get thruster layout from data
        this.image = assetManager.getImage(shipData.shipImage); // Get the image

        // State properties
        this.thrusting = false;
        this.reversing = false;
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.strafingLeft = false;
        this.strafingRight = false;
        this.isDocked = false;
        this.inStableOrbit = false;
        this.isOrbitLocked = false;
        this.orbitingPlanet = null;

          // --- YES, THESE ORBIT PARAMETERS SHOULD BE HERE ---
        this.orbitRadius = 0;
        this.orbitAngle = 0;
        this.lockedOrbitSpeed = 0;
        this.orbitTransitionProgress = 0;
        this.initialApproachAngle = 0;
    
    }

    draw() {
        if (!this.image) return; // Don't draw if the image isn't loaded
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    update() {
        // --- UPDATED: Use 'this.rotationSpeed' ---
        if (this.rotatingLeft) this.rotation -= this.rotationSpeed * 0.1;
        if (this.rotatingRight) this.rotation += this.rotationSpeed * 0.1;
        this.angle += this.rotation;

        // --- UPDATED: Use 'this.thrustPower' ---
        if (this.thrusting) {
            this.velX += this.thrustPower * Math.cos(this.angle);
            this.velY += this.thrustPower * Math.sin(this.angle);
        }
        if (this.reversing) {
            this.velX -= this.thrustPower * Math.cos(this.angle);
            this.velY -= this.thrustPower * Math.sin(this.angle);
        }

        const strafeAngle = this.angle + Math.PI / 2;
        if (this.strafingLeft) {
            this.velX -= this.thrustPower * Math.cos(strafeAngle);
            this.velY -= this.thrustPower * Math.sin(strafeAngle);
        }
        if (this.strafingRight) {
            this.velX += this.thrustPower * Math.cos(strafeAngle);
            this.velY += this.thrustPower * Math.sin(strafeAngle);
        }

        this.x += this.velX;
        this.y += this.velY;
        
        // World boundary checks
        if (this.x < 0 || this.x > this.game.WORLD_WIDTH || this.y < 0 || this.y > this.game.WORLD_HEIGHT) {
            this.x = Math.max(0, Math.min(this.x, this.game.WORLD_WIDTH));
            this.y = Math.max(0, Math.min(this.y, this.game.WORLD_HEIGHT));
            this.velX = 0;
            this.velY = 0;
        }
    }

    // --- MOVED FROM space_scene.js ---
    getRotatedPosition(offsetX, offsetY) {
        const correctedAngle = this.angle + Math.PI / 2;
        const cos = Math.cos(correctedAngle);
        const sin = Math.sin(correctedAngle);
        return {
            x: this.x + (offsetX * cos) - (offsetY * sin),
            y: this.y + (offsetX * sin) + (offsetY * cos)
        };
    }

  emitThrusterParticles() {
    
        const emitFromThruster = (thruster, baseAngle, speed, isRotation = false) => {
            const thrusterX = this.width * thruster.x_ratio;
            const thrusterY = this.height * thruster.y_ratio;
            
            const pos = this.getRotatedPosition(thrusterX, thrusterY);

            // Use the helper function to convert degrees to radians!
            const thrusterAngleInRadians = degreesToRadians(thruster.angle_deg);
            
            const particleAngle = this.angle + baseAngle + thrusterAngleInRadians;
            
            this.game.particles.push(new SpaceParticle(
                pos.x, pos.y,
                particleAngle,
                speed,
                isRotation,
                this.velX,
                this.velY,
              
            ));
        };

        if (this.thrusting) { // Main engines (rear thrusters) firing backward
            emitFromThruster(this.thrusters.rear_left, Math.PI, 3);   // Rear left fires backward
            emitFromThruster(this.thrusters.rear_right, Math.PI, 3);  // Rear right fires backward
        }

        if (this.reversing) { // Front RCS thrusters firing forward
            emitFromThruster(this.thrusters.front_left, 0, 2);    // Front left fires forward
            emitFromThruster(this.thrusters.front_right, 0, 2);   // Front right fires forward
        }

        if (this.rotatingRight) { // Clockwise rotation
            // Right side thrusters fire outward
            emitFromThruster(this.thrusters.front_left, 0, 1, true);       // Front right fires outward
            emitFromThruster(this.thrusters.rear_right, Math.PI, 1, true);  // Rear right fires outward
        }

        if (this.rotatingLeft) { // Counter-clockwise rotation
            // Left side thrusters fire outward
            emitFromThruster(this.thrusters.front_right, 0, 1, true);       // Front left fires outward
            emitFromThruster(this.thrusters.rear_left, Math.PI, 1, true);  // Rear left fires outward
        }

        if (this.strafingRight) { // Strafe right (left thrusters fire right)
            // Left thrusters fire to the right
            emitFromThruster(this.thrusters.front_left, -Math.PI / 4, 1.5, true);  // Front left fires right
            emitFromThruster(this.thrusters.rear_left, -Math.PI / 1.4, 1.5, true);   // Rear left fires right
        }

        if (this.strafingLeft) { // Strafe left (right thrusters fire left)
            // Right thrusters fire to the left
            emitFromThruster(this.thrusters.front_right, Math.PI / 4, 1.5, true); // Front right fires left
            emitFromThruster(this.thrusters.rear_right, Math.PI / 1.4, 1.5, true);  // Rear right fires left
        }
    }
}