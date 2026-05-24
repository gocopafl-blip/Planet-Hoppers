// scripts/core/planet_catalogue.js

const planetCatalogue = {
    // --- Planet Types ---
    // Here we define the "archetypes" or "classes" of planets.
    // The PlanetManager will use these as blueprints.

    "gas_giant": {
        planetTypeId: "gas_giant",
        namePrefixes: ["Jovin", "Aerlon", "Strato", "Helios"], // For random name generation
        baseRadius: { min: 2600, max: 3000 },
        // Use asset keys from asset_catalogue.js
        planetImages: ["planet1", "planet3", "planet6", "planet7"],
        // Gas giants don't have surfaces; keep a placeholder background image key if needed
        landerBackgrounds: ["earth_planet_a", "swirling_planet_a", "swirling_planet_b"],
        // --- Lander Scene Parameters ---
        gravityG: { min: 0.5, max: 1.2 },
        wind: { min: 4, max: 14 },
        seismicStability: 1.0,
        dangerLevel: 2,
        hasAtmosphericParticles: true,
        landerTerrain: {
            mode: 'gas',
            padCount: { min: 1, max: 2 },
            padWidth: { min: 90, max: 120 },
            fuel: { min: 750, max: 950 },
            safeSpeed: { min: 1.0, max: 1.4 },
            padDrift: { min: 0.15, max: 0.45 }
        }
    },

    "terran_world": {
        planetTypeId: "terran_world",
        namePrefixes: ["Terra", "Gaea", "Veridia", "Eden"],
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["planet2", "planet8"],
        landerBackgrounds: ["earth_planet_a", "earth_planet_b"],
        // --- Lander Scene Parameters ---
        gravityG: { min: 0.7, max: 1.8 },
        wind: { min: 0, max: 8 },
        seismicStability: 0.9, // Mostly stable
        dangerLevel: 1,
        hasAtmosphericParticles: false,
        landerTerrain: {
            mode: 'terran',
            padWidth: { min: 100, max: 140 },
            fuel: { min: 650, max: 850 },
            safeSpeed: { min: 0.85, max: 1.15 },
            islandChance: 0.35
        }
    },

    "volcanic_world": {
        planetTypeId: "volcanic_world",
        namePrefixes: ["Hades", "Crematoria", "Infernus", "Pyra"],
        baseRadius: { min: 1400, max: 1800 },
        planetImages: ["planet3", "planet4", "planet5"],
        landerBackgrounds: ["swirling_planet_a", "swirling_planet_b"],
        // --- Lander Scene Parameters ---
        gravityG: { min: 1.2, max: 2.5 },
        wind: { min: 3, max: 12 },
        seismicStability: 0.4, // Very unstable! Lots of quakes.
        dangerLevel: 8,
        hasVolcanicParticles: true,
        landerTerrain: {
            mode: 'volcanic',
            padWidth: { min: 70, max: 100 },
            fuel: { min: 550, max: 750 },
            safeSpeed: { min: 0.65, max: 0.95 }
        }
    }
};