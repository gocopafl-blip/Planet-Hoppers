// scripts/core/mission_catalogue.js

const missionCatalogue = {
    // --- Unique Mission IDs ---
    // Each mission needs a unique ID. This is how we'll refer to it in the code.
    // As you add more missions, just make sure each ID is different.
    "DELIVERY_ALPHA_01": {
        // --- Basic Information ---
        title: "Spare Parts Delivery",
        description: "Deliver a crate of spare parts to the orbital station.",
        reward: 250, // The number of credits the player gets for completion.
        type: 'DELIVER_TO_DOCK',
        requiredCargoSpace: 5,
        cargoItemId: 'spare_parts'
    },

    "DELIVERY_ALPHA_02": {
        title: "Medical Supplies Run",
        description: "Transport a pallet of urgent medical supplies to the dock.",
        reward: 400,
        type: 'DELIVER_TO_DOCK',
    },

    "SCAN_PLANET_01": {
        title: "Scan Gas Giant",
        description: "Travel to the gas giant designated Planet Zero and perform a full orbital scan.",
        reward: 750,
        type: 'ORBIT_PLANET', // Our new mission type!
        destinationPlanetIndex: 0, // The target is the first planet created (index 0).
    },

    "LAND_ON_PLANET_01": {
        title: "Deliver Geological Survey Equipment",
        description: "Launch a drop ship and land safely at the designated outpost on any planet to deliver the survey gear.",
        reward: 1500,
        type: 'LAND_ON_PLANET', // Our brand new mission type!
    },

    "PICK_UP_CARGO_01": {
        title: "Pick Up Geological Survey Sample",
        description: "The Government has begun the task of sampling geological materials of the planets in our system. Launch a drop ship and land safely at the outpost on any planet to pick up a survey sample. Return to the ship and then return and dock with the spacedock.",
        reward: 2700,
        type: 'PICK_UP_CARGO', // First multi-stage mission type!
        hasPickedUpCargo: false, // A flag to track if the cargo has been picked up.
    },
    // "DELIVERY_BETA_01": { ... },

    // --- Mission Type & Requirements ---
    // This is where you can get creative in the future.
    // For now, we only have one type: 'DELIVER_TO_DOCK'.
    // You could later add types like:
    // 'COLLECT_FROM_PLANET', 'ESCORT_SHIP', 'EXPLORE_SECTOR', etc.

    // --- Future Expansion Ideas ---
    // Here are some properties you could add later to make missions more complex:
    //
    // requiredCargoSpace: 5, // How much space the cargo takes up.
    // timeLimit: 300, // A countdown timer in seconds.
    // requiredReputation: 100, // Player needs a certain reputation to accept.
    // destinationPlanetId: 'terra_nova_3', // For missions that go to planets.
    // cargoItemId: 'spare_parts_crate', // An ID to look up cargo details.
    // dangerLevel: 'low', // Could affect chances of pirate attacks.

};