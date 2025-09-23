class Ship {
    constructor(x, y, game) {
        this.x = x; this.y = y; this.velX = 0; this.velY = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0; this.thrusting = false;
        this.reversing = false;
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.strafingLeft = false;
        this.strafingRight = false;
        this.width = 200; // Adjusted for better visibility
        this.height = 240;
        this.game = game; // Store reference to the game
        this.isDocked = false;
        this.inStableOrbit = false;
        this.isOrbitLocked = false;
        this.orbitingPlanet = null;
        this.orbitRadius = 0;
        this.orbitAngle = 0;
        this.lockedOrbitSpeed = 0;
        this.orbitTransitionProgress = 0; // For smooth orbit lock transition
        this.initialApproachAngle = 0; // Store ship's angle when orbit lock starts
        this.thrusters = {
            front_left: {
                x: -this.width / 6.0,
                y: -this.height / 4.7,     // Moved to bottom
                outwardAngle: -Math.PI / 4  // 45 degrees outward
            },
            front_right: {
                x: this.width / 6.0,
                y: -this.height / 4.7,      // Moved to bottom
                outwardAngle: Math.PI / 4   // 45 degrees outward
            },
            rear_left: {
                x: -this.width / 6.0,
                y: this.height / 2.7,       // Moved to top
                outwardAngle: Math.PI / 4  // 45 degrees outward
            },
            rear_right: {
                x: this.width / 5.2,
                y: this.height / 2.7,       // Moved to top
                outwardAngle: -Math.PI / 4   // 45 degrees outward
            }
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.drawImage(spaceShipImage, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    update() {
        // --- ROTATION LOGIC ---
        // Apply rotational force if the keys are held down
        if (this.rotatingLeft) this.rotation -= this.game.ROTATION_SPEED * 0.1;
        if (this.rotatingRight) this.rotation += this.game.ROTATION_SPEED * 0.1;
        this.angle += this.rotation; // Apply the rotation to the ship's angle

        // --- FORWARD/REVERSE THRUST LOGIC (no change here) ---
        if (this.thrusting) {
            this.velX += this.game.THRUST_POWER * Math.cos(this.angle);
            this.velY += this.game.THRUST_POWER * Math.sin(this.angle);
        }
        if (this.reversing) {
            this.velX -= this.game.THRUST_POWER * Math.cos(this.angle);
            this.velY -= this.game.THRUST_POWER * Math.sin(this.angle);
        }

        // --- ADD NEW STRAFING LOGIC ---
        const strafeAngle = this.angle + Math.PI / 2; // 90 degrees to the ship's facing
        if (this.strafingLeft) {
            this.velX -= this.game.THRUST_POWER * Math.cos(strafeAngle);
            this.velY -= this.game.THRUST_POWER * Math.sin(strafeAngle);
        }
        if (this.strafingRight) {
            this.velX += this.game.THRUST_POWER * Math.cos(strafeAngle);
            this.velY += this.game.THRUST_POWER * Math.sin(strafeAngle);
        }

        // No drag in space - objects maintain velocity (Newton's First Law)
        this.x += this.velX; this.y += this.velY;
        // World boundary checks
        if (this.x < 0 || this.x > this.game.WORLD_WIDTH || this.y < 0 || this.y > this.game.WORLD_HEIGHT) {
            this.x = Math.max(0, Math.min(this.x, this.game.WORLD_WIDTH));
            this.y = Math.max(0, Math.min(this.y, this.game.WORLD_HEIGHT));
            this.velX = 0; this.velY = 0;
        }
    }
}

