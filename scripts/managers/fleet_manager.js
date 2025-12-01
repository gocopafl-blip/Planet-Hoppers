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
            // If we're in the space scene, save the real-time state including navigation data
            if (gameManager.activeScene && gameManager.activeScene.sceneName === 'space') {
                this.saveCurrentShipState(currentActiveShip, gameManager.activeScene);
            } else {
                // Fallback to basic state saving if not in space scene
                this.saveCurrentShipState(currentActiveShip);
            }
        }
        
        // Set the new active ship using PlayerDataManager
        // This automatically saves the change to localStorage
        playerDataManager.setActiveShip(shipId);
        
        console.log(`Active ship changed to: ${shipId}`);
    }

    // Enhanced method to save ship state with optional real-time data from space scene
    saveCurrentShipState(ship, spaceScene = null) {
        // This method saves the ship's current state when we switch to a different ship
        // If spaceScene is provided, captures real-time data including navigation waypoints
        // If not, saves basic state with safe fallback values
        
        let stateToSave;
        
        if (spaceScene && spaceScene.ship) {
            // Real-time state saving from space scene
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
                    lockedOrbitSpeed: spaceScene.ship.lockedOrbitSpeed || 0,
                    orbitDirection: spaceScene.ship.orbitDirection || 1
                };
            }
            
            // If the ship is docked at a station, mark it as docked
            if (spaceScene.ship.isDocked) {
                currentLocation.type = 'docked';
            }
            
            stateToSave = {
                location: currentLocation,
                // Save real-time consumables from space scene
                consumables: {
                    fuel: { 
                        current: spaceScene.ship.fuel || ship.consumables?.fuel?.current || 0, 
                        max: ship.consumables?.fuel?.max || 100 
                    },
                    oxygen: { 
                        current: spaceScene.ship.oxygen || ship.consumables?.oxygen?.current || 100, 
                        max: ship.consumables?.oxygen?.max || 100 
                    },
                    electricity: { 
                        current: spaceScene.ship.electricity || ship.consumables?.electricity?.current || 100, 
                        max: ship.consumables?.electricity?.max || 100 
                    }
                },
                // Save real-time health from space scene
                currentHealth: spaceScene.ship.health || ship.currentHealth,
                // Save navigation waypoints specific to this ship
                navigation: {
                    waypoints: spaceScene.navScreen?.waypoints ? [...spaceScene.navScreen.waypoints] : [],
                    finalWaypoint: spaceScene.navScreen?.finalWaypoint ? {...spaceScene.navScreen.finalWaypoint} : null,
                    lastUpdated: Date.now()
                }
            };
        } else {
            // Basic state saving with fallback values
            stateToSave = {
                // Location data with safe fallbacks
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
                currentHealth: ship.currentHealth,
                // Preserve existing navigation data if any
                navigation: ship.navigation || {
                    waypoints: [],
                    finalWaypoint: null,
                    lastUpdated: null
                }
            };
        }
        
        // Use the PlayerDataManager to save this state
        playerDataManager.saveShipState(ship.id, stateToSave);
        
        const saveType = spaceScene ? 'real-time' : 'basic';
        console.log(`Saved ${saveType} state for ship ${ship.id}`);
    }

    buyShip(shipCatalogueKey) {
        const shipData = shipCatalogue[shipCatalogueKey];
        if (!shipData) {
            console.error(`Ship with ID ${shipCatalogueKey} not found.`);
            return;
        }

        // Check if the player has enough currency to buy the ship
        if (playerDataManager.getBalance() < shipData.shipBuyValue) {
            alert(`Not enough credits to buy ${shipData.shipID}.`);
            return;
        }
        const playerGivenName = prompt(`Enter a name for your new ${shipData.shipID}:`);
        // Deduct the price from the player's currency
        playerDataManager.addMoney(-shipData.shipBuyValue);

        // Add the ship to the player's fleet (store full ship object)
        if (!playerDataManager.data.fleet) {
            playerDataManager.data.fleet = [];
        }
        // Create a new ship object for the fleet
        const newShip = {
            id: Date.now(), // Unique ID for the ship instance
            shipTypeId: shipCatalogueKey, // Use the catalogue key, not the display name
            name: playerGivenName || shipData.shipID,
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

    // Task 8.1.2: Extract fleet physics logic for background simulation
    // This method updates fleet ship physics working with fleet data from playerDataManager
    // It can be called independently of the space scene for background simulation
    updateFleetPhysics(fleetShips, celestialBodies, worldWidth, worldHeight, deltaTime) {
        // Update each fleet ship's physics
        // fleetShips: Array of fleet ship data objects from playerDataManager.data.fleet
        // celestialBodies: Array of planet objects
        // worldWidth/Height: World boundary dimensions
        // deltaTime: Time elapsed since last update (for future use)
        
        if (!fleetShips || fleetShips.length === 0) {
            return;
        }

        const activeShipId = playerDataManager.data.activeShipId;

        fleetShips.forEach(shipData => {
            if (!shipData || !shipData.location) return;

            // Skip active ship - it's handled by space scene when active
            if (shipData.id === activeShipId) return;

            // Skip docked ships - no physics needed
            if (shipData.location.type === 'docked' || shipData.location.isDocked) return;

            const location = shipData.location;
            
            // If ship is orbit-locked, handle orbital mechanics (Task 7.9)
            if (location.type === 'orbit' && location.isOrbitLocked && location.orbitData) {
                const planet = celestialBodies.find(p => p && (p.name === location.planetName || p.index === location.orbitData.planetIndex));
                if (!planet) {
                    console.warn(`Planet ${location.planetName} not found for ship ${shipData.name} in orbit`);
                    return;
                }

                // Update orbital radius based on locked speed
                const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                const radiusRange = ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN;
                const speedFraction = (location.orbitData.lockedOrbitSpeed - MIN_ORBIT_SPEED) / speedRange;
                const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + (speedFraction * radiusRange);
                location.orbitData.orbitRadius = planet.radius * targetRadiusMultiplier;
                
                // Calculate orbital angular velocity
                const orbitalSpeed = location.orbitData.lockedOrbitSpeed / location.orbitData.orbitRadius;
                
                // Update orbital position (using direction: 1 = CCW, -1 = CW)
                location.orbitData.orbitAngle += orbitalSpeed * (location.orbitData.orbitDirection || 1) * (deltaTime || 0.016); // Scale by deltaTime
                
                // Calculate new position
                location.x = planet.x + Math.cos(location.orbitData.orbitAngle) * location.orbitData.orbitRadius;
                location.y = planet.y + Math.sin(location.orbitData.orbitAngle) * location.orbitData.orbitRadius;
                
                // Update angle (perpendicular to radius)
                location.angle = location.orbitData.orbitAngle + (Math.PI / 2) * (location.orbitData.orbitDirection || 1);
                
                // Update velocity to match orbital motion (for consistency)
                const tangentX = -Math.sin(location.orbitData.orbitAngle) * location.orbitData.lockedOrbitSpeed;
                const tangentY = Math.cos(location.orbitData.orbitAngle) * location.orbitData.lockedOrbitSpeed;
                location.velX = tangentX * (location.orbitData.orbitDirection || 1);
                location.velY = tangentY * (location.orbitData.orbitDirection || 1);

            } else if (location.type === 'space') {
                // Normal physics update for ships in space (not in orbit, not docked)
                location.x += location.velX * (deltaTime ? deltaTime / 0.016 : 1); // Scale by deltaTime
                location.y += location.velY * (deltaTime ? deltaTime / 0.016 : 1);

                // Check for automatic orbit entry (Task 7.9.2)
                for (const planet of celestialBodies) {
                    if (!planet) continue;
                    
                    const dx = planet.x - location.x;
                    const dy = planet.y - location.y;
                    const distance = Math.hypot(dx, dy);
                    const maxOrbitalRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX;

                    // Check if ship crosses orbital threshold at valid speed
                    if (distance <= maxOrbitalRadius && distance > planet.radius) {
                        const shipSpeed = Math.hypot(location.velX, location.velY);
                        
                        // Only start approach if speed is within valid range
                        if (shipSpeed >= MIN_ORBIT_SPEED && shipSpeed <= MAX_ORBIT_SPEED) {
                            // Calculate target orbital radius based on speed (linear interpolation)
                            const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                            const radiusRange = ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN;
                            const speedFraction = (shipSpeed - MIN_ORBIT_SPEED) / speedRange;
                            const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + (speedFraction * radiusRange);
                            const targetOrbitRadius = planet.radius * targetRadiusMultiplier;
                            
                            // Enter orbit state
                            location.type = 'orbit';
                            location.isOrbitLocked = true;
                            location.planetName = planet.name;
                            location.orbitData = {
                                planetIndex: planet.index,
                                orbitRadius: targetOrbitRadius,
                                orbitAngle: Math.atan2(location.y - planet.y, location.x - planet.x),
                                lockedOrbitSpeed: shipSpeed,
                                orbitDirection: 1 // Will be calculated on first orbit update if needed
                            };
                            
                            // Determine orbit direction using cross product
                            const radiusX = location.x - planet.x;
                            const radiusY = location.y - planet.y;
                            const crossProduct = (radiusX * location.velY) - (radiusY * location.velX);
                            location.orbitData.orbitDirection = crossProduct >= 0 ? 1 : -1; // 1 = CCW, -1 = CW
                            
                            console.log(`Ship ${shipData.name} entered orbit around ${planet.name} at radius ${targetOrbitRadius.toFixed(0)}, direction: ${location.orbitData.orbitDirection > 0 ? 'CCW' : 'CW'}`);
                            break; // Only approach one planet
                        }
                    }
                }

                // World boundary checks
                if (location.x < 0 || location.x > worldWidth || 
                    location.y < 0 || location.y > worldHeight) {
                    location.x = Math.max(0, Math.min(location.x, worldWidth));
                    location.y = Math.max(0, Math.min(location.y, worldHeight));
                    location.velX *= 0.5; // Dampen velocity at boundaries
                    location.velY *= 0.5;
                }
            }
        });
    }
};

