class FleetManager {

    constructor() {
        // REMOVED: Old hardcoded activeShipId - now managed by PlayerDataManager
        // The active ship ID is now stored in playerDataManager.data.activeShipId
        // This allows the active ship to persist across game sessions and be shared
        // between different game systems (fleet manager, space scene, etc.)
    }

    // A method to get the full data object for the active ship
    getActiveShipData() {
        // Get the active ship ID from the player data manager instead of local property
        // This ensures we're always getting the current active ship from saved data
        const activeShip = playerDataManager.getActiveShip();
        if (!activeShip) {
            console.warn('No active ship found in player data');
            return null;
        }
        
        // Look up the ship's blueprint data in the catalogue using the ship's type
        // This gives us the base stats, images, and specifications for this ship type
        return shipCatalogue[activeShip.shipTypeId];
    }

    // Updated method to properly manage active ship through PlayerDataManager
    setActiveShip(shipId) {
        // Save the current active ship's state before switching (if there is one)
        // This preserves the ship's location, fuel, health, etc. when switching ships
        const currentActiveShip = playerDataManager.getActiveShip();
        if (currentActiveShip && currentActiveShip.id !== shipId) {
            this.saveCurrentShipState(currentActiveShip);
        }
        
        // Set the new active ship using PlayerDataManager
        // This automatically saves the change to localStorage
        playerDataManager.setActiveShip(shipId);
        
        console.log(`Active ship changed to: ${shipId}`);
    }

    // NEW METHOD: Save the current state of a ship when switching away from it
    saveCurrentShipState(ship) {
        // This method saves the ship's current state when we switch to a different ship
        // It captures location, consumables, and health so nothing is lost
        
        // For now, we'll save basic state - this will be enhanced when we integrate
        // with the space scene to capture real-time position, velocity, etc.
        const stateToSave = {
            // Location data (will be updated by space scene integration)
            location: ship.location || {
                type: 'docked',       // Safest fallback - ship is at station if location unknown
                x: 0,                 // Default coordinates (at station)
                y: 0,
                velX: 0,             // No velocity when docked
                velY: 0,
                angle: 0,            // Default rotation
                isDocked: true,      // Consistent with 'docked' type - ship is at station
                isOrbitLocked: false, // Not orbiting when docked
                planetName: null,
                orbitData: null
            },
            // Preserve current consumables state
            consumables: ship.consumables,
            // Preserve current health
            currentHealth: ship.currentHealth
        };
        
        // Use the PlayerDataManager to save this state
        playerDataManager.saveShipState(ship.id, stateToSave);
        
        console.log(`Saved state for ship ${ship.id} before switching`);
    }

    // NEW METHOD: Save real-time ship state from space scene (Task 3.4)
    saveActiveShipStateFromSpaceScene(spaceScene) {
        // This method is called by the space scene to save the current ship's real-time state
        // It captures the ship's actual position, velocity, docking status, etc. from the game
        
        const activeShip = playerDataManager.getActiveShip();
        if (!activeShip || !spaceScene || !spaceScene.ship) {
            console.warn('Cannot save ship state - missing active ship or space scene data');
            return;
        }
        
        // Build the location data from the space scene's current state
        const currentLocation = {
            type: 'space',  // Default to space, will be overridden below for special cases
            x: spaceScene.ship.x,
            y: spaceScene.ship.y,
            velX: spaceScene.ship.velX || 0,
            velY: spaceScene.ship.velY || 0,
            angle: spaceScene.ship.angle || 0,
            isDocked: spaceScene.ship.isDocked || false,
            isOrbitLocked: spaceScene.ship.isOrbitLocked || false,
            planetName: null,
            orbitData: null
        };
        
        // If the ship is orbiting a planet, save the orbit details
        if (spaceScene.ship.isOrbitLocked && spaceScene.ship.orbitingPlanet) {
            currentLocation.type = 'orbit';
            currentLocation.planetName = spaceScene.ship.orbitingPlanet.name;
            currentLocation.orbitData = {
                planetIndex: spaceScene.ship.orbitingPlanet.index,
                orbitRadius: spaceScene.ship.orbitRadius,
                orbitAngle: spaceScene.ship.orbitAngle,
                lockedOrbitSpeed: spaceScene.ship.lockedOrbitSpeed || 0  // FIXED: Save the actual orbital speed
            };
        }
        
        // If the ship is docked at a station, mark it as docked
        if (spaceScene.ship.isDocked) {
            currentLocation.type = 'docked';
        }
        
        // Also save the ship's current consumables and health from space scene
        const stateToSave = {
            location: currentLocation,
            // Save fuel, oxygen, electricity if space scene tracks them
            consumables: {
                fuel: { 
                    current: spaceScene.ship.fuel || activeShip.consumables?.fuel?.current || 0, 
                    max: activeShip.consumables?.fuel?.max || 100 
                },
                oxygen: { 
                    current: spaceScene.ship.oxygen || activeShip.consumables?.oxygen?.current || 100, 
                    max: activeShip.consumables?.oxygen?.max || 100 
                },
                electricity: { 
                    current: spaceScene.ship.electricity || activeShip.consumables?.electricity?.current || 100, 
                    max: activeShip.consumables?.electricity?.max || 100 
                }
            },
            // Save health if space scene tracks it
            currentHealth: spaceScene.ship.health || activeShip.currentHealth
        };
        
        // Use PlayerDataManager to save this real-time state
        playerDataManager.saveShipState(activeShip.id, stateToSave);
        
        console.log(`Saved real-time state for active ship ${activeShip.id} from space scene`);
    }

