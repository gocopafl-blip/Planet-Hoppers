// scripts/managers/player_data_manager.js

class PlayerDataManager {
    constructor() {
        this.data = null; // We'll load the data here
        this.SAVE_KEY = 'planetHoppersSaveData'; // The key for localStorage
    }

    // Tries to load data from localStorage, or creates a new game if none is found.
    loadData() {
        const savedData = localStorage.getItem(this.SAVE_KEY);
        if (savedData) {
            this.data = JSON.parse(savedData);
            console.log("Player data LOADED from save.", this.data);
        } else {
            this.data = getNewPlayerData(); // From player_data.js
            this.saveData(); // ADD THIS LINE to save the new data immediately
            console.log("No save file found. Created NEW player data.", this.data);
        }

        this.migrateSaveData();

        // ENHANCED: Initialize fleet location data for existing saves (Task 3.8)
        // This ensures compatibility with save files created before the fleet system
        this.initializeFleetLocationData();
        this.initializeTransactionLedger();
    }

    /**
     * Upgrade older localStorage saves so new systems (worldState, ledger, consumables) do not crash.
     */
    migrateSaveData() {
        if (!this.data) return false;

        let changed = false;

        if (!this.data.worldState) {
            this.data.worldState = { planets: null, lastGenerated: null };
            changed = true;
        }

        this.initializeTransactionLedger();

        if (!Array.isArray(this.data.fleet)) {
            this.data.fleet = [];
            changed = true;
        }

        this.data.fleet.forEach(ship => {
            if (this.normalizeShipTypeId(ship)) changed = true;
            if (this.ensureShipConsumables(ship)) changed = true;
        });

        if (this.migratePlanetDiscoveryData()) changed = true;
        if (this.migrateStarterDiscoveredPlanets()) changed = true;

        if (changed) {
            console.log('Player save migrated to current schema.');
            this.saveData();
        }

        return changed;
    }

    /** Ensure every saved planet has a valid discoveryStatus (Phase 1.1). */
    migratePlanetDiscoveryData() {
        const planets = this.data?.worldState?.planets;
        if (!Array.isArray(planets)) return false;

        let changed = false;
        planets.forEach(planet => {
            if (!planet || isValidPlanetDiscoveryStatus(planet.discoveryStatus)) return;
            planet.discoveryStatus = PLANET_DISCOVERY_STATUS.UNDISCOVERED;
            changed = true;
        });
        return changed;
    }

    getPlanetRecordById(planetId) {
        const planets = this.data?.worldState?.planets;
        if (!planets || planetId == null) return null;
        return planets.find(p => p && p.id === planetId) || null;
    }

    getPlanetDiscoveryStatus(planetId) {
        const record = this.getPlanetRecordById(planetId);
        if (!record) return PLANET_DISCOVERY_STATUS.UNDISCOVERED;
        return isValidPlanetDiscoveryStatus(record.discoveryStatus)
            ? record.discoveryStatus
            : PLANET_DISCOVERY_STATUS.UNDISCOVERED;
    }

    /**
     * Set discovery status for a planet. Updates save data and live celestialBodies if loaded.
     * Status only advances forward: undiscovered → surveyed → active_destination.
     */
    setPlanetDiscoveryStatus(planetId, nextStatus) {
        if (!isValidPlanetDiscoveryStatus(nextStatus)) {
            console.warn(`Invalid discovery status: ${nextStatus}`);
            return false;
        }

        const record = this.getPlanetRecordById(planetId);
        if (!record) {
            console.warn(`setPlanetDiscoveryStatus: planet ${planetId} not found in worldState`);
            return false;
        }

        const rank = {
            [PLANET_DISCOVERY_STATUS.UNDISCOVERED]: 0,
            [PLANET_DISCOVERY_STATUS.SURVEYED]: 1,
            [PLANET_DISCOVERY_STATUS.ACTIVE_DESTINATION]: 2
        };
        const current = this.getPlanetDiscoveryStatus(planetId);
        if (rank[nextStatus] < rank[current]) {
            return false;
        }
        if (current === nextStatus) return true;

        record.discoveryStatus = nextStatus;
        this.syncLivePlanetDiscoveryStatus(planetId, nextStatus);
        this.saveData();
        console.log(`Planet ${record.name || planetId} discovery → ${nextStatus}`);
        return true;
    }

