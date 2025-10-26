const baseShipTemplate = {
    shipSize: 1, // Base size multiplier
    shipWidth: 200, // Add missing width
    shipHeight: 240, // Add missing height
    shipDefaultZoom: 1.0,
    shipCargoCapacity: [],
    shipMainEngine: 'chemical_rocket',
    shipManeuveringThrusters: 'ion_thrusters',
    shipBoosters: [],
    shipShield: [],
    shipArmor: 'light_armor',
    shipDescription: "A reliable, multi-purpose vessel.",
    shipThrustPower: 0.15,
    shipRotationSpeed: 0.012,
    shipMaxSpeed: 20.0,
    shipOverSpeed: 20.1,
    shipMaxHealth: 100,
    shipCurrentHealth: 85,
    shipDeclineRate: 0.0001,
    shipOverSpeedDamage: 0.0165,
    shipBuyValue: 3500,
    shipSellValue: 2750,
    shipRepairCostPerHealth: 2,
    shipThrusterBurnRate: 0.2,
    shipOxygenBurnRate: 0.00165,
    shipElectricityBurnRate: 0.03,
    shipUpgrades: [],
    shipConsumables: {
        shipFuel: { current: 50, max: 100 },
        shipOxygen: { current: 100, max: 100 },
        shipElectricity: { current: 100, max: 100 }
    },
};

// The main catalogue now just lists the unique properties
const shipCatalogue = {
    /*
    'default_ship': {
        ...baseShipTemplate, // Start with a copy of all the base stats

        // Now, only list what's DIFFERENT
        shipID: 'Stardust Drifter',
        shipImage: 'default_ship',
        shipDescription: "For what this ship lacks in cargo capacity, it makes up for in maneuverability and speed.",
        shipSize: 0.75,
        shipDefaultZoom: 1.5,
        shipThrusters: {
            front_left: { x_ratio: -0.45, y_ratio: -0.070, angle_deg: 360 },
            front_right: { x_ratio: 0.45, y_ratio: -0.070, angle_deg: 360 },
            rear_left: { x_ratio: -0.45, y_ratio: 0.040, angle_deg: 0 },
            rear_right: { x_ratio: 0.45, y_ratio: 0.040, angle_deg: 0 }
        },
    },
*/
    'stardust_drifter': {
        ...baseShipTemplate, // Start with the same base stats

        // Now, only list the unique stats for the Stardust Drifter
        shipID: 'Stardust Drifter',
        shipImage: 'stardust_drifter',
        shipGlamShot: 'sd_glam_shot',
        shipDescription: "A nimble interceptor, prized by scouts and couriers.",
        shipSize: 0.4,
        shipDefaultZoom: 1.5,
        shipCargoCapacity: 1, // Slightly More cargo
        shipMaxSpeed: 20.0, // Slightly Slower
        shipBuyValue: 4000,
        shipSellValue: 3500,
        shipThrusters: {
            front_left: { x_ratio: -0.45, y_ratio: -0.070, angle_deg: 360 },
            front_right: { x_ratio: 0.45, y_ratio: -0.070, angle_deg: 360 },
            rear_left: { x_ratio: -0.45, y_ratio: 0.040, angle_deg: 0 },
            rear_right: { x_ratio: 0.45, y_ratio: 0.040, angle_deg: 0 }
        },
    },
    'apex_dart': {
        ...baseShipTemplate, // Start with the same base stats

        // Now, only list the unique stats for the Apex Dart
        shipID: 'Apex Dart',
        shipImage: 'apex_dart',
        shipGlamShot: 'ad_glam_shot',
        shipDescription: "A nimble interceptor, prized by scouts and couriers.",
        shipSize: 0.8,
        shipDefaultZoom: 1.40,
        shipCargoCapacity: 2, // Slightly More cargo
        shipThrustPower: 0.12, // Slightly Slower
        shipBuyValue: 5000,
        shipSellValue: 4000,
        shipThrusters: { // A completely different thruster layout
            front_left: { x_ratio: -0.05, y_ratio: -0.4, angle_deg: 360 },
            front_right: { x_ratio: 0.04, y_ratio: -0.4, angle_deg: 360 },
            rear_left: { x_ratio: -0.15, y_ratio: 0.42, angle_deg: 0 },
            rear_right: { x_ratio: 0.14, y_ratio: 0.42, angle_deg: 0 }
        },
    },
    'echo_pacer': {
        ...baseShipTemplate, // Start with the same base stats

        // Now, only list the unique stats for the Echo Pacer
        shipID: 'Echo Pacer',
        shipImage: 'echo_pacer',
        shipGlamShot: 'ep_glam_shot',
        shipDescription: "A versatile ship favored by explorers and traders alike.",
        shipSize: 0.8,
        shipDefaultZoom: 1.40,
        shipCargoCapacity: 2, // Slightly More cargo
        shipThrustPower: 0.14, // Slightly Slower
        shipBuyValue: 5500,
        shipSellValue: 4500,
        shipThrusters: { // A completely different thruster layout
            front_left: { x_ratio: -0.04, y_ratio: -0.42, angle_deg: 360 },
            front_right: { x_ratio: 0.055, y_ratio: -0.42, angle_deg: 360 },
            rear_left: { x_ratio: -0.050, y_ratio: 0.40, angle_deg: 0 },
            rear_right: { x_ratio: 0.06, y_ratio: 0.40, angle_deg: 0 }
        },
    },
    'zenith_runner': {
        ...baseShipTemplate, // Start with the same base stats

        // Now, only list the unique stats for the Zenith Runner
        shipID: 'Zenith Runner',
        shipImage: 'zenith_runner',
        shipGlamShot: 'zr_glam_shot',
        shipDescription: "Packing more cargo than its competitors.",
        shipSize: 1.0,
        shipDefaultZoom: 0.9,
        shipCargoCapacity: 4, // Slightly More cargo
        shipThrustPower: 0.14, // Slightly Slower
        shipBuyValue: 5500,
        shipSellValue: 4500,
        shipThrusters: { // A completely different thruster layout
            front_left: { x_ratio: -0.04, y_ratio: -0.42, angle_deg: 360 },
            front_right: { x_ratio: 0.055, y_ratio: -0.42, angle_deg: 360 },
            rear_left: { x_ratio: -0.050, y_ratio: 0.40, angle_deg: 0 },
            rear_right: { x_ratio: 0.06, y_ratio: 0.40, angle_deg: 0 }
        },
    },
    'black_falcon': {
        ...baseShipTemplate, // Start with the same base stats

        // Now, only list the unique stats for the Black Falcon
        shipID: 'Black Falcon',
        shipImage: 'black_falcon',
        shipGlamShot: 'bf_glam_shot',
        shipDescription: "Packing more cargo than its competitors.",
        shipSize: 2.5,
        shipDefaultZoom: 1.0,
        shipCargoCapacity: 4, // Slightly More cargo

        shipRotationSpeed: 0.002,
        shipThrustPower: 0.04, // Slightly Slower
        shipBuyValue: 5500,
        shipSellValue: 4500,
        shipThrusters: { // A completely different thruster layout
            front_left: { x_ratio: -0.04, y_ratio: -0.42, angle_deg: 360 },
            front_right: { x_ratio: 0.055, y_ratio: -0.42, angle_deg: 360 },
            rear_left: { x_ratio: -0.050, y_ratio: 0.40, angle_deg: 0 },
            rear_right: { x_ratio: 0.06, y_ratio: 0.40, angle_deg: 0 }
        },
    },
};


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