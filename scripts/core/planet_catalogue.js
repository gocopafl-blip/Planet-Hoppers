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
        landerBackgrounds: ["earth_planet_a"],
        // --- Lander Scene Parameters ---
        baseGravity: 0, // No landing
        wind: { min: 0, max: 0 },
        seismicStability: 1.0, // Perfectly stable
        dangerLevel: 0,
        // --- Special Effects ---
        // We can add flags for our game to look for later!
        hasAtmosphericParticles: true
    },

    "terran_world": {
        planetTypeId: "terran_world",
        namePrefixes: ["Terra", "Gaea", "Veridia", "Eden"],
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["planet2", "planet8"],
        landerBackgrounds: ["earth_planet_a", "earth_planet_b"],
        // --- Lander Scene Parameters ---
        baseGravity: 0.01,
        wind: { min: 0, max: 5 }, // Gentle breezes
        seismicStability: 0.9, // Mostly stable
        dangerLevel: 1,
        hasAtmosphericParticles: false
    },

    "volcanic_world": {
        planetTypeId: "volcanic_world",
        namePrefixes: ["Hades", "Crematoria", "Infernus", "Pyra"],
        baseRadius: { min: 1400, max: 1800 },
        planetImages: ["planet3", "planet4", "planet5"],
        landerBackgrounds: ["swirling_planet_a", "swirling_planet_b"],
        // --- Lander Scene Parameters ---
        baseGravity: 0.012,
        wind: { min: 2, max: 10 }, // Gusty, unpredictable winds
        seismicStability: 0.4, // Very unstable! Lots of quakes.
        dangerLevel: 8,
        // --- Special Effects ---
        hasVolcanicParticles: true // A new flag for our game!
    }
};