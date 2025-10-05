// scripts/managers/trade_manager.js

class TradeManager {
    constructor() {
        // This will hold the list of trades currently available to the player.
        this.availableTrades = [];
    }

    // This is the main function to generate a new list of trades.
    // In the future, this could get very complex (e.g., based on player level or location).
    // For now, it will just pick a few random trades from our catalogue.
    generateAvailableTrades(count = 5) {
        // Clear the old list
        this.availableTrades = [];

        // Get a list of all possible trade IDs from our catalogue file.
        const allTradeIds = Object.keys(shipCatalogue);

        // Make sure we don't try to pick more trades than exist.
        const numToGenerate = Math.min(count, allTradeIds.length);

        while (this.availableTrades.length < numToGenerate) {
            // Pick a random trade ID from the list.
            const randomIndex = Math.floor(Math.random() * allTradeIds.length);
            const randomTradeId = allTradeIds[randomIndex];

            // --- Important Check! ---
            // This ensures we don't add the same trade to the list twice.
            const isAlreadyAdded = this.availableTrades.some(trade => trade.id === randomTradeId);

            if (!isAlreadyAdded) {
                // Find the full trade data from the catalogue.
                const tradeData = shipCatalogue[randomTradeId];

                // Create a new object for our available list, including the unique ID.
                this.availableTrades.push({
                    id: randomTradeId,
                    ...tradeData // This copies all properties (title, reward, etc.)
                });
            }
        }

        console.log("Generated available trades:", this.availableTrades);
        return this.availableTrades;
    }
    /*
    acceptTrade(tradeId) {
        // First, check if the player is already on a trade.
        if (playerDataManager.getActiveTradeId()) {
            // In a real game, you'd show an error message to the player.
            console.warn("Cannot accept new mission, player already has an active mission.");
            return;
        }

        // Check if the mission we're trying to accept is actually available.
        const missionExists = this.availableMissions.some(m => m.id === missionId);
        if (missionExists) {
            playerDataManager.setActiveMissionId(missionId);
            playerDataManager.updateActiveMissionState({});
        } else {
            console.error(`Attempted to accept a mission that is not available: ${missionId}`);
        }
    }
    // Checks for and completes the player's active mission.
    completeMission(scene) {
        // --- Diagnostic Safeguard ---
        if (!scene) {
            console.warn("completeMission was called without a valid scene. Ignoring.");
            return;
        }

        const activeMissionId = playerDataManager.getActiveMissionId();
        if (!activeMissionId) return;

        // 2. Find the mission's data in our master catalogue.
        const missionData = missionCatalogue[activeMissionId];
        if (!missionData) {
            console.error(`Could not find mission data for ID: ${activeMissionId}`);
            return;
        }
        let isCompleted = false; // A flag to track if we met the conditions.

        // Check the mission's type to decide how to complete it.
        switch (missionData.type) {
            case 'DELIVER_TO_DOCK':
                // This check is specific to the space scene and is complete when the ship is docked.
                if (scene.name === 'space' && scene.ship && scene.ship.isDocked) {
                    isCompleted = true;
                }
                break;

            case 'ORBIT_PLANET':
                // For this type, completion happens when orbiting the correct planet.
                //const targetPlanet = celestialBodies[missionData.destinationPlanetIndex];
                if (scene.name === 'space' && scene.ship && scene.ship.isOrbitLocked && scene.ship.orbitingPlanet) {
                    isCompleted = true;
                }
                break;

            case 'LAND_ON_PLANET':
                // This check is specific to the lander scene
                if (scene.name === 'lander' && scene.gameState === 'landed') {
                    isCompleted = true;
                }
                break;
            //
            case 'PICK_UP_CARGO':
                // Get the current state of this mission
                const missionState = playerDataManager.getActiveMissionState();

                // STEP 1: Check if we need to pick up the cargo.
                // We check this in the lander scene.
                if (scene.name === 'lander' && scene.gameState === 'landed' && !missionState.hasPickedUpCargo) {
                    // Update the mission state to remember the cargo is collected.
                    playerDataManager.updateActiveMissionState({ hasPickedUpCargo: true });

                    // Show a confirmation to the player, but the mission is NOT complete yet.
                    alert("Survey Sample Taken: You have retrieved the survey sample. Now, return to the station to collect your contract payout.");
                }

                // STEP 2: Check if we have the cargo and are at the dock to deliver it.
                // We check this in the space scene.
                if (scene.name === 'space' && missionState.hasPickedUpCargo && scene.ship.isDocked) {
                    // If both conditions are true, the mission is fully completed.
                    isCompleted = true;
                }
                break;

        }

        // If any of the conditions above were met, finalize the mission.
        if (isCompleted) {
            playerDataManager.addMoney(missionData.reward);
            playerDataManager.setActiveMissionId(null);
            console.log(`Mission "${missionData.title}" completed! Player earned ${missionData.reward} credits.`);

            // We'll use a simple alert for now to notify the player.
            alert(`Mission Complete: ${missionData.title}\n\nReward: ¢ ${missionData.reward.toLocaleString()}`);
        }

        // In the future, you could add checks here, like:
        // if (missionData.type === 'DELIVER_TO_PLANET' && player.location === missionData.destination)

        // You could also add a system for failed missions, time limits, etc.
    }
}
// --- Future Functions ---
// We will build these out in later steps.
//
// getActiveMission() { ... }
    */
}
