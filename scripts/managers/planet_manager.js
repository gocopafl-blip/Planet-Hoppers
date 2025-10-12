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
        // ENHANCED: Check for saved planet data first to maintain orbital ship consistency
        if (playerDataManager.hasSavedPlanetData()) {
            console.log('Restoring saved planet layout to maintain orbital ship positions');
            this.restoreSavedPlanets();
            return;
        }
        
        // Generate new planets if no saved data exists
        console.log('Generating new planet layout');
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
                // Retrieve a preloaded planet image from the AssetManager by key
                image: this.getRandomElement(
                    planetDNA.planetImages
                        .map(key => assetManager.getImage(key))
                        .filter(img => !!img)
                ),
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
        
        // ENHANCED: Save the generated planet layout for consistency across game sessions
        if (this.celestialBodies.length > 0) {
            playerDataManager.savePlanetData(this.celestialBodies);
            console.log(`Generated and saved ${this.celestialBodies.length} planets for persistent world state`);
        }
        
        // FIXED: Sync global celestialBodies variable with generated planets
        celestialBodies = this.celestialBodies;
        
        console.log("Planet Manager generated celestial bodies:", this.celestialBodies);
        return this.celestialBodies;
    }
    
    // NEW METHOD: Restore planets from saved data to maintain orbital ship references
    restoreSavedPlanets() {
        const savedPlanets = playerDataManager.getSavedPlanetData();
        if (!savedPlanets || savedPlanets.length === 0) {
            console.warn('No saved planet data found, falling back to generation');
            return false;
        }
        
        this.celestialBodies = savedPlanets.map(planetData => {
            // Reconstruct planet object from saved data
            const planetDNA = planetCatalogue[planetData.planetTypeId];
            if (!planetDNA) {
                console.warn(`Planet type ${planetData.planetTypeId} not found in catalogue`);
                return null;
            }
            
            return {
                id: planetData.id,
                planetTypeId: planetData.planetTypeId,
                name: planetData.name,
                x: planetData.x,
                y: planetData.y,
                radius: planetData.radius,
                mass: planetData.mass,
                // Restore image from asset manager using saved key
                image: assetManager.getImage(planetData.imageKey),
                backgroundOptions: planetData.backgroundOptions,
                // Restore other properties from catalogue and saved data
                baseGravity: planetData.baseGravity,
                wind: planetData.wind,
                seismicStability: planetData.seismicStability,
                dangerLevel: planetData.dangerLevel,
                hasAtmosphericParticles: planetData.hasAtmosphericParticles,
                // Add catalogue properties that weren't saved
                ...planetDNA
            };
        }).filter(planet => planet !== null); // Remove any failed reconstructions
        
        console.log(`Restored ${this.celestialBodies.length} planets from saved data`);
        
        // FIXED: Sync global celestialBodies variable with restored planets
        celestialBodies = this.celestialBodies;
        
        return true;
    }
}