    markPlanetSurveyed(planetId) {
        return this.setPlanetDiscoveryStatus(planetId, PLANET_DISCOVERY_STATUS.SURVEYED);
    }

    markPlanetActiveDestination(planetId) {
        return this.setPlanetDiscoveryStatus(planetId, PLANET_DISCOVERY_STATUS.ACTIVE_DESTINATION);
    }

    getPlanetsByDiscoveryStatus(status) {
        const planets = this.data?.worldState?.planets;
        if (!Array.isArray(planets)) return [];
        return planets.filter(p => p && this.getPlanetDiscoveryStatus(p.id) === status);
    }

    /** Count of worlds in surveyed or active_destination state (Phase 1.4 unlock checks). */
    getSurveyedWorldCount() {
        const planets = this.data?.worldState?.planets;
        if (!Array.isArray(planets)) return 0;
        return planets.filter(p => p?.id && this.isPlanetDiscovered(p.id)).length;
    }

    /** Set of planetTypeId values among discovered worlds. */
    getSurveyedPlanetTypeIds() {
        const planets = this.data?.worldState?.planets;
        const types = new Set();
        if (!Array.isArray(planets)) return types;
        planets.forEach(p => {
            if (p?.planetTypeId && this.isPlanetDiscovered(p.id)) {
                types.add(p.planetTypeId);
            }
        });
        return types;
    }

    /** One-time migration: if no worlds are known yet, survey the two nearest to the saved hub. */
    migrateStarterDiscoveredPlanets() {
        const planets = this.data?.worldState?.planets;
        const hub = this.data?.worldState?.hubPosition;
        if (!Array.isArray(planets) || planets.length === 0 || !hub) return false;

        const anyKnown = planets.some(p => p && this.isPlanetDiscovered(p.id));
        if (anyKnown) return false;

        const nearest = [...planets]
            .filter(p => p && p.id)
            .sort((a, b) => {
                const da = Math.hypot(a.x - hub.x, a.y - hub.y);
                const db = Math.hypot(b.x - hub.x, b.y - hub.y);
                return da - db;
            })
            .slice(0, STARTER_DISCOVERED_PLANET_COUNT);

        let changed = false;
        nearest.forEach(p => {
            if (this.setPlanetDiscoveryStatus(p.id, PLANET_DISCOVERY_STATUS.SURVEYED)) {
                changed = true;
            }
        });
        if (changed) {
            console.log(`Discovery migration: marked ${nearest.length} hub-near worlds as surveyed.`);
        }
        return changed;
    }

    saveHubPosition(x, y) {
        if (!this.data) return;
        if (!this.data.worldState) {
            this.data.worldState = { planets: null, lastGenerated: null, hubPosition: null };
        }
        this.data.worldState.hubPosition = { x, y };
    }

    /** Stable label for unsurveyed worlds — must match mission board and NAV (Phase 1.3). */
    getUnknownSignalLabel(planet) {
        if (!planet) return 'Unknown Signal';
        return `Unknown Signal ${(planet.index ?? 0) + 1}`;
    }

    /** Planet IDs targeted by an accepted ORBIT_PLANET / scan contract on any fleet ship. */
    getActiveSurveyTargetPlanetIds() {
        const ids = new Set();
        const addTarget = (missionId) => {
            if (!missionId || !missionCatalogue[missionId]) return;
            const mission = missionCatalogue[missionId];
            if (mission.type !== 'ORBIT_PLANET') return;
            const index = mission.destinationPlanetIndex;
            if (index == null) return;
            const record = this.data?.worldState?.planets?.find(p => p && p.index === index);
            if (record?.id) ids.add(record.id);
            const live = typeof celestialBodies !== 'undefined'
                ? celestialBodies.find(p => p && p.index === index)
                : null;
            if (live?.id) ids.add(live.id);
        };

        (this.data?.fleet || []).forEach(ship => addTarget(ship?.assignedMissionId));
        addTarget(this.getActiveMissionId());
        return ids;
    }

