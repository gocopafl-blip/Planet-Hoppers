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
    // Located in: scripts/managers/mission_manager.js

    acceptMission(missionId) {
        // 1. Check if the player is already on a mission.
        if (playerDataManager.getActiveMissionId()) {
            console.warn("Cannot accept new mission, player already has an active mission.");
            alert("You already have an active mission! Complete or abandon it first.");
            return;
        }

        // 2. Get the mission and ship data.
        const missionData = missionCatalogue[missionId];
        if (!missionData) {
            console.error(`Attempted to accept a mission that does not exist: ${missionId}`);
            return;
        }
        const activeShip = playerDataManager.getActiveShip();
        console.log('INTERROGATING missionData:', missionData);

        // 3. Check for cargo space requirement.
        if (missionData.requiredCargoSpace > 0) {
            let usedCargoSpace = 0;
            for (const cargoItem of activeShip.cargoHold) {
                const itemDetails = cargoCatalogue[cargoItem.id];
                if (itemDetails) { usedCargoSpace += itemDetails.size; }
            }

            const availableSpace = activeShip.maxCargoSpace - usedCargoSpace;
            if (availableSpace < missionData.requiredCargoSpace) {
                alert(`Mission Denied: Requires ${missionData.requiredCargoSpace} cargo space, but you only have ${availableSpace} available.`);
                return;
            }
        }

        // 4. Accept the mission & add cargo
        playerDataManager.setActiveMissionId(missionId);
        if (missionData.cargoItemId) {
            activeShip.cargoHold.push({ id: missionData.cargoItemId, quantity: 1 });
        }
        console.log('CARGO ADDED. Current hold:', activeShip.cargoHold);
        playerDataManager.updateActiveMissionState({});
        playerDataManager.saveData(); // Save all changes!
        alert(`Mission Accepted: ${missionData.title}`);

        // 5. --- THE FIX ---
        // Now that all data is saved, animate the board away and THEN switch the scene.
        const missionBoard = document.getElementById('mission-board');
        missionBoard.classList.remove('slide-in');
        missionBoard.classList.add('slide-out');

        setTimeout(() => {
            gameManager.switchScene(spaceDockScene);
        }, 500); // This delay MUST match the animation time in style.css
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
