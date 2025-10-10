// scripts/core/player_data.js

function getNewPlayerData() {
    return {
        // Player Profile
        cargoCoName: "StarHopper Cargo",
        playerBankBalance: 2500,
        activeShipId: 1,
        activeMissionId: null,
        activeMissionState: null,

        // Player's Fleet
        fleet: [
            {
                id: 1,
                shipTypeId: 'stardust_drifter',
                name: 'Stardust Drifter',
                currentHealth: 85,
                maxHealth: 100, // Add max health for easier percentage calculations
                
                // Ship location and state for fleet management
                location: {
                    type: 'docked', // 'docked', 'space', 'orbit'
                    x: 0,
                    y: 0,
                    velX: 0,
                    velY: 0,
                    angle: 0,
                    isDocked: true,
                    isOrbitLocked: false,
                    // For orbit locations
                    planetName: null,
                    orbitData: null // { planetIndex, orbitRadius, orbitAngle }
                },
                
                consumables: {
                    fuel: { current: 50, max: 100 },
                    oxygen: { current: 100, max: 100 },
                    electricity: { current: 100, max: 100 }
                },
                
                upgrades: ['extra_cargo_pod'],
                
                // Mission assignment for this specific ship
                assignedMissionId: null,
                missionState: null, // Mission-specific state data
                
                // UPDATED: Now a list of unique drop ships with their own state
                equippedDropShips: [
                    {
                        id: 101, // Unique ID for this specific drop ship
                        dropShipTypeId: 'pea_drop_ship',
                        name: 'Pea Pod 1',
                        state: 'operational', // Can now be 'crashed', 'damaged', etc.
                        consumables: {
                            fuel: { current: 50, max: 100 },
                            electricity: { current: 100, max: 100 }
                        }
                    }
                ]
            }
        ]
    };
}

