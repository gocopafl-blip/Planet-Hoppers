// scripts/managers/mission_manager.js

class MissionManager {
    constructor() {
        // This will hold the list of missions currently available to the player.
        this.availableMissions = [];
    }

    // This is the main function to generate a new list of missions.
    // In the future, this could get very complex (e.g., based on player level or location).
    // For now, it will just pick a few random missions from our catalogue.
    generateAvailableMissions(count = 2) {
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
        } else {
            console.error(`Attempted to accept a mission that is not available: ${missionId}`);
        }
    }
    // Checks for and completes the player's active mission.
    completeMission() {
        const activeMissionId = playerDataManager.getActiveMissionId();

        // 1. Check if the player actually has a mission.
        if (!activeMissionId) {
            console.log("Player has no active mission to complete.");
            return;
        }

        // 2. Find the mission's data in our master catalogue.
        const missionData = missionCatalogue[activeMissionId];
        if (!missionData) {
            console.error(`Could not find mission data for ID: ${activeMissionId}`);
            return;
        }

        // For now, we assume all missions are completed by returning to the dock.
        // In the future, you could add checks here, like:
        // if (missionData.type === 'DELIVER_TO_PLANET' && player.location === missionData.destination)

        // 3. Give the player their reward.
        playerDataManager.addMoney(missionData.reward);

        // 4. Clear the active mission from the player's data.
        playerDataManager.setActiveMissionId(null);

        console.log(`Mission "${missionData.title}" completed! Player earned ${missionData.reward} credits.`);
        // In a real game, you would show a success message on the screen!
    }
}
// --- Future Functions ---
// We will build these out in later steps.
//
// getActiveMission() { ... }
