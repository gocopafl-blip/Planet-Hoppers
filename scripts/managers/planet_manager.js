// scripts/managers/planet_manager.js

class PlanetManager {
    constructor() {
        this.celestialBodies = []; // This will hold the generated planets for the current game
    }

    // A utility to get a random element from an array
    getRandomElement(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // The main function to create a new universe of planets
    generatePlanets(count, worldWidth, worldHeight, spaceDocks) {
        this.celestialBodies = []; // Clear any old planets
        const planetTypes = Object.keys(planetCatalogue);
        const minDistance = 20000;
        let attempts = 0;

        while (this.celestialBodies.length < count && attempts < 1000) {
            // 1. Pick a random planet type from our catalogue (e.g., "volcanic_world")
            const randomTypeKey = this.getRandomElement(planetTypes);
            const planetDNA = planetCatalogue[randomTypeKey];

            // 2. Use the DNA to generate specific stats for this one planet
            const radius = Math.random() * (planetDNA.baseRadius.max - planetDNA.baseRadius.min) + planetDNA.baseRadius.min;
            const mass = Math.pow(radius, 3) * 0.4 * (planetDNA.baseGravity / 0.01); // Mass is now affected by gravity type!

            // 3. Create the new planet object with a unique ID
            const newPlanet = {
                id: `planet_${this.celestialBodies.length}_${Date.now()}`, // A guaranteed unique ID
                planetTypeId: planetDNA.planetTypeId,
                name: `${this.getRandomElement(planetDNA.namePrefixes)} ${this.celestialBodies.length}`,
                x: Math.random() * worldWidth * 0.8 + worldWidth * 0.1,
                y: Math.random() * worldHeight * 0.8 + worldHeight * 0.1,
                radius: radius,
                mass: mass,
                image: this.getRandomElement(planetDNA.planetImages.map(src => {
                    const img = new Image();
                    img.src = ASSET_BASE_URL + src;
                    return img;
                })),
                backgroundOptions: planetDNA.landerBackgrounds,
                // Pass all the other DNA properties directly to the planet object
                ...planetDNA
            };

            // 4. Check for overlaps (this logic is the same as before)
            let overlapping = false;
            for (const existing of [...this.celestialBodies, ...spaceDocks]) {
                const dist = Math.hypot(newPlanet.x - existing.x, newPlanet.y - existing.y);
                const safeDist = (existing.radius || 3000) + newPlanet.radius + minDistance;
                if (dist < safeDist) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                this.celestialBodies.push(newPlanet);
            }
            attempts++;
        }

        console.log("Planet Manager generated celestial bodies:", this.celestialBodies);
        // We need to update the global variable for now, until we refactor further.
        celestialBodies = this.celestialBodies;
        return this.celestialBodies;
    }
}