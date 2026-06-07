// scripts/core/mission_catalogue.js
//
// Era 1 — Local contractor missions
// Types: DOCK_CERT, FETCH_AND_DELIVER, ORBIT_PLANET, LAND_ON_PLANET, PICK_UP_CARGO
// Targeting: hubPlanetRank (0/1 = nearest starter worlds), firstUndiscoveredRank (scan targets)

const missionCatalogue = {

    // ── Tier 0 — Tutorial chain (one-time, teaches core loop) ─────────────

    "TUTORIAL_DOCK_01": {
        era: 1,
        tier: 0,
        sortOrder: 5,
        oneTime: true,
        issuer: "Station Operations",
        title: "Docking Clamp Certification",
        briefing: "Engineering is load-testing the new mag-clamps on your berth. Launch clear of the station, then re-dock under your own power. If the clamps fail, you'll drift — if they hold, you earn your cert and ¢150.",
        flavorTag: "Certification",
        reward: 150,
        type: 'DOCK_CERT',
        completionLine: "Clamps held. You're certified for unsupervised dock approach.",
    },

    "FETCH_ORBIT_01": {
        era: 1,
        tier: 0,
        sortOrder: 15,
        oneTime: true,
        issuer: "Orbital Cargo Solutions",
        title: "Trauma Kit Orbital Pickup",
        briefing: "Med bay stockpiled trauma kits at the nearest charted world's orbital depot. Fly there, lock orbit to load the pallet, then return and dock before the window closes.",
        flavorTag: "Fetch & deliver",
        reward: 400,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'orbit',
        hubPlanetRank: 0,
        timeLimitSec: 1200,
        requires: { completedMissions: ['TUTORIAL_DOCK_01'] },
        completionLine: "Med bay confirms the kits are aboard station. Priority lane cleared.",
    },

    "FETCH_ORBIT_02": {
        era: 1,
        tier: 0,
        sortOrder: 25,
        oneTime: true,
        issuer: "Station Operations",
        title: "Comms Fuse Bank Run",
        briefing: "Survey buoy comms are fuzzing out. A fuse bank is waiting at the second nearest charted world — orbit to pick it up, then haul it back to the dock on the clock.",
        flavorTag: "Fetch & deliver",
        reward: 450,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'orbit',
        hubPlanetRank: 1,
        timeLimitSec: 1200,
        requires: { completedMissions: ['FETCH_ORBIT_01'] },
        completionLine: "Ops reports cleaner signal on the buoy network.",
    },

    "FETCH_LAND_01": {
        era: 1,
        tier: 0,
        sortOrder: 35,
        oneTime: true,
        issuer: "Titan Supply Services",
        title: "Scrubber Coupler Surface Pickup",
        briefing: "Night shift left O₂ scrubber couplers in a surface warehouse on the inner charted world. Launch your drop ship, land at any pad, load the crate, return to mothership, then dock here — timed contract.",
        flavorTag: "Fetch & deliver",
        reward: 550,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'land',
        hubPlanetRank: 0,
        timeLimitSec: 1500,
        requires: { completedMissions: ['FETCH_ORBIT_02'] },
        completionLine: "Titan logs the couplers. Night shift owes you one.",
    },

    "FETCH_LAND_02": {
        era: 1,
        tier: 0,
        sortOrder: 45,
        oneTime: true,
        issuer: "Station Operations",
        title: "Galley Protein Block Run",
        briefing: "Galley freezer failed and the backup protein blocks are ground-side on the outer charted world. Land, collect, return to station. Crew morale depends on food that is not 'chewy.'",
        flavorTag: "Fetch & deliver",
        reward: 500,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'land',
        hubPlanetRank: 1,
        timeLimitSec: 1500,
        requires: { completedMissions: ['FETCH_LAND_01'] },
        completionLine: "Galley sends thanks. Nobody asks about the old blocks.",
    },

    // ── Tier 1 — Charting contracts (unknown signals) ─────────────────────

    "SCAN_PLANET_01": {
        era: 1,
        tier: 1,
        sortOrder: 50,
        issuer: "Orbital Cargo Solutions",
        title: "Primary Unknown Signal Scan",
        briefing: "Chart office has a flagged unknown contact — probably a gas giant. Establish stable orbit and run a full sensor sweep so K-14 stops guessing.",
        flavorTag: "Orbital survey",
        reward: 750,
        type: 'ORBIT_PLANET',
        firstUndiscoveredRank: 0,
        discoveryBonus: 250,
        timeLimitSec: 1800,
        requires: { completedMissions: ['FETCH_LAND_02'] },
        completionLine: "Chart office updates the sector map. First survey pays extra.",
    },

    "SCAN_PLANET_02": {
        era: 1,
        tier: 1,
        sortOrder: 60,
        issuer: "Orbital Cargo Solutions",
        title: "Secondary Signal Confirmation",
        briefing: "Another unknown is cluttering the queue. Orbit, scan, and confirm composition — dispatch needs it named before surface contracts go out.",
        flavorTag: "Orbital survey",
        reward: 850,
        type: 'ORBIT_PLANET',
        firstUndiscoveredRank: 1,
        discoveryBonus: 250,
        timeLimitSec: 1800,
        requires: { minSurveyedWorlds: 3 },
        completionLine: "Signal logged. The board can assign follow-up work.",
    },

    // ── Tier 2 — Locked until chart expands ───────────────────────────────

    "LAND_ON_PLANET_01": {
        era: 1,
        tier: 2,
        sortOrder: 70,
        issuer: "Geological Survey Office",
        title: "Insured Survey Gear Drop",
        briefing: "GSO will not insure drop-ship deliveries until you've catalogued enough nearby worlds. Launch, land at Survey Outpost Pad 1 on any catalogued solid world, and offload the seismic kit.",
        flavorTag: "Surface drop",
        reward: 1500,
        type: 'LAND_ON_PLANET',
        requiredPadId: 1,
        requires: { minSurveyedWorlds: 3 },
        completionLine: "GSO confirms gear on Pad 1. Lander ops billable from here on.",
    },

    "PICK_UP_CARGO_01": {
        era: 1,
        tier: 2,
        sortOrder: 80,
        issuer: "Geological Survey Office",
        title: "Core Sample Extraction",
        briefing: "Regional survey wants physical cores from a solid-surface world you've already charted. Land, collect the sample, return to your mothership, then dock here for payout.",
        flavorTag: "Sample run",
        reward: 2700,
        type: 'PICK_UP_CARGO',
        hasPickedUpCargo: false,
        requires: {
            minSurveyedWorlds: 4,
            surveyedPlanetTypes: ['terran_world', 'water_world', 'ice_world', 'volcanic_world', 'city_world']
        },
        completionLine: "Sample logged. GSO transfers contract funds to your account.",
    },

    // ── Era 2 — System opens (planet-type routes) ─────────────────────────

    "SCAN_PLANET_03": {
        era: 2,
        tier: 3,
        sortOrder: 85,
        issuer: "Orbital Cargo Solutions",
        title: "Rim Signal Triage Scan",
        briefing: "Chart office wants the next unknown on the rim logged before type-specific routes go wide. Establish orbit and run a full sweep.",
        flavorTag: "Orbital survey",
        reward: 1100,
        type: 'ORBIT_PLANET',
        firstUndiscoveredRank: 0,
        discoveryBonus: 300,
        timeLimitSec: 2100,
        requires: {
            completedMissions: ['SCAN_PLANET_02'],
            minSurveyedWorlds: 5
        },
        completionLine: "Rim contact catalogued. Type-route contracts are clearing dispatch.",
    },

    "ERA2_ICE_COOLANT_01": {
        era: 2,
        tier: 3,
        sortOrder: 90,
        issuer: "Station Operations",
        title: "Cryogenic Coolant Orbital Load",
        briefing: "Thermal systems need H₂ slurry from your charted ice world. Lock orbit at the ice body, load the pallet, and return to dock before it sublimates.",
        flavorTag: "Type-route fetch",
        reward: 2800,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'orbit',
        requiredPlanetTypeId: 'ice_world',
        timeLimitSec: 1800,
        requires: {
            completedMissions: ['PICK_UP_CARGO_01'],
            surveyedPlanetTypes: ['ice_world']
        },
        pickupLine: 'Coolant pallet secured in cargo lock. Return to Alpha Station and dock.',
        completionLine: "Ops confirms coolant delivery. Dock thermal margins are back in spec.",
    },

    "ERA2_WATER_SAMPLE_01": {
        era: 2,
        tier: 3,
        sortOrder: 100,
        oneTime: true,
        issuer: "K-14 Hydrographics Bureau",
        title: "Pelagic Microbe Tray",
        briefing: "Hydrographics needs a live microbe tray from brine pools on your surveyed ocean world. Land at Pad 1, collect the tray, return to mothership, then dock for payout.",
        flavorTag: "Type-specific sample",
        reward: 3200,
        type: 'PICK_UP_CARGO',
        requiredPlanetTypeId: 'water_world',
        requiredPadId: 1,
        requires: {
            minSurveyedWorlds: 5,
            surveyedPlanetTypes: ['water_world']
        },
        completionLine: "Tray logged. Open-ocean bioscience contracts are now on the board.",
    },

    "ERA2_VOLCANIC_LOGGER_01": {
        era: 2,
        tier: 3,
        sortOrder: 110,
        issuer: "Geological Survey Office",
        title: "Mantle Vent Logger Drop",
        briefing: "Only Pad 2 on a surveyed volcanic world is rated for vent proximity. Offload the logger package — land, deploy, and do not linger.",
        flavorTag: "Surface drop",
        reward: 3400,
        type: 'LAND_ON_PLANET',
        requiredPlanetTypeId: 'volcanic_world',
        requiredPadId: 2,
        requires: {
            minSurveyedWorlds: 5,
            surveyedPlanetTypes: ['volcanic_world']
        },
        completionLine: "Logger transmitting. GSO adds vent monitoring to your contractor file.",
    },

    "ERA2_CITY_MANIFEST_01": {
        era: 2,
        tier: 3,
        sortOrder: 120,
        issuer: "Orbital Cargo Solutions",
        title: "Urban Customs Seal Run",
        briefing: "Customs on your charted city world will not release bonded freight without a physical seal collected on the ground. Land, pick up the seal, return to dock.",
        flavorTag: "Type-route fetch",
        reward: 3100,
        type: 'FETCH_AND_DELIVER',
        pickupAt: 'land',
        requiredPlanetTypeId: 'city_world',
        timeLimitSec: 2000,
        requires: {
            surveyedPlanetTypes: ['city_world'],
            completedMissions: ['ERA2_ICE_COOLANT_01']
        },
        pickupLine: 'Customs seal secured. Return to Alpha Station and dock.',
        completionLine: "Bonded freight cleared. Urban route certification noted.",
    },

};