    buyShip(shipID) {
        const shipData = shipCatalogue[shipID];
        if (!shipData) {
            console.error(`Ship with ID ${shipID} not found.`);
            return;
        }

        // Check if the player has enough currency to buy the ship
        if (playerDataManager.getBalance() < shipData.shipBuyValue) {
            alert(`Not enough credits to buy ${shipData.shipID}.`);
            return;
        }

        // Deduct the price from the player's currency
        playerDataManager.addMoney(-shipData.shipBuyValue);

        // Add the ship to the player's fleet (store full ship object)
        if (!playerDataManager.data.fleet) {
            playerDataManager.data.fleet = [];
        }
        // Create a new ship object for the fleet
        const newShip = {
            id: Date.now(), // Unique ID for the ship instance
            shipTypeId: shipID, // Use the catalogue key, not the display name
            name: shipData.shipName || shipData.shipID,
            currentHealth: shipData.shipMaxHealth || 100,
            maxHealth: shipData.shipMaxHealth || 100,
            
            // Initialize ship location as docked (Task 3.8)
            location: {
                type: 'docked',
                x: 0,
                y: 0,
                velX: 0,
                velY: 0,
                angle: 0,
                isDocked: true,
                isOrbitLocked: false,
                planetName: null,
                orbitData: null
            },
            
            // Initialize consumables with max values from ship data
            consumables: {
                fuel: { 
                    current: shipData.shipConsumables?.shipFuel?.max || 100, 
                    max: shipData.shipConsumables?.shipFuel?.max || 100 
                },
                oxygen: { 
                    current: shipData.shipConsumables?.shipOxygen?.max || 100, 
                    max: shipData.shipConsumables?.shipOxygen?.max || 100 
                },
                electricity: { 
                    current: shipData.shipConsumables?.shipElectricity?.max || 100, 
                    max: shipData.shipConsumables?.shipElectricity?.max || 100 
                }
            },
            
            upgrades: [],
            
            // Mission assignment for this specific ship
            assignedMissionId: null,
            missionState: null,
            
            equippedDropShips: [],
            cargoCapacity: shipData.cargoCapacity || 0
        };
        
        // Use PlayerDataManager to add the ship to the fleet
        // This method handles the fleet array initialization and saving automatically
        playerDataManager.addShipToFleet(newShip);

        // Set the new ship as the active ship using our improved method
        // This will save the current ship's state (if any) and switch to the new ship
        this.setActiveShip(newShip.id);

        alert(`Bought ship: ${shipData.shipID}`);
        // NOTE: No need to call playerDataManager.saveData() here because
        // both addShipToFleet() and setActiveShip() already save the data
    }

    sellShip(shipId) {
        // Find the ship in the player's fleet using the ship ID
        const ship = playerDataManager.getShipById(shipId);
        if (!ship) {
            console.error(`Ship with ID ${shipId} not found in fleet.`);
            return;
        }

        // Get the ship's blueprint data to determine sell value
        const shipData = shipCatalogue[ship.shipTypeId];
        if (!shipData) {
            console.error(`Ship type ${ship.shipTypeId} not found in catalogue.`);
            return;
        }

        // Remove the ship from the fleet using PlayerDataManager
        // This method handles active ship cleanup if we're selling the active ship
        const removedShip = playerDataManager.removeShipFromFleet(shipId);
        
        if (removedShip) {
            // Refund the player a portion of the ship's price (80% of original value)
            const refundAmount = Math.floor(shipData.shipSellValue || (shipData.shipBuyValue * 0.8));
            playerDataManager.addMoney(refundAmount);
            
            console.log(`Sold ship: ${removedShip.name} for ${refundAmount} credits`);
            alert(`Sold ${removedShip.name} for ${refundAmount} credits`);
        }
        // NOTE: PlayerDataManager methods automatically save data, so no manual save needed
    }
};