    /** True once a world is surveyed or unlocked as a cargo destination. */
    isPlanetDiscovered(planetId) {
        return this.getPlanetDiscoveryStatus(planetId) !== PLANET_DISCOVERY_STATUS.UNDISCOVERED;
    }

    /** Nav / radar visibility: hidden | survey_target | discovered */
    getPlanetNavState(planet) {
        if (!planet?.id) return 'hidden';
        if (this.isPlanetDiscovered(planet.id)) return 'discovered';
        if (this.getActiveSurveyTargetPlanetIds().has(planet.id)) return 'survey_target';
        return 'hidden';
    }

    getPlanetNavLabel(planet) {
        if (!planet) return '';
        const state = this.getPlanetNavState(planet);
        if (state === 'discovered') return planet.name;
        if (state === 'survey_target') return this.getUnknownSignalLabel(planet);
        return '';
    }

    /** @deprecated Use getPlanetNavLabel for map UI */
    getPlanetDisplayName(planet) {
        return this.getPlanetNavLabel(planet) || this.getUnknownSignalLabel(planet);
    }

    syncLivePlanetDiscoveryStatus(planetId, status) {
        const apply = (body) => {
            if (body && body.id === planetId) {
                body.discoveryStatus = status;
            }
        };
        if (typeof planetManager !== 'undefined' && planetManager.celestialBodies) {
            planetManager.celestialBodies.forEach(apply);
        }
        if (typeof celestialBodies !== 'undefined' && Array.isArray(celestialBodies)) {
            celestialBodies.forEach(apply);
        }
    }

    /** Copy discoveryStatus from save onto runtime planet objects after generate/restore. */
    applyDiscoveryStatusToCelestialBodies(bodies) {
        if (!Array.isArray(bodies)) return;
        bodies.forEach(body => {
            if (!body?.id) return;
            body.discoveryStatus = this.getPlanetDiscoveryStatus(body.id);
        });
    }

    /** Map legacy display-name shipTypeId values to catalogue keys. */
    normalizeShipTypeId(ship) {
        if (!ship?.shipTypeId) return false;
        if (shipCatalogue[ship.shipTypeId]) return false;

        for (const [catalogueKey, catalogueData] of Object.entries(shipCatalogue)) {
            if (catalogueData.shipID === ship.shipTypeId || catalogueKey === ship.shipTypeId) {
                console.warn(
                    `Save migration: ship "${ship.name}" shipTypeId "${ship.shipTypeId}" → "${catalogueKey}"`
                );
                ship.shipTypeId = catalogueKey;
                return true;
            }
        }

        if (ship.name) {
            for (const [catalogueKey, catalogueData] of Object.entries(shipCatalogue)) {
                if (catalogueData.shipID === ship.name) {
                    console.warn(
                        `Save migration: ship "${ship.name}" shipTypeId inferred → "${catalogueKey}"`
                    );
                    ship.shipTypeId = catalogueKey;
                    return true;
                }
            }
        }

        return false;
    }

    /** Ensure fuel / oxygen / electricity slots exist with numeric current and max. */
    ensureShipConsumables(ship) {
        const catalogue = ship?.shipTypeId ? shipCatalogue[ship.shipTypeId] : null;
        const template = catalogue
            ? { shipConsumables: catalogue.shipConsumables }
            : ship;
        const defaults = this.createDefaultConsumables(template);

        if (!ship.consumables) {
            ship.consumables = defaults;
            return true;
        }

        let changed = false;
        ['fuel', 'oxygen', 'electricity'].forEach(key => {
            const slot = ship.consumables[key];
            if (!slot || typeof slot.max !== 'number') {
                ship.consumables[key] = { ...defaults[key] };
                changed = true;
            } else if (slot.current == null || Number.isNaN(slot.current)) {
                slot.current = slot.max;
                changed = true;
            }
        });

        return changed;
    }

