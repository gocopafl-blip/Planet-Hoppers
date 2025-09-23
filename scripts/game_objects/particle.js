class SpaceParticle {
    constructor(x, y, angle, speed, isRotation = false, shipVelX = 0, shipVelY = 0) {
        this.x = x;
        this.y = y;

        // Rotational puffs are smaller and shorter-lived
        this.radius = isRotation ? Math.random() * 1.2 + 0.5 : Math.random() * 2 + 1;
        this.lifespan = isRotation ? 15 + Math.random() * 10 : 40 + Math.random() * 20;
        this.initialLifespan = this.lifespan;

        // Add some randomness to the particle speed (variation in exhaust velocity)
        const speedVariation = 0.2; // 20% variation
        const finalSpeed = speed * (1 + (Math.random() * speedVariation - speedVariation / 2));

        // Add slight random spread to the angle (exhaust cone)
        const spread = isRotation ? 0.1 : 0.2; // Rotation particles spread less
        const finalAngle = angle + (Math.random() * spread - spread / 2);

        // For rotation thrusters, only use thrust velocity (no ship velocity inheritance)
        // For main thrusters, combine ship velocity and thrust velocity
        //if (isRotation) {
        //  this.velX = finalSpeed * Math.cos(finalAngle);
        // this.velY = finalSpeed * Math.sin(finalAngle);
        //} else {
        // this.velX = shipVelX + (finalSpeed * Math.cos(finalAngle));
        // this.velY = shipVelY + (finalSpeed * Math.sin(finalAngle));

        // Combine ship velocity and thrust velocity
        this.velX = shipVelX + (finalSpeed * Math.cos(finalAngle));
        this.velY = shipVelY + (finalSpeed * Math.sin(finalAngle));

    }

    draw(ctx) {
        ctx.save();
        // Fade the particle out over its lifespan
        ctx.globalAlpha = this.lifespan / this.initialLifespan;
        // Start as bright yellow/orange
        const hue = 40;
        // Start at 100% lightness (pure white) and fade down to 50% (vibrant color)
        const lightness = 100 - (50 * (1 - (this.lifespan / this.initialLifespan)));
        ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.lifespan--;
    }
}
