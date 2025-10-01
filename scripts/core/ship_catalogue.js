const shipCatalogue = {
    'default_ship': {
            shipID: 'Stardust Drifter',
            shipImage: 'default_ship',
            shipWidth: 200,
            shipHeight: 240,
            shipCargoCapacity: 100, // Cargo hold capacity
            shipMainEngine: 'chemical_rocket',
            shipManeuveringThrusters: 'ion_thrusters',
            shipBoosters: [],
            shipShield: [],
            shipArmor: 'light_armor',
            shipDescription: "For what this ship lacks in cargo capacity, it makes up for in maneuverability and speed.",

            //Speeds and handling
            shipThrustPower: 0.15,
            shipRotationSpeed: 0.012,          
            shipMaxSpeed: 20.0,
            shipOverSpeed: 20.1,
            
            //Health and condition
            shipMaxHealth: 100,
            shipCurrentHealth: 85, // Slightly damaged at start
            shipDeclineRate: 0.0001, // Health decline per frame due to wear and tear
            shipOverSpeedDamage: 0.0165, // Damage taken per frame over max speed 

            //Ship Value & Economy
            shipBuyValue: 3500,
            shipSellValue: 2750,
            shipRepairCostPerHealth: 2, // Cost to repair per health point
            shipThrusterBurnRate: 0.2, // Fuel consumption rate per thrust action
            shipOxygenBurnRate: 0.00165, // Oxygen consumption rate per frame
            shipElectricityBurnRate: 0.03, // Electricity consumption rate per frame
            
            //Starting Equipment & Upgrades
            shipUpgrades: [], // No upgrades to start 
            shipConsumables: {
                shipFuel: { current: 50, max: 100 },
                shipOxygen: { current: 100, max: 100 },
                shipElectricity: { current: 100, max: 100 }
            },

            //Thruster Configuration using Ratios
            shipThrusters: {
                front_left:  { x_ratio: -0.45, y_ratio: -0.070, angle_deg:  360 },
                front_right: { x_ratio:  0.45, y_ratio: -0.070, angle_deg:  360 },
                rear_left:   { x_ratio: -0.45, y_ratio:  0.040, angle_deg:  0 },
                rear_right:  { x_ratio:  0.45, y_ratio:  0.040, angle_deg:  0 }
            },
        },
    }

            /* The main ship will also have equipped drop ships
            equipped: [
                {
                    dropShipType: 'pea_drop_ship',
                    name: 'Pea Pod 1',
                    imageSrc: 'images/peaDropShip.png',
                    value: 5000,
                    state: 'operational',
                    upgrades: []
                    */