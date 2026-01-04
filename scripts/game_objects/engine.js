class Engine {
    constructor(x, y, game, shipData) {
        // Core properties
        this.x = x;
        this.y = y;
        this.type = null; //chemical, ion, magnetic, etc.,.
        this.velX = 0;
        this.velY = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.throttle = 0; // 0 to 1
        // Target properties for smooth transitions
        this.targetThrottle = 0; // Desired throttle level (0 to 1)
        this.throttleChangeRate = 0.01; // Rate at which throttle changes per update

        // Engine location on ship
        this.engineOffsetX = 0;
        this.engineOffsetY = 0;
        this.engineAngleOffset = 0;
        // Engine stats
        this.accelerationPerSec = 0;// how much velocity the engine adds per second
        this.thrustVector = { x: 0, y: 0 };// the direction the engine thrusts in, accounting for engine offset
        this.spoolUpTime = 0;// time in ms before the engine achieves full acceleration per second
        this.spoolUpTimer = 0;// current time in ms the engine has been spooling up
        this.isSpoolingUp = false;// is the engine currently spooling up
        this.fuelConsumptionPerSec = 0;// how much fuel the engine consumes per second at full throttle
        this.currentFuelConsumption = 0;// how much fuel the engine is currently consuming per second
        this.electricConsumptionPerSec = 0;// how much electric the engine consumes per second at full throttle
        this.currentElectricConsumption = 0;// how much electric the engine is currently consuming per second
        this.oxygenConsumptionPerSec = 0;// how much oxygen the engine consumes per second at full throttle
        this.currentOxygenConsumption = 0;// how much oxygen the engine is currently consuming per second
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.healthDecayPerSecWhenActive = 0;// how much health the engine loses per second when active
        this.healthRepairCostPerUnit = 0;// how much it costs to repair 1 health point
        // Engine state
        this.isActive = false;// is the engine currently on
        this.isFunctional = true;// is the engine functional (not broken)
        this.isDamaged = false;// is the engine damaged (below max health)
        this.isDestroyed = false;// is the engine destroyed (health at 0)
        this.game = game;
        this.shipData = shipData;
        this.loadShipData(shipData);
        // Visual properties
        this.width = 20;
        this.height = 40;
        this.thrustColor = 'blue';
        this.flameColor = 'orange'; // Color of the engine flame


    }
}