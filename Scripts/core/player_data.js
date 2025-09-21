// scripts/core/player_data.js

// scripts/core/player_data.js

function getNewPlayerData() {
    return {
        // Player Profile
        cargoCoName: "StarHopper Cargo",
        playerBankBalance: 2500,
        activeShipId: 1,

        // Player's Fleet
        fleet: [
            {
                id: 1,
                shipTypeId: 'stardust_drifter',
                name: 'Stardust Drifter',
                state: 'disrepaired',
                upgrades: [],
                consumables: {
                    fuel: { current: 50, max: 100 },
                    oxygen: { current: 100, max: 100 },
                    electricity: { current: 100, max: 100 }
                },
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
/*
const playerData = {
    // Company and Balance
    cargoCoName: "StarHopper Cargo", // Default name, can be changed by the player later
    playerBankBalance: 2500, // Starting with a small amount of credits [cite: 21]

    // Player's Fleet
    fleet: [
        {
            shipType: 'main_ship',
            name: 'Stardust Drifter',
            imageSrc: 'images/ship.png',
            value: 50000,
            shipState: 'disrepaired', // Ship is in a slightly disrepaired state [cite: 18]
            shipUpgrades: [], // No upgrades to start [cite: 18]
            shipConsumables: {
                shipFuel: { current: 50, max: 100 }, // Thruster fuel tank is half full [cite: 19]
                shipOxygen: { current: 100, max: 100 }, // Oxygen tanks are full [cite: 19]
                shipElectricity: { current: 100, max: 100 } // Batteries are fully charged [cite: 20]
            },
            // The main ship will also have equipped drop ships
            equipped: [
                {
                    dropShipType: 'pea_drop_ship',
                    name: 'Pea Pod 1',
                    imageSrc: 'images/peaDropShip.png',
                    value: 5000,
                    state: 'operational',
                    upgrades: []
                }
            ]
        }
    ]
};
*/