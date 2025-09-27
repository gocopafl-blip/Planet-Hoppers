// scripts/core/planet_catalogue.js

const planetCatalogue = {
    // --- Planet Types ---
    // Here we define the "archetypes" or "classes" of planets.
    // The PlanetManager will use these as blueprints.

    "gas_giant": {
        planetTypeId: "gas_giant",
        namePrefixes: ["Jovin", "Aerlon", "Strato", "Helios"], // For random name generation
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["images/planet1.png", "images/planet3.png"], // Can use these images
        landerBackgrounds: [
            "images/EarthPlanet_2a.jpg"
            // Gas giants don't have surfaces to land on, so this is empty.
        ],
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
        baseRadius: { min: 1200, max: 1600 },
        planetImages: ["images/planet2.png"],
        landerBackgrounds: [
            "images/EarthPlanet_2a.jpg",
            "images/EarthPlanet_2b.jpg"
        ],
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
        baseRadius: { min: 1000, max: 1400 },
        planetImages: ["images/planet3.png"], // Could use a reddish planet image here
        landerBackgrounds: [
            "images/SwirlingPlanet_3a.jpg",
            "images/SwirlingPlanet_3b.jpg"
        ],
        // --- Lander Scene Parameters ---
        baseGravity: 0.012,
        wind: { min: 2, max: 10 }, // Gusty, unpredictable winds
        seismicStability: 0.4, // Very unstable! Lots of quakes.
        dangerLevel: 8,
        // --- Special Effects ---
        hasVolcanicParticles: true // A new flag for our game!
    }
};