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

        // ENHANCED: Initialize fleet location data for existing saves (Task 3.8)
        // This ensures compatibility with save files created before the fleet system
        this.initializeFleetLocationData();
    }

    // Saves the current data object to localStorage.
    saveData() {
        if (this.data) {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
            console.log("Player data SAVED.", this.data);
        }
    }

    // A helper function to easily get the player's bank balance.
    getBalance() {
        return this.data.playerBankBalance;
    }
    addMoney(amount) {
        if (this.data) {
            // Task 5.7: Ensure all ships have mission assignment fields
            this.initializeFleetMissionFields();
            this.data.playerBankBalance += amount;
            console.log(`Added ${amount} credits. New balance: ${this.data.playerBankBalance}`);
            this.saveData(); // This is the crucial step!
        }
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
            this.saveData();
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
        if (this.data && celestialBodies) {
            this.data.worldState.planets = celestialBodies.map(planet => ({
                id: planet.id,
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