    // Saves the current data object to localStorage.
    saveData() {
        if (!this.data) return false;
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
            console.log("Player data SAVED.");
            return true;
        } catch (err) {
            // Common when opening index.html via file:// — some browsers block or restrict storage.
            console.warn(
                "Could not save to localStorage (progress kept in memory for this session only). " +
                "Use Go Live (http://localhost) for reliable saves. Error:",
                err
            );
            return false;
        }
    }

    // A helper function to easily get the player's bank balance.
    getBalance() {
        return this.data?.playerBankBalance ?? 0;
    }

    initializeTransactionLedger() {
        if (!this.data) return;
        if (!Array.isArray(this.data.transactionLedger)) {
            this.data.transactionLedger = [];
        }
    }

    /**
     * Append a ledger row (newest first). Amount is always stored as a positive number.
     */
    recordTransaction(type, category, amount, description, meta = {}) {
        if (!this.data) return null;
        this.initializeTransactionLedger();

        const entry = {
            id: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            timestamp: Date.now(),
            type,
            category,
            amount: Math.abs(Math.round(amount)),
            balanceAfter: this.data.playerBankBalance,
            description: description || '',
            ...meta
        };

        this.data.transactionLedger.unshift(entry);
        if (this.data.transactionLedger.length > FINANCE_LEDGER_MAX_ENTRIES) {
            this.data.transactionLedger.length = FINANCE_LEDGER_MAX_ENTRIES;
        }
        return entry;
    }

    /**
     * Credit the account (deposits). Used for mission payouts, ship sales, loan disbursement, etc.
     */
    credit(amount, category, description, meta = {}) {
        if (!this.data || amount <= 0) return false;

        this.data.playerBankBalance += amount;
        this.recordTransaction(
            FINANCE_TRANSACTION_TYPES.DEPOSIT,
            category,
            amount,
            description,
            meta
        );
        console.log(`[Finance] +${amount} (${category}): ${description}. Balance: ${this.data.playerBankBalance}`);
        this.saveData();
        return true;
    }

    /**
     * Debit the account if funds are available (withdrawals / expenses).
     */
    spend(amount, category, description, meta = {}) {
        if (!this.data || amount <= 0) return false;
        if (this.getBalance() < amount) {
            console.warn(`[Finance] Insufficient funds for ${amount} (${category}): ${description}`);
            return false;
        }

        this.data.playerBankBalance -= amount;
        this.recordTransaction(
            FINANCE_TRANSACTION_TYPES.WITHDRAWAL,
            category,
            amount,
            description,
            meta
        );
        console.log(`[Finance] -${amount} (${category}): ${description}. Balance: ${this.data.playerBankBalance}`);
        this.saveData();
        return true;
    }

    getTransactionHistory(limit = 50) {
        if (!this.data?.transactionLedger) return [];
        return this.data.transactionLedger.slice(0, limit);
    }

    /** @deprecated Prefer credit() or spend() with a FINANCE_CATEGORIES label. */
    addMoney(amount) {
        if (!this.data) return false;
        this.initializeFleetMissionFields();
        if (amount >= 0) {
            return this.credit(amount, FINANCE_CATEGORIES.OTHER, 'Account adjustment');
        }
        return this.spend(-amount, FINANCE_CATEGORIES.OTHER, 'Account adjustment');
    }

    // Task 5.7: Ensure all ships have assignedMissionId and missionState fields
    initializeFleetMissionFields() {
        if (!this.data || !Array.isArray(this.data.fleet)) return;
        let changed = false;
        this.data.fleet.forEach(ship => {
            if (typeof ship.assignedMissionId === 'undefined') {
                ship.assignedMissionId = null;
                changed = true;
            }
            if (typeof ship.missionState === 'undefined') {
                ship.missionState = null;
                changed = true;
            }
        });
        if (changed) {
            this.saveData();
            console.log("Fleet mission fields initialized/migrated for all ships.");
        }
    }

    // A helper function to easily get the player's company name.
    getCompanyName() {
        return this.data.cargoCoName;
    }

    // A helper function to find the currently active ship object from the fleet.
    getActiveShip() {
        if (!this.data || !this.data.fleet) return null;

        return this.data.fleet.find(ship => ship.id === this.data.activeShipId);
    }

    // Fleet Management Methods for Task 3.2

    // Get a specific ship by ID from the fleet
    getShipById(shipId) {
        if (!this.data || !this.data.fleet) return null;
        return this.data.fleet.find(ship => ship.id === shipId);
    }

    // Set the active ship ID and save data with error handling (Task 3.7)
    setActiveShip(shipId) {
        if (this.data) {
            // Handle clearing active ship (setting to null)
            if (shipId === null || shipId === undefined) {
                this.data.activeShipId = null;
                console.log('Active ship cleared - no ship currently selected');
                this.saveData();
                return true;
            }

            // Validate that the ship exists in the fleet before setting it as active
            const ship = this.getShipById(shipId);
            if (!ship) {
                console.error(`Cannot set active ship: Ship with ID ${shipId} not found in fleet`);
                return false;
            }

            this.data.activeShipId = shipId;
            console.log(`Active ship set to: ${shipId} (${ship.name})`);
            this.saveData();
            return true;
        } else {
            console.error('Cannot set active ship: Player data not initialized');
            return false;
        }
    }

    // Update a ship's location and state data
    updateShipLocation(shipId, locationData) {
        const ship = this.getShipById(shipId);
        if (ship) {
            ship.location = { ...ship.location, ...locationData };
            console.log(`Updated ship ${shipId} location:`, ship.location);
            // NOTE: Does not call saveData() - caller is responsible for persisting
            // This prevents multiple localStorage writes when updating multiple ships
        }
    }

    // Update a ship's consumables (fuel, oxygen, electricity)
    updateShipConsumables(shipId, consumablesData) {
        const ship = this.getShipById(shipId);
        if (ship) {
            if (consumablesData.fuel) {
                ship.consumables.fuel = { ...ship.consumables.fuel, ...consumablesData.fuel };
            }
            if (consumablesData.oxygen) {
                ship.consumables.oxygen = { ...ship.consumables.oxygen, ...consumablesData.oxygen };
            }
            if (consumablesData.electricity) {
                ship.consumables.electricity = { ...ship.consumables.electricity, ...consumablesData.electricity };
            }
            console.log(`Updated ship ${shipId} consumables:`, ship.consumables);
            this.saveData();
        }
    }

    // Update a ship's health
    updateShipHealth(shipId, currentHealth) {
        const ship = this.getShipById(shipId);
        if (ship) {
            ship.currentHealth = currentHealth;
            console.log(`Updated ship ${shipId} health to: ${currentHealth}`);
            this.saveData();
        }
    }

    // Save complete ship state (combines location, consumables, health)
    saveShipState(shipId, stateData) {
        const ship = this.getShipById(shipId);
        if (ship) {
            // Update location if provided
            if (stateData.location) {
                ship.location = { ...ship.location, ...stateData.location };
            }

            // Update consumables if provided
            if (stateData.consumables) {
                Object.keys(stateData.consumables).forEach(consumableType => {
                    if (ship.consumables[consumableType]) {
                        ship.consumables[consumableType] = {
                            ...ship.consumables[consumableType],
                            ...stateData.consumables[consumableType]
                        };
                    }
                });
            }

            // Update health if provided
            if (stateData.currentHealth !== undefined) {
                ship.currentHealth = stateData.currentHealth;
            }

            // Update navigation data if provided (Issue #2 fix)
            if (stateData.navigation) {
                ship.navigation = { ...ship.navigation, ...stateData.navigation };
            }

            console.log(`Saved complete state for ship ${shipId}:`, ship);
            this.saveData();
        }
    }

    // Get all ships in the fleet
    getFleet() {
        return this.data?.fleet || [];
    }

    // Add a new ship to the fleet with proper initialization (Task 3.8)
    addShipToFleet(shipData) {
        if (!this.data.fleet) {
            this.data.fleet = [];
        }

        // ENHANCED: Ensure proper ship location initialization (Task 3.8)
        // All new ships should start docked at station with complete location data
        if (!shipData.location) {
            shipData.location = this.createDefaultShipLocation();
        } else {
            // If location exists, ensure it has all required fields
            shipData.location = { ...this.createDefaultShipLocation(), ...shipData.location };
        }

        // Ensure consumables are properly initialized
        if (!shipData.consumables) {
            shipData.consumables = this.createDefaultConsumables(shipData);
        }

        // ENHANCED: Ensure navigation data is properly initialized (Issue #2 fix)
        if (!shipData.navigation) {
            shipData.navigation = this.createDefaultNavigation();
        }

        // Ensure basic required fields exist
        if (!shipData.id) {
            shipData.id = Date.now() + Math.random(); // Fallback ID generation
        }
        if (shipData.currentHealth === undefined) {
            shipData.currentHealth = shipData.maxHealth || 100;
        }

        this.data.fleet.push(shipData);
        console.log(`Added ship to fleet with proper initialization:`, shipData);
        this.saveData();
    }

    // NEW METHOD: Create default location for new ships (Task 3.8)
    createDefaultShipLocation() {
        // All new ships start docked at station with zero velocity
        // This ensures consistent initial state for fleet management
        return {
            type: 'docked',
            x: 0,           // Will be set by space scene when ship is positioned
            y: 0,           // Will be set by space scene when ship is positioned
            velX: 0,        // No velocity when docked
            velY: 0,        // No velocity when docked
            angle: 0,       // Default facing direction
            isDocked: true, // Ship starts docked at station
            isOrbitLocked: false,     // Not in orbit when docked
            planetName: null,         // Not orbiting any planet
            orbitData: null          // No orbital mechanics data
        };
    }

    // NEW METHOD: Create default navigation data for new ships (Issue #2 fix)
    createDefaultNavigation() {
        return {
            waypoints: [],        // No initial waypoints
            finalWaypoint: null,  // No initial destination
            lastUpdated: null     // Never updated
        };
    }

    // NEW METHOD: Create default consumables for new ships (Task 3.8)
    createDefaultConsumables(shipData) {
        // Initialize consumables to maximum values for new ships
        // Use ship catalogue data if available, otherwise use sensible defaults
        const fuelMax = shipData.shipConsumables?.shipFuel?.max || 100;
        const oxygenMax = shipData.shipConsumables?.shipOxygen?.max || 100;
        const electricityMax = shipData.shipConsumables?.shipElectricity?.max || 100;

        return {
            fuel: {
                current: fuelMax,
                max: fuelMax
            },
            oxygen: {
                current: oxygenMax,
                max: oxygenMax
            },
            electricity: {
                current: electricityMax,
                max: electricityMax
            }
        };
    }

    // NEW METHOD: Initialize location data for ships that might be missing it (Task 3.8)
    initializeFleetLocationData() {
        // This method ensures all ships in the fleet have proper location data
        // Useful for upgrading existing save files to the new fleet system
        if (!this.data || !this.data.fleet) return;

        let updatedShips = 0;
        this.data.fleet.forEach(ship => {
            if (!ship.location) {
                ship.location = this.createDefaultShipLocation();
                updatedShips++;
                console.log(`Initialized location data for ship: ${ship.name} (ID: ${ship.id})`);
            } else {
                // Ensure existing location has all required fields
                const defaultLocation = this.createDefaultShipLocation();
                let needsUpdate = false;

                // Check for missing fields and add them
                Object.keys(defaultLocation).forEach(key => {
                    if (ship.location[key] === undefined) {
                        ship.location[key] = defaultLocation[key];
                        needsUpdate = true;
                    }
                });

                if (needsUpdate) {
                    updatedShips++;
                    console.log(`Updated location data for ship: ${ship.name} (ID: ${ship.id})`);
                }
            }
        });

        if (updatedShips > 0) {
            console.log(`Initialized/updated location data for ${updatedShips} ships`);
            this.saveData();
        }
    }

    // Remove a ship from the fleet
    removeShipFromFleet(shipId) {
        if (this.data?.fleet) {
            const index = this.data.fleet.findIndex(ship => ship.id === shipId);
            if (index !== -1) {
                const removedShip = this.data.fleet.splice(index, 1)[0];
                console.log(`Removed ship from fleet:`, removedShip);

                // If this was the active ship, clear active ship ID
                if (this.data.activeShipId === shipId) {
                    this.data.activeShipId = null;
                }

                this.saveData();
                return removedShip;
            }
        }
        return null;
    }

    // Assign a mission to a specific ship
    assignMissionToShip(shipId, missionId, missionState = null) {
        const ship = this.getShipById(shipId);
        if (ship) {
            ship.assignedMissionId = missionId;
            ship.missionState = missionState;
            console.log(`Assigned mission ${missionId} to ship ${shipId}`);
            this.saveData();
        }
    }

    // Clear mission assignment from a ship
    clearShipMission(shipId) {
        const ship = this.getShipById(shipId);
        if (ship) {
            ship.assignedMissionId = null;
            ship.missionState = null;
            console.log(`Cleared mission assignment from ship ${shipId}`);
            this.saveData();
        }
    }

    // Get all ships that don't have an assigned mission
    getAvailableShips() {
        return this.getFleet().filter(ship => !ship.assignedMissionId);
    }

    // Get all ships with assigned missions
    getShipsWithMissions() {
        return this.getFleet().filter(ship => ship.assignedMissionId);
    }
    setActiveMissionId(missionId) {
        if (this.data) {
            this.data.activeMissionId = missionId;
            console.log(`Player's active mission set to: ${missionId}`);
            this.saveData();
        }
    }
    // Gets the state object for the currently active mission.
    getActiveMissionState() {
        return this.data ? this.data.activeMissionState : null;
    }

    // Updates the state of the active mission and saves the game.
    updateActiveMissionState(newState) {
        if (this.data) {
            // Object.assign merges the new state with the old one.
            this.data.activeMissionState = Object.assign(this.data.activeMissionState || {}, newState);
            console.log("Active mission state updated:", this.data.activeMissionState);
            this.saveData();
        }

    }

    // Gets the ID of the player's currently active mission.
    getActiveMissionId() {
        return this.data ? this.data.activeMissionId : null;
    }

    // PLANET PERSISTENCE METHODS (for planet location consistency)

    // Save the current planet layout to maintain orbital ship references
    savePlanetData(celestialBodies) {
        if (!this.data || !celestialBodies) return;

        if (!this.data.worldState) {
            this.data.worldState = { planets: null, lastGenerated: null };
        }

        this.data.worldState.planets = celestialBodies.map(planet => ({
                id: planet.id,
                index: planet.index,
                discoveryStatus: isValidPlanetDiscoveryStatus(planet.discoveryStatus)
                    ? planet.discoveryStatus
                    : this.getPlanetDiscoveryStatus(planet.id),
                planetTypeId: planet.planetTypeId,
                name: planet.name,
                x: planet.x,
                y: planet.y,
                radius: planet.radius,
                mass: planet.mass,
                // Store image key reference instead of image object
                imageKey: planet.planetImages ? planet.planetImages[0] : null,
                backgroundOptions: planet.backgroundOptions,
                // Store other essential planet properties
                baseGravity: planet.baseGravity,
                wind: planet.wind,
                seismicStability: planet.seismicStability,
                dangerLevel: planet.dangerLevel,
                hasAtmosphericParticles: planet.hasAtmosphericParticles
        }));
        this.data.worldState.lastGenerated = Date.now();
        console.log('Planet data saved:', this.data.worldState.planets.length, 'planets');
        this.saveData();
    }

    // Get saved planet data if available
    getSavedPlanetData() {
        return this.data?.worldState?.planets || null;
    }

    // Check if we have valid saved planet data
    hasSavedPlanetData() {
        return this.data?.worldState?.planets && this.data.worldState.planets.length > 0;
    }

    // Clear planet data (for regeneration)
    clearPlanetData() {
        if (this.data?.worldState) {
            this.data.worldState.planets = null;
            this.data.worldState.lastGenerated = null;
            this.saveData();
            console.log('Planet data cleared - will regenerate on next game start');
        }
    }

}