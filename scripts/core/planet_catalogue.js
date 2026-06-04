// scripts/core/planet_catalogue.js
//
// Space sprites (asset_catalogue keys → one type each):
//   planet1 water_world | planet2 terran_world | planet3 gas_giant
//   planet4–5 volcanic_world | planet6–7 ice_world | planet8 city_world

const terranLanderTerrain = {
    mode: 'terran',
    padWidth: { min: 100, max: 140 },
    fuel: { min: 650, max: 850 },
    safeSpeed: { min: 0.85, max: 1.15 },
    islandChance: 0.35
};

const planetCatalogue = {
    "gas_giant": {
        planetTypeId: "gas_giant",
        namePrefixes: ["Jovin", "Aerlon", "Strato", "Helios"],
        baseRadius: { min: 2600, max: 3000 },
        planetImages: ["planet3"],
        landerBackgrounds: ["earth_planet_a", "earth_planet_b", "blue_planet_a"],
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
        planetImages: ["planet2"],
        landerBackgrounds: ["earth_planet_a", "earth_planet_b"],
        gravityG: { min: 0.7, max: 1.8 },
        wind: { min: 0, max: 8 },
        seismicStability: 0.9,
        dangerLevel: 1,
        hasAtmosphericParticles: false,
        landerTerrain: { ...terranLanderTerrain }
    },

    "water_world": {
        planetTypeId: "water_world",
        namePrefixes: ["Aqua", "Pelago", "Thalassa", "Marinus"],
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["planet1"],
        landerBackgrounds: ["blue_planet_a", "blue_planet_b"],
        gravityG: { min: 0.7, max: 1.8 },
        wind: { min: 0, max: 10 },
        seismicStability: 0.9,
        dangerLevel: 1,
        hasAtmosphericParticles: false,
        landerTerrain: {
            ...terranLanderTerrain,
            islandChance: 0.55
        }
    },

    "ice_world": {
        planetTypeId: "ice_world",
        namePrefixes: ["Glacius", "Cryo", "Frost", "Boreal"],
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["planet6", "planet7"],
        landerBackgrounds: ["blue_planet_a", "blue_planet_b"],
        gravityG: { min: 0.7, max: 1.6 },
        wind: { min: 2, max: 12 },
        seismicStability: 0.95,
        dangerLevel: 2,
        hasAtmosphericParticles: false,
        landerTerrain: {
            ...terranLanderTerrain,
            islandChance: 0.2
        }
    },

    "city_world": {
        planetTypeId: "city_world",
        namePrefixes: ["Metro", "Urban", "Civitas"],
        baseRadius: { min: 1800, max: 2200 },
        planetImages: ["planet8"],
        landerBackgrounds: ["city_planet_a"],
        gravityG: { min: 0.8, max: 1.5 },
        wind: { min: 0, max: 6 },
        seismicStability: 0.85,
        dangerLevel: 1,
        hasAtmosphericParticles: false,
        landerTerrain: {
            ...terranLanderTerrain,
            islandChance: 0.15
        }
    },

    "volcanic_world": {
        planetTypeId: "volcanic_world",
        namePrefixes: ["Hades", "Crematoria", "Infernus", "Pyra"],
        baseRadius: { min: 1400, max: 1800 },
        planetImages: ["planet4", "planet5"],
        landerBackgrounds: ["swirling_planet_a", "swirling_planet_b"],
        gravityG: { min: 1.2, max: 2.5 },
        wind: { min: 3, max: 12 },
        seismicStability: 0.4,
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
