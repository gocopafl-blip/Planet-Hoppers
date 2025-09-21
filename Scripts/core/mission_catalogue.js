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

        // --- Mission Type & Requirements ---
        // This is where you can get creative in the future.
        // For now, we only have one type: 'DELIVER_TO_DOCK'.
        // You could later add types like:
        // 'COLLECT_FROM_PLANET', 'ESCORT_SHIP', 'EXPLORE_SECTOR', etc.
        type: 'DELIVER_TO_DOCK',

        // --- Future Expansion Ideas ---
        // Here are some properties you could add later to make missions more complex:
        //
        // requiredCargoSpace: 5, // How much space the cargo takes up.
        // timeLimit: 300, // A countdown timer in seconds.
        // requiredReputation: 100, // Player needs a certain reputation to accept.
        // destinationPlanetId: 'terra_nova_3', // For missions that go to planets.
        // cargoItemId: 'spare_parts_crate', // An ID to look up cargo details.
        // dangerLevel: 'low', // Could affect chances of pirate attacks.
    },

    "DELIVERY_ALPHA_02": {
        title: "Medical Supplies Run",
        description: "Transport a pallet of urgent medical supplies to the dock.",
        reward: 400,
        type: 'DELIVER_TO_DOCK',
    },

    // --- ADD YOUR NEXT MISSION HERE ---
    // "DELIVERY_BETA_01": { ... },

};