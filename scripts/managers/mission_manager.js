// scripts/managers/mission_manager.js

class MissionManager {
    constructor() {
        // This will hold the list of missions currently available to the player.
        this.availableMissions = [];
    }

    // This is the main function to generate a new list of missions.
    // In the future, this could get very complex (e.g., based on player level or location).
    // For now, it will just pick a few random missions from our catalogue.
    generateAvailableMissions(count = 5) {
        // Clear the old list
        this.availableMissions = [];

        // Get a list of all possible mission IDs from our catalogue file.
        const allMissionIds = Object.keys(missionCatalogue);

        // Make sure we don't try to pick more missions than exist.
        const numToGenerate = Math.min(count, allMissionIds.length);

        while (this.availableMissions.length < numToGenerate) {
            // Pick a random mission ID from the list.
            const randomIndex = Math.floor(Math.random() * allMissionIds.length);
            const randomMissionId = allMissionIds[randomIndex];

            // --- Important Check! ---
            // This ensures we don't add the same mission to the list twice.
            const isAlreadyAdded = this.availableMissions.some(mission => mission.id === randomMissionId);

            if (!isAlreadyAdded) {
                // Find the full mission data from the catalogue.
                const missionData = missionCatalogue[randomMissionId];

                // Create a new object for our available list, including the unique ID.
                this.availableMissions.push({
                    id: randomMissionId,
                    ...missionData // This copies all properties (title, reward, etc.)
                });
            }
        }

        console.log("Generated available missions:", this.availableMissions);
        return this.availableMissions;
    }
    acceptMission(missionId) {
        // First, check if the player is already on a mission.
        if (playerDataManager.getActiveMissionId()) {
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
            // You can add more 'case' statements here for future mission types!
            /*
            case 'PICK_UP_CARGO':
                // This requires orbiting a planet (to "pick up cargo"), then returning to dock.
                if (scene.name === 'space' && scene.ship && scene.ship.isOrbitLocked && scene.ship.orbitingPlanet) {
                    // Player is orbiting a planet - we could set a flag here if needed.
                    hasPickedUpCargo = true; // You'd need to define this variable somewhere.
            
                    isCompleted = true;
                }
                break;
            */
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
