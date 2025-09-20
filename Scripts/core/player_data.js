// scripts/core/player_data.js

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