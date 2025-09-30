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
                consumables: {
                    fuel: { current: 50 },
                    oxygen: { current: 100 },
                    electricity: { current: 100 }
                },
                upgrades: ['extra_cargo_pod'],
                
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

