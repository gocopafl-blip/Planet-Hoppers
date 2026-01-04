// --- Space Scene ---
class SpaceScene {
    constructor() {
        // --- Scene State ---
        this.name = 'space'; // Give the scene a name for the MusicManager
        this.ship = null; // The active ship (player-controlled)
        this.fleetShips = []; // All other fleet ships in the scene (non-controlled)
        this.stars = [];
        this.particles = []; // For thruster effects
        this.spaceDocks = []; // Array to hold all space docks
        this.difficulty = 'easy';
        this.isPaused = false;
        this.camera = null;
        this.navScreen = new NavScreen(this);
        //this.orbitData = null;
        this.dockingRadius = 1000;

        // --- State Preservation ---
        this.savedState = null; // Stores scene state during scene transitions

        // --- World Settings ---
        this.WORLD_WIDTH = canvas.width * 200;
        this.WORLD_HEIGHT = canvas.height * 200;
        this.numPlanets = 18;

        // --- Camera Settings ---
        this.minZoom = 0.1; // minZoom is now used to configure the camera
        this.maxZoom = 2.5;
        //this.maxSpeedForZoom = 15; Used for dynamic zoom - currently disabled
        this.zoomSmoothing = 0.03;

        // Central place for all flight model speed definitions
        this.MIN_DOCKING_SPEED = 0.1;
        this.MAX_DOCKING_SPEED = 1.0;
        this.MAX_SAFE_STRUCTURAL_SPEED = 25.0;
        
        // Orbital ring visibility tracking (Task 7.7.3-7.7.4)
        this.orbitalRingLastThrustTime = 0;
        this.orbitalRingLastHighSpeedTime = 0; // Track when speed was last >= 80% for 10s fade
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 30000; i++) {
            this.stars.push({ x: Math.random() * this.WORLD_WIDTH, y: Math.random() * this.WORLD_HEIGHT, radius: Math.random() * 2.5 });
        }
    }


    createSpaceDock(type, image, x, y, width, height) {
        const dock = new SpaceDock(x, y, width, height, image, type);
        this.spaceDocks.push(dock);
        return dock;
    }
    start(settings) {
        console.log("Starting Space Scene...");
        
        // Task 8.1.7: Store reference to space scene in gameManager for world state access
        gameManager.spaceScene = this;
        
        document.getElementById('player-hud').style.display = 'block';
        this.difficulty = settings.difficulty;
        this.isPaused = false;
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';

        // Initialize game world if not already done
        if (!this.stars.length) {
            this.createStars();
            // Create the main space dock BEFORE creating planets
            this.createSpaceDock('alpha', dockTypes.alpha.img, this.WORLD_WIDTH / 2 - 1000, this.WORLD_HEIGHT / 2, 2400, 2000);
            // Now create planets - they will avoid the dock
            planetManager.generatePlanets(this.numPlanets, this.WORLD_WIDTH, this.WORLD_HEIGHT, this.spaceDocks);
        }

        // FIXED BUG: Fleet dispatch must take priority over saved state restoration
        // When coming from fleet manager, always load the newly selected ship
        if (settings.fromFleetManager && settings.dispatchMode) {
            // Clear any existing saved state to prevent wrong ship restoration
            this.savedState = null;
            this.handleFleetDispatch(settings.dispatchMode);
        } else if (!this.restoreState()) {
            // No saved state, create new ship and camera at starting position
            const alphaDock = this.spaceDocks[0];
            if (alphaDock) {
                // Use docked position constants for consistent starting position
                const startingShipData = fleetManager.getActiveShipData(); // Default ship if none selected
                this.ship = new Ship(
                    alphaDock.x + SHIP_DOCKED_OFFSET.x,
                    alphaDock.y + SHIP_DOCKED_OFFSET.y,
                    this,
                    startingShipData
                );
            } else {
                // Fallback position if no dock exists               
                const startingShipData = fleetManager.getActiveShipData(); // Add missing shipData               
                this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
            }
        }

        // Set up the camera - only if we have a ship and camera hasn't been set by fleet dispatch
        if (this.ship && !this.camera) {
            // Set up the camera to follow the ship
            const shipData = fleetManager.getActiveShipData();
            const defaultZoom = shipData.shipDefaultZoom || 1.0;

            this.camera = new Camera(this.ship, this.WORLD_WIDTH, this.WORLD_HEIGHT, {
                zoomSmoothing: this.zoomSmoothing,
                followSmoothing: 0.5,  // Instant camera following for tight ship centering
                defaultZoom: defaultZoom  // Pass ship's default zoom
            });
        } else if (this.camera && this.ship) {
            // State was restored, but make sure camera target is set correctly
            this.camera.target = this.ship;
        }

        // Always reset to ship's default zoom when entering space scene
        const shipData = fleetManager.getActiveShipData();
        if (shipData && this.camera) {
            const defaultZoom = shipData.shipDefaultZoom || 1.0;
            this.camera.defaultZoom = defaultZoom;
            this.camera.targetZoom = defaultZoom;
            this.camera.zoomLevel = defaultZoom;
        }

        // TASK 6.1: Load all fleet ships for visualization
        this.loadFleetShips();

        canvas.style.display = 'block';
        //zoomControls.style.display = 'flex';
    }

    stop() {
        if (thrusterSound.isLoaded) thrusterSound.pause();
        //zoomControls.style.display = 'none';
        document.getElementById('access-dock-ui').style.display = 'none';
        document.getElementById('launch-ui').style.display = 'none';
        document.getElementById('player-hud').style.display = 'none';
    }

    handleFleetDispatch(dispatchMode) {
        // ENHANCED: Full ship state restoration from fleet data with proper error handling (Task 3.7)
        const activeShip = playerDataManager.getActiveShip();
        if (!activeShip) {
            console.error('No active ship found for fleet dispatch');
            alert('Error: No active ship selected. Returning to fleet manager.');
            gameManager.switchScene(fleetManagerScene);
            return;
        }

        const startingShipData = fleetManager.getActiveShipData();
        if (!startingShipData) {
            console.error('No ship data found for active ship:', activeShip.shipTypeId);
            alert('Error: Ship configuration not found. Please check your ship setup.');
            gameManager.switchScene(fleetManagerScene);
            return;
        }

        if (dispatchMode === 'dispatch') {
            // ENHANCED: Ship is being dispatched from dock - place well outside dock like a proper launch (Task 3.6)
            // Dispatch positioning should simulate a ship launching from the dock, placed at a safe distance
            const alphaDock = this.spaceDocks[0];
            if (alphaDock) {
                // Use launch position constants for consistent and maintainable positioning
                this.ship = new Ship(
                    alphaDock.x + SHIP_LAUNCH_OFFSET.x,
                    alphaDock.y + SHIP_LAUNCH_OFFSET.y,
                    this,
                    startingShipData
                );
            } else {
                // Fallback to center if no dock found
                this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
            }

            // Mark ship as freshly launched - not docked, no orbital locks
            this.ship.isDocked = false;
            this.ship.isOrbitLocked = false;
            // Reset velocity for fresh launch (no momentum from previous movement)
            this.ship.velX = 0;
            this.ship.velY = 0;

            console.log('Ship dispatched from dock at launch position');

        } else if (dispatchMode === 'jump_to') {
            // ENHANCED: Jump to ship at its exact stored location - maintain complete state (Task 3.6)
            // Jump To positioning should restore the ship to its exact saved location with all state preserved
            const location = activeShip.location;

            if (location && location.type === 'space') {
                // Ship is in deep space - restore exact position, velocity, and orientation
                this.ship = new Ship(location.x, location.y, this, startingShipData);
                this.ship.velX = location.velX || 0;
                this.ship.velY = location.velY || 0;
                this.ship.angle = location.angle || 0;
                this.ship.isDocked = location.isDocked || false;
                this.ship.isOrbitLocked = location.isOrbitLocked || false;

                console.log(`Jumped to ship in deep space at (${location.x}, ${location.y}) with velocity (${this.ship.velX}, ${this.ship.velY})`);

            } else if (location && location.type === 'orbit') {
                // Ship is in orbit around a planet - restore complete orbital mechanics with error handling (Task 3.7)
                const planets = planetManager.celestialBodies;

                if (!planets || planets.length === 0) {
                    console.error('No celestial bodies found for orbital restoration');
                    // Fallback to safe space position
                    this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
                    console.warn('Planet system unavailable - placed ship in center space');
                } else {
                    const planet = planets.find(p => p.name === location.planetName);

                    if (planet && location.orbitData) {
                        // Validate orbit data before using it
                        let orbitRadius = location.orbitData.orbitRadius || (planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT);
                        const orbitAngle = location.orbitData.orbitAngle || 0;

                        // Validate that orbit radius is reasonable relative to planet size
                        const minRadius = Math.max(planet.radius * ORBIT_RADIUS_MULTIPLIERS.MIN, ORBIT_RADIUS_BOUNDS.ABSOLUTE_MIN);
                        const maxRadius = Math.min(planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX, ORBIT_RADIUS_BOUNDS.ABSOLUTE_MAX);

                        if (orbitRadius < minRadius || orbitRadius > maxRadius) {
                            console.warn(`Invalid orbit radius ${orbitRadius} for planet ${planet.name} (radius ${planet.radius}), using default ${planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT}`);
                            orbitRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT;
                        }

                        const x = planet.x + orbitRadius * Math.cos(orbitAngle);
                        const y = planet.y + orbitRadius * Math.sin(orbitAngle);

                        this.ship = new Ship(x, y, this, startingShipData);

                        // Restore complete orbital state exactly as it was saved
                        this.ship.isOrbitLocked = true;
                        this.ship.orbitingPlanet = planet;
                        this.ship.orbitRadius = orbitRadius;
                        this.ship.orbitAngle = orbitAngle;
                        this.ship.isDocked = false;

                        // FIXED: Simply restore the exact saved orbital speed
                        this.ship.lockedOrbitSpeed = location.orbitData.lockedOrbitSpeed || 0;
                        
                        // Restore orbit direction (CCW=1, CW=-1)
                        this.ship.orbitDirection = location.orbitData.orbitDirection || 1;

                        // Set orbit transition as complete (ship is already in stable orbit)
                        this.ship.orbitTransitionProgress = 1; // 100% - no transition needed

                        // Restore exact velocity and orientation from saved state
                        this.ship.velX = location.velX || 0;
                        this.ship.velY = location.velY || 0;
                        this.ship.angle = location.angle || 0;

                        console.log(`Jumped to ship orbiting ${planet.name} at radius ${orbitRadius}, angle ${orbitAngle}, speed ${this.ship.lockedOrbitSpeed.toFixed(2)}`);
                    } else if (!planet) {
                        // Planet not found - this could happen if planet system changed
                        console.error(`Planet "${location.planetName}" not found for orbital restoration`);
                        // Fallback to safe space position
                        this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
                        console.warn('Planet not found - placed ship in center space');
                    } else {
                        // Missing orbit data
                        console.error('Missing orbit data for ship orbital restoration');
                        // Place near the planet if possible using default orbital distance
                        if (planet) {
                            const defaultOrbitRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT;
                            this.ship = new Ship(planet.x + defaultOrbitRadius, planet.y, this, startingShipData);
                            console.warn(`Missing orbit data - placed ship at default orbital distance (${defaultOrbitRadius}) from planet`);
                        } else {
                            this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
                        }
                    }
                }

            } else if (location && location.type === 'docked') {
                // Ship is docked at station - place at dock position with proper docked state
                // For docked ships, use standard dock position (not launch position)
                const alphaDock = this.spaceDocks[0];
                if (alphaDock) {
                    // Use docked position constants for consistent positioning
                    this.ship = new Ship(
                        alphaDock.x + SHIP_DOCKED_OFFSET.x,
                        alphaDock.y + SHIP_DOCKED_OFFSET.y,
                        this,
                        startingShipData
                    );
                } else {
                    this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
                }

                // Set proper docked state - no movement when docked
                this.ship.isDocked = true;
                this.ship.isOrbitLocked = false;
                this.ship.velX = 0;  // No velocity when docked to station
                this.ship.velY = 0;  // No velocity when docked to station

                console.log('Jumped to docked ship at station');

            } else {
                // No valid location data - safe fallback positioning
                // Use dock proximity as safe default (not launch distance)
                const alphaDock = this.spaceDocks[0];
                if (alphaDock) {
                    // Use docked position constants for safe fallback
                    this.ship = new Ship(
                        alphaDock.x + SHIP_DOCKED_OFFSET.x,
                        alphaDock.y + SHIP_DOCKED_OFFSET.y,
                        this,
                        startingShipData
                    );
                } else {
                    this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this, startingShipData);
                }
                console.log('No valid location data - placed ship at default dock proximity');
            }
        }

        // ENHANCED: Restore complete ship state from fleet data
        this.restoreShipConsumablesAndHealth(activeShip);

        // Set up camera with ship-specific zoom level
        const shipData = fleetManager.getActiveShipData();
        const defaultZoom = shipData.shipDefaultZoom || 1.0;
        this.camera = new Camera(this.ship, this.WORLD_WIDTH, this.WORLD_HEIGHT, {
            zoomSmoothing: this.zoomSmoothing,
            targetZoom: defaultZoom,
            defaultZoom: defaultZoom  // Add this line
        });

        // Clear the dispatch mode
        gameManager.fleetDispatchMode = null;

        // BUG FIX 6.1.1: Immediately save the ship's position after dispatch/jump to
        // This ensures that if the page is refreshed right after dispatch, the ship's 
        // actual position (not the placeholder 0,0) is persisted to localStorage
        fleetManager.saveCurrentShipState(activeShip, this);
        playerDataManager.saveData();
        console.log('Ship position saved immediately after dispatch to prevent (0,0) reset on refresh');

        console.log('Fleet dispatch complete - ship positioned and state fully restored via', dispatchMode, 'mode');
    }

    // NEW METHOD: Restore ship consumables and health from fleet data (Task 3.5)
    restoreShipConsumablesAndHealth(activeShip) {
        // This method restores the ship's consumables and health from the saved fleet data
        // It ensures the ship in the space scene matches the saved fleet state exactly

        if (!this.ship || !activeShip) {
            console.warn('Cannot restore ship state - missing ship or active ship data');
            return;
        }

        // Restore health from fleet data
        if (activeShip.currentHealth !== undefined) {
            this.ship.health = activeShip.currentHealth;
            console.log(`Restored ship health: ${activeShip.currentHealth}/${activeShip.maxHealth}`);
        }

        // Restore fuel from fleet data
        if (activeShip.consumables?.fuel?.current !== undefined) {
            this.ship.fuel = activeShip.consumables.fuel.current;
            console.log(`Restored ship fuel: ${activeShip.consumables.fuel.current}/${activeShip.consumables.fuel.max}`);
        }

        // Restore oxygen if space scene tracks it
        if (activeShip.consumables?.oxygen?.current !== undefined && this.ship.oxygen !== undefined) {
            this.ship.oxygen = activeShip.consumables.oxygen.current;
            console.log(`Restored ship oxygen: ${activeShip.consumables.oxygen.current}/${activeShip.consumables.oxygen.max}`);
        }

        // Restore electricity if space scene tracks it
        if (activeShip.consumables?.electricity?.current !== undefined && this.ship.electricity !== undefined) {
            this.ship.electricity = activeShip.consumables.electricity.current;
            console.log(`Restored ship electricity: ${activeShip.consumables.electricity.current}/${activeShip.consumables.electricity.max}`);
        }

        // ENHANCED: Restore navigation waypoints specific to this ship (Issue #2 fix)
        if (activeShip.navigation && this.navScreen) {
            // Restore intermediate waypoints
            if (activeShip.navigation.waypoints && Array.isArray(activeShip.navigation.waypoints)) {
                this.navScreen.waypoints = [...activeShip.navigation.waypoints];
                console.log(`Restored ${activeShip.navigation.waypoints.length} navigation waypoints for ship`);
            }

            // Restore final destination waypoint
            if (activeShip.navigation.finalWaypoint) {
                this.navScreen.finalWaypoint = { ...activeShip.navigation.finalWaypoint };
                console.log(`Restored final waypoint: ${activeShip.navigation.finalWaypoint.name || 'Unknown'}`);
            }

            // Clear waypoints if ship had none saved
            if (!activeShip.navigation.waypoints || activeShip.navigation.waypoints.length === 0) {
                this.navScreen.waypoints = [];
            }
            if (!activeShip.navigation.finalWaypoint) {
                this.navScreen.finalWaypoint = null;
            }
        } else {
            // Clear navigation for ships without saved nav data
            if (this.navScreen) {
                this.navScreen.waypoints = [];
                this.navScreen.finalWaypoint = null;
            }
        }

        console.log('Ship consumables, health, and navigation restoration complete');
    }

    // NEW METHOD: Load all fleet ships into the scene for visualization (Task 6.1)
    loadFleetShips() {
        // Clear existing fleet ships array
        this.fleetShips = [];

        // Get all ships from player's fleet
        const fleet = playerDataManager.getFleet();
        const activeShipId = playerDataManager.data.activeShipId;

        if (!fleet || fleet.length === 0) {
            console.log('No fleet ships to load');
            return;
        }

        console.log(`Loading ${fleet.length} fleet ships for visualization...`);

        // Load each ship except the active one (active ship is already this.ship)
        fleet.forEach(shipData => {
            // Skip the active ship - it's already controlled as this.ship
            if (shipData.id === activeShipId) {
                console.log(`Skipping active ship: ${shipData.name} (ID: ${shipData.id})`);
                return;
            }

            // Get ship catalogue data
            const catalogueData = shipCatalogue[shipData.shipTypeId];
            if (!catalogueData) {
                console.warn(`No catalogue data for ship type: ${shipData.shipTypeId}`);
                return;
            }

            // Determine ship position based on its saved location
            let shipX, shipY;
            let ship = null;

            if (shipData.location) {
                switch (shipData.location.type) {
                    case 'space':
                        // Ship is in deep space - use exact coordinates
                        shipX = shipData.location.x;
                        shipY = shipData.location.y;
                        ship = new Ship(shipX, shipY, this, catalogueData);
                        ship.velX = shipData.location.velX || 0;
                        ship.velY = shipData.location.velY || 0;
                        ship.angle = shipData.location.angle || -Math.PI / 2;
                        console.log(`Loaded ${shipData.name} in deep space at (${shipX}, ${shipY})`);
                        break;

                    case 'orbit':
                        // Ship is in orbit around a planet
                        const planet = celestialBodies.find(p => p.name === shipData.location.planetName);
                        if (planet && shipData.location.orbitData) {
                            const orbitRadius = shipData.location.orbitData.orbitRadius || (planet.radius * 1.5);
                            const orbitAngle = shipData.location.orbitData.orbitAngle || 0;
                            shipX = planet.x + Math.cos(orbitAngle) * orbitRadius;
                            shipY = planet.y + Math.sin(orbitAngle) * orbitRadius;
                            
                            ship = new Ship(shipX, shipY, this, catalogueData);
                            ship.isOrbitLocked = true;
                            ship.orbitingPlanet = planet;
                            ship.orbitRadius = orbitRadius;
                            ship.orbitAngle = orbitAngle;
                            ship.lockedOrbitSpeed = shipData.location.orbitData.lockedOrbitSpeed || 0;
                            ship.orbitDirection = shipData.location.orbitData.orbitDirection || 1; // Restore orbit direction
                            ship.orbitTransitionProgress = 1; // Already in orbit
                            console.log(`Loaded ${shipData.name} orbiting ${planet.name}`);
                        } else {
                            console.warn(`Could not find planet ${shipData.location.planetName} for ship ${shipData.name}`);
                            return; // Skip this ship
                        }
                        break;

                    case 'docked':
                        // Ship is docked at station - don't render it in space
                        console.log(`Skipping docked ship: ${shipData.name}`);
                        return;

                    default:
                        console.warn(`Unknown location type ${shipData.location.type} for ship ${shipData.name}`);
                        return;
                }
            } else {
                // No location data - skip this ship
                console.warn(`No location data for ship ${shipData.name} - skipping`);
                return;
            }

            if (ship) {
                // Store reference to the fleet data for this ship
                ship.fleetData = shipData;
                ship.isFleetShip = true; // Mark as non-controllable fleet ship
                
                // Add to fleet ships array
                this.fleetShips.push(ship);
                console.log(`Successfully loaded fleet ship: ${shipData.name} (ID: ${shipData.id})`);
            }
        });

        console.log(`Loaded ${this.fleetShips.length} fleet ships for visualization`);
    }

    // NEW METHOD: Update all fleet ships with physics (Task 6.1)
    updateFleetShips() {
        // Task 8.1.6: Update each fleet ship - they obey physics but don't respond to player controls
        // NOTE: Background simulator also updates fleet data, but when space scene is active,
        // the space scene's Ship instances are authoritative for rendering. The space scene
        // saves ship state back to fleet data when leaving (via saveFleetShipsToStorage).
        this.fleetShips.forEach(fleetShip => {
            if (!fleetShip) return;

            // If ship is orbit-locked, handle orbital mechanics (Task 7.9)
            if (fleetShip.isOrbitLocked && fleetShip.orbitingPlanet) {
                const planet = fleetShip.orbitingPlanet;
                
                // Update orbital radius based on locked speed (same as player ship)
                const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                const radiusRange = ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN;
                const speedFraction = (fleetShip.lockedOrbitSpeed - MIN_ORBIT_SPEED) / speedRange;
                const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + (speedFraction * radiusRange);
                fleetShip.orbitRadius = planet.radius * targetRadiusMultiplier;
                
                // Calculate orbital angular velocity
                const orbitalSpeed = fleetShip.lockedOrbitSpeed / fleetShip.orbitRadius;
                
                // Update orbital position (using direction: 1 = CCW, -1 = CW)
                fleetShip.orbitAngle += orbitalSpeed * (fleetShip.orbitDirection || 1);
                const targetX = planet.x + Math.cos(fleetShip.orbitAngle) * fleetShip.orbitRadius;
                const targetY = planet.y + Math.sin(fleetShip.orbitAngle) * fleetShip.orbitRadius;
                // Target angle perpendicular to radius, direction-dependent
                // CCW (dir=1): +90°, CW (dir=-1): -90°
                const targetAngle = fleetShip.orbitAngle + (Math.PI / 2) * (fleetShip.orbitDirection || 1);
                
                // Smooth transition from approach angle to orbital angle (like player ship)
                if (fleetShip.orbitTransitionProgress < 1) {
                    fleetShip.orbitTransitionProgress += 0.01; // Same rate as player ship
                    fleetShip.orbitTransitionProgress = Math.min(fleetShip.orbitTransitionProgress, 1);
                    
                    // Smoothly interpolate the ship's angle
                    const angleDiff = targetAngle - fleetShip.initialApproachAngle;
                    // Handle angle wrapping (shortest path between angles)
                    let adjustedAngleDiff = angleDiff;
                    if (angleDiff > Math.PI) adjustedAngleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) adjustedAngleDiff += 2 * Math.PI;
                    
                    fleetShip.angle = fleetShip.initialApproachAngle + (adjustedAngleDiff * fleetShip.orbitTransitionProgress);
                    
                    // Position follows orbital path immediately
                    fleetShip.x = targetX;
                    fleetShip.y = targetY;
                } else {
                    // Full orbital motion once transition is complete
                    fleetShip.x = targetX;
                    fleetShip.y = targetY;
                    fleetShip.angle = targetAngle;
                }
            } else if (fleetShip.isApproachingOrbit) {
                // Ship is approaching orbit - continue straight line with locked velocity
                fleetShip.x += fleetShip.approachVelX;
                fleetShip.y += fleetShip.approachVelY;
                
                // Check proximity to target orbit for the orbiting planet
                const planet = fleetShip.orbitingPlanet;
                if (planet) {
                    const dx = planet.x - fleetShip.x;
                    const dy = planet.y - fleetShip.y;
                    const distance = Math.hypot(dx, dy);
                    const proximityThreshold = planet.radius * 0.05; // 5% of planet radius tolerance
                    const distanceToTargetOrbit = Math.abs(distance - fleetShip.targetOrbitRadius);
                    
                    if (distanceToTargetOrbit <= proximityThreshold) {
                        // Ship has arrived at target orbit - lock into orbit
                        fleetShip.isApproachingOrbit = false;
                        fleetShip.isOrbitLocked = true;
                        fleetShip.orbitRadius = fleetShip.targetOrbitRadius;
                        fleetShip.orbitTransitionProgress = 0; // Start angle transition at 0%
                        fleetShip.initialApproachAngle = fleetShip.angle; // Store current ship angle
                        
                        // Determine orbit direction using cross product of radius and velocity vectors
                        const radiusX = fleetShip.x - planet.x;
                        const radiusY = fleetShip.y - planet.y;
                        const crossProduct = (radiusX * fleetShip.approachVelY) - (radiusY * fleetShip.approachVelX);
                        fleetShip.orbitDirection = crossProduct >= 0 ? 1 : -1; // 1 = CCW, -1 = CW
                        
                        console.log(`Fleet ship locked into orbit around ${planet.name} at radius ${fleetShip.orbitRadius.toFixed(0)}, direction: ${fleetShip.orbitDirection > 0 ? 'CCW' : 'CW'}`);
                    }
                }
            } else {
                // Normal physics update for ships in space (not in orbit, not approaching)
                fleetShip.x += fleetShip.velX;
                fleetShip.y += fleetShip.velY;

                // Check for automatic orbit entry (Task 7.9.2)
                for (const planet of celestialBodies) {
                    const dx = planet.x - fleetShip.x;
                    const dy = planet.y - fleetShip.y;
                    const distance = Math.hypot(dx, dy);
                    const maxOrbitalRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX;

                    // Check if ship crosses orbital threshold at valid speed
                    if (!fleetShip.isOrbitLocked && !fleetShip.isApproachingOrbit && distance <= maxOrbitalRadius && distance > planet.radius) {
                        const shipSpeed = Math.hypot(fleetShip.velX, fleetShip.velY);
                        
                        // Only start approach if speed is within valid range
                        if (shipSpeed >= MIN_ORBIT_SPEED && shipSpeed <= MAX_ORBIT_SPEED) {
                            // Calculate target orbital radius based on speed (linear interpolation)
                            const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                            const radiusRange = ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN;
                            const speedFraction = (shipSpeed - MIN_ORBIT_SPEED) / speedRange;
                            const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + (speedFraction * radiusRange);
                            const targetOrbitRadius = planet.radius * targetRadiusMultiplier;
                            
                            // Enter "approaching orbit" state - lock speed but let ship continue straight
                            fleetShip.isApproachingOrbit = true;
                            fleetShip.orbitingPlanet = planet;
                            fleetShip.targetOrbitRadius = targetOrbitRadius;
                            fleetShip.lockedOrbitSpeed = shipSpeed;
                            // Calculate angle from planet center to ship (not ship to planet!)
                            fleetShip.orbitAngle = Math.atan2(fleetShip.y - planet.y, fleetShip.x - planet.x);
                            
                            // Lock velocity - ship can't change during approach
                            fleetShip.approachVelX = fleetShip.velX;
                            fleetShip.approachVelY = fleetShip.velY;
                            
                            console.log(`Fleet ship approaching orbit around ${planet.name} at speed ${shipSpeed.toFixed(2)}`);
                            break; // Only approach one planet
                        }
                    }
                }

                // World boundary checks
                if (fleetShip.x < 0 || fleetShip.x > this.WORLD_WIDTH || 
                    fleetShip.y < 0 || fleetShip.y > this.WORLD_HEIGHT) {
                    fleetShip.x = Math.max(0, Math.min(fleetShip.x, this.WORLD_WIDTH));
                    fleetShip.y = Math.max(0, Math.min(fleetShip.y, this.WORLD_HEIGHT));
                    fleetShip.velX *= 0.5; // Dampen velocity at boundaries
                    fleetShip.velY *= 0.5;
                }
            }
        });
    }

    // NEW METHOD: Save fleet ship positions from RAM to localStorage (Task 6.1.2)
    saveFleetShipsToStorage() {
        if (!this.fleetShips || this.fleetShips.length === 0) {
            console.log('No fleet ships to save');
            return;
        }

        console.log(`Saving ${this.fleetShips.length} fleet ship positions from RAM to storage...`);

        this.fleetShips.forEach(fleetShip => {
            if (!fleetShip || !fleetShip.fleetData) {
                console.warn('Fleet ship missing data, skipping save');
                return;
            }

            // Build location object from current RAM state
            const updatedLocation = {
                type: 'space',  // Default, will be overridden below
                x: fleetShip.x,
                y: fleetShip.y,
                velX: fleetShip.velX || 0,
                velY: fleetShip.velY || 0,
                angle: fleetShip.angle || 0,
                isDocked: false,
                isOrbitLocked: false,
                planetName: null,
                orbitData: null
            };

            // If ship is in orbit, save orbital data
            if (fleetShip.isOrbitLocked && fleetShip.orbitingPlanet) {
                updatedLocation.type = 'orbit';
                updatedLocation.isOrbitLocked = true;
                updatedLocation.planetName = fleetShip.orbitingPlanet.name;
                updatedLocation.orbitData = {
                    planetIndex: fleetShip.orbitingPlanet.index,
                    orbitRadius: fleetShip.orbitRadius,
                    orbitAngle: fleetShip.orbitAngle,
                    lockedOrbitSpeed: fleetShip.lockedOrbitSpeed || 0,
                    orbitDirection: fleetShip.orbitDirection || 1
                };
            }

            // Update the ship's location in playerDataManager (RAM)
            playerDataManager.updateShipLocation(fleetShip.fleetData.id, updatedLocation);
            
            console.log(`  Saved ${fleetShip.fleetData.name}: (${Math.round(fleetShip.x)}, ${Math.round(fleetShip.y)})`);
        });

        // Persist RAM to localStorage
        playerDataManager.saveData();
        console.log('Fleet ships saved to localStorage');
    }

    update() {
        if (!this.ship || this.isPaused) return;
        
        // TASK 6.1 & 7.9: Update all fleet ships FIRST (before active ship logic)
        // This ensures fleet ships continue moving even when active ship is in orbit
        this.updateFleetShips();
        
        // --- ORBIT LOCK LOGIC ---
        if (this.ship.isOrbitLocked && this.ship.orbitingPlanet) {
            const ship = this.ship;
            const planet = this.ship.orbitingPlanet;

            // Orbit can only be exited by accelerating to MAX_ORBIT_SPEED (Task 7.8)
            // Strafing, rotation, and other controls are disabled while in orbit
            
            // --- IN-ORBIT MECHANICS (Task 7.6) ---
                
                // Handle thrust controls to change orbital speed/radius
                const shipOrbitThrustPower = ship.shipOrbitThrustPower || 0.015;
                
                // Track thrust time for orbital ring visibility (Task 7.7.3)
                if (ship.thrusting || ship.reversing) {
                    this.orbitalRingLastThrustTime = Date.now();
                    
                    // Also track high speed time if currently at 80%+ (Task 7.8)
                    const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                    const speedAboveMin = ship.lockedOrbitSpeed - MIN_ORBIT_SPEED;
                    const speedFraction = speedAboveMin / speedRange;
                    const highSpeedThreshold = 0.8; // 80% of max speed
                    
                    if (speedFraction >= highSpeedThreshold) {
                        this.orbitalRingLastHighSpeedTime = Date.now();
                    }
                }
                
                if (ship.thrusting) {
                    // Forward thrust increases orbital speed (and radius)
                    ship.lockedOrbitSpeed += shipOrbitThrustPower;
                    // Cap at MAX_ORBIT_SPEED
                    if (ship.lockedOrbitSpeed > MAX_ORBIT_SPEED) {
                        ship.lockedOrbitSpeed = MAX_ORBIT_SPEED;
                    }
                }
                
                if (ship.reversing) {
                    // Reverse thrust decreases orbital speed (and radius)
                    ship.lockedOrbitSpeed -= shipOrbitThrustPower;
                    // Prevent dropping below MIN_ORBIT_SPEED
                    if (ship.lockedOrbitSpeed < MIN_ORBIT_SPEED) {
                        ship.lockedOrbitSpeed = MIN_ORBIT_SPEED;
                    }
                }
                
                // --- ORBIT EXIT CHECK (Task 7.8.5-7.8.7) ---
                // When speed reaches MAX_ORBIT_SPEED, break orbit and restore full control
                if (ship.lockedOrbitSpeed >= MAX_ORBIT_SPEED) {
                    // Calculate tangential exit velocity (perpendicular to radius)
                    const tangentAngle = ship.orbitAngle + Math.PI / 2;
                    ship.velX = MAX_ORBIT_SPEED * Math.cos(tangentAngle);
                    ship.velY = MAX_ORBIT_SPEED * Math.sin(tangentAngle);
                    
                    // Break orbit lock and restore full player control
                    ship.isOrbitLocked = false;
                    ship.orbitingPlanet = null;
                    this.camera.targetZoom = ship.shipDefaultZoom || 1.0;
                    
                    // Continue with normal physics (don't return, let update() run)
                } else {
                    // Update orbital radius based on current speed (linear interpolation)
                    // MIN_ORBIT_SPEED maps to MIN radius, MAX_ORBIT_SPEED maps to MAX radius
                    const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
                    const radiusRange = ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN;
                    const speedFraction = (ship.lockedOrbitSpeed - MIN_ORBIT_SPEED) / speedRange;
                    const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + (speedFraction * radiusRange);
                    ship.orbitRadius = planet.radius * targetRadiusMultiplier;
                    
                    // Calculate orbital angular velocity
                    const orbitalSpeed = ship.lockedOrbitSpeed / ship.orbitRadius;

                    // Update orbital position (using direction: 1 = CCW, -1 = CW)
                    ship.orbitAngle += orbitalSpeed * (ship.orbitDirection || 1);
                    const targetX = planet.x + Math.cos(ship.orbitAngle) * ship.orbitRadius;
                    const targetY = planet.y + Math.sin(ship.orbitAngle) * ship.orbitRadius;
                    // Target angle perpendicular to radius, direction-dependent
                    // CCW (dir=1): +90°, CW (dir=-1): -90°
                    const targetAngle = ship.orbitAngle + (Math.PI / 2) * (ship.orbitDirection || 1);

                    // Smooth transition from approach angle to orbital angle
                    if (ship.orbitTransitionProgress < 1) {
                        ship.orbitTransitionProgress += 0.01; // Adjust this for faster/slower transition
                        ship.orbitTransitionProgress = Math.min(ship.orbitTransitionProgress, 1); // Cap at 100%

                        // Smoothly interpolate the ship's angle
                        const angleDiff = targetAngle - ship.initialApproachAngle;
                        // Handle angle wrapping (shortest path between angles)
                        let adjustedAngleDiff = angleDiff;
                        if (angleDiff > Math.PI) adjustedAngleDiff -= 2 * Math.PI;
                        if (angleDiff < -Math.PI) adjustedAngleDiff += 2 * Math.PI;

                        ship.angle = ship.initialApproachAngle + (adjustedAngleDiff * ship.orbitTransitionProgress);

                        // Position follows orbital path immediately
                        ship.x = targetX;
                        ship.y = targetY;
                    } else {
                        // Full orbital motion once transition is complete
                        // Rotation is automatically maintained by targetAngle (perpendicular to planet surface)
                        ship.x = targetX;
                        ship.y = targetY;
                        ship.angle = targetAngle;
                    }

                    this.camera.update();

                    return;
                }
        }
        
        // --- APPROACHING ORBIT LOGIC (Task 7.9.4) ---
        // Ship is coasting in straight line toward target orbit radius, controls disabled
        if (this.ship.isApproachingOrbit) {
            // Manually update ship position with locked velocity
            this.ship.x += this.ship.approachVelX;
            this.ship.y += this.ship.approachVelY;
            
            // Continue to orbit proximity check in the celestial bodies loop below
            // (don't return early - let the proximity check run)
        }
        
        // --- UNDOCKING LOGIC ---
        const wantsToMove = this.ship.thrusting || this.ship.reversing || this.ship.strafingLeft || this.ship.strafingRight;
        if (this.ship.isDocked && wantsToMove) {
            this.ship.isDocked = false;
        }

        this.ship.update();
        // --- DOCKING LOGIC ---    
        const dock = this.spaceDocks[0];
        if (dock) {
            const distance = Math.hypot(this.ship.x - dock.x, this.ship.y - dock.y);
            const speed = Math.hypot(this.ship.velX, this.ship.velY);

            // Check if ship should dock
            if (!wantsToMove && distance < this.dockingRadius && speed < this.MAX_DOCKING_SPEED && speed > this.MIN_DOCKING_SPEED) {
                const wasDockedBefore = this.ship.isDocked;
                this.ship.isDocked = true;

                this.ship.velX = 0; // Reduce residual velocity
                this.ship.velY = 0; // Reduce residual velocity

                // ENHANCED: Auto-return to fleet manager on docking (Task 4.7)
                if (!wasDockedBefore && this.ship.isDocked) {
                    // Ship just docked (wasn't docked before, now is docked)
                    console.log('Ship docked - initiating auto-return to fleet manager');

                    // Check for mission completion immediately after docking
                    missionManager.completeMission(this);

                    // Play airlock sound
                    if (!airlockSoundPlayed) {
                        airlockSound.play();
                        airlockSoundPlayed = true;
                    }

                    // Save current ship state before switching scenes (Task 4.7)
                    this.saveState();
                    fleetManager.saveCurrentShipState(playerDataManager.getActiveShip(), this);

                    // TASK 6.1.2: Save all fleet ship positions before leaving space scene
                    this.saveFleetShipsToStorage();

                    // FIXED: Clear active ship immediately and switch scene without delay
                    // This prevents the update loop from running with null active ship
                    playerDataManager.setActiveShip(null);
                    console.log('Active ship cleared - ship is now docked and available for reassignment');

                    console.log('Returning to fleet manager after docking');
                    gameManager.switchScene(fleetManagerScene, { fromSpaceScene: true, dockedReturn: true });
                } else if (this.ship.isDocked) {
                    // Ship was already docked, just maintain sound state
                    if (!airlockSoundPlayed) {
                        airlockSound.play();
                        airlockSoundPlayed = true;
                    }
                }
            }

            // Reset the sound flag when not docked (moved outside the docking condition)
            if (!this.ship.isDocked) {
                airlockSoundPlayed = false;
            }
        }

        // --- 4. FINALLY, HANDLE VISUALS AND OTHER PHYSICS ---
        this.ship.emitThrusterParticles();
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifespan > 0;
        });

        // Fleet ships already updated at start of update() method

        this.camera.update();
        this.navScreen.update();

        /*    if (this.ship.isDocked) {
                 this.orbitData = null;
                 return;
            }
            
            // Only clear orbital data if we're not in a locked orbit and not thrusting
            if (!this.ship.isOrbitLocked && !this.ship.thrusting) {
                this.orbitData = null;
            }
        */
        // --- TASK 7.0: Simplified Orbital Mechanics Logic ---
        // No gravity wells - ships fly in straight lines until they enter orbital zone
        for (const planet of celestialBodies) {
            // If we are locked in an orbit, ignore all other planets.
            if (this.ship.isOrbitLocked && this.ship.orbitingPlanet !== planet) {
                continue;
            }
            
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);

            // TASK 7.5: Check for automatic orbit entry at MAX orbital radius threshold
            const maxOrbitalRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX;
            
            // Only check for orbit entry if ship is not already in orbit or approaching orbit
            if (!this.ship.isOrbitLocked && !this.ship.isApproachingOrbit && distance <= maxOrbitalRadius && distance > planet.radius) {
                const shipSpeed = Math.hypot(this.ship.velX, this.ship.velY);
                
                // Check if ship speed is within valid orbit range
                if (shipSpeed >= MIN_ORBIT_SPEED && shipSpeed <= MAX_ORBIT_SPEED) {
                    // Calculate target orbital radius via linear interpolation
                    // Speed maps linearly: MIN_ORBIT_SPEED → MIN radius, MAX_ORBIT_SPEED → MAX radius
                    const speedRatio = (shipSpeed - MIN_ORBIT_SPEED) / (MAX_ORBIT_SPEED - MIN_ORBIT_SPEED);
                    const targetRadiusMultiplier = ORBIT_RADIUS_MULTIPLIERS.MIN + 
                        (speedRatio * (ORBIT_RADIUS_MULTIPLIERS.MAX - ORBIT_RADIUS_MULTIPLIERS.MIN));
                    const targetOrbitRadius = planet.radius * targetRadiusMultiplier;
                    
                    // Enter "approaching orbit" state - lock speed but let ship continue straight
                    this.ship.isApproachingOrbit = true;
                    this.ship.orbitingPlanet = planet;
                    this.ship.targetOrbitRadius = targetOrbitRadius;
                    this.ship.lockedOrbitSpeed = shipSpeed;
                    this.ship.orbitAngle = Math.atan2(dy, dx) + Math.PI;
                    
                    // Lock velocity - ship can't thrust during approach
                    this.ship.approachVelX = this.ship.velX;
                    this.ship.approachVelY = this.ship.velY;
                    
                    console.log(`Approaching orbit! Speed: ${shipSpeed.toFixed(2)}, Target Radius: ${targetOrbitRadius.toFixed(0)}`);
                }
                // If speed is outside valid range, ship continues toward planet (will crash when collisions enabled)
            }
            
            // Handle ship approaching orbit - continue straight line until near target radius
            if (this.ship.isApproachingOrbit && this.ship.orbitingPlanet === planet) {
                // Ship continues moving in straight line with locked velocity
                this.ship.velX = this.ship.approachVelX;
                this.ship.velY = this.ship.approachVelY;
                
                // Check if ship is close enough to target orbit radius to lock in
                const proximityThreshold = planet.radius * 0.05; // 5% of planet radius tolerance
                const distanceToTargetOrbit = Math.abs(distance - this.ship.targetOrbitRadius);
                
                if (distanceToTargetOrbit <= proximityThreshold) {
                    // Ship has arrived at target orbit - lock into orbit
                    this.ship.isApproachingOrbit = false;
                    this.ship.isOrbitLocked = true;
                    this.ship.orbitRadius = this.ship.targetOrbitRadius;
                    this.ship.orbitTransitionProgress = 0; // Start angle transition at 0%
                    this.ship.initialApproachAngle = this.ship.angle; // Store current ship angle
                    this.camera.targetZoom = 0.5; // Set target zoom for orbit view
                    
                    // Determine orbit direction using cross product of radius and velocity vectors
                    // Cross product z-component: (r.x * v.y) - (r.y * v.x)
                    // Positive = counter-clockwise, Negative = clockwise
                    const radiusX = this.ship.x - planet.x;
                    const radiusY = this.ship.y - planet.y;
                    const crossProduct = (radiusX * this.ship.approachVelY) - (radiusY * this.ship.approachVelX);
                    this.ship.orbitDirection = crossProduct >= 0 ? 1 : -1; // 1 = CCW, -1 = CW
                    
                    console.log(`Orbit locked at radius ${this.ship.orbitRadius.toFixed(0)}! Direction: ${this.ship.orbitDirection > 0 ? 'CCW' : 'CW'}`);
                }
            }

            // Collision check (functionality disabled - will be implemented later)
            if (distance < planet.radius) {
                // TODO: Implement collision/crash system
            }
        }
        // --- Waypoint Arrival Logic ---
        const nextWaypoint = this.navScreen.waypoints[0] || this.navScreen.finalWaypoint;
        if (nextWaypoint) {
            const arrivalRadius = (nextWaypoint.radius || 0) + 500; // Define how close we need to be
            const distanceToWaypoint = Math.hypot(this.ship.x - nextWaypoint.x, this.ship.y - nextWaypoint.y);

            if (distanceToWaypoint < arrivalRadius) {
                this.navScreen.arriveAtNextWaypoint();
            }
        }
        // --- Dynamic Zoom Logic ---
        //const speed = Math.hypot(this.ship.velX, this.ship.velY);
        //const speedRatio = Math.min(speed / this.maxSpeedForZoom, 1); 
        //this.camera.targetZoom = this.maxZoom - (this.maxZoom - this.minZoom) * speedRatio;
        //missionManager.completeMission(this); // ADD THIS LINE
    }


    draw() {
        if (!this.ship || this.isPaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.camera.begin(ctx);

        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });


        // Draw planets over the trajectory lines
        celestialBodies.forEach(p => {
            ctx.drawImage(p.image, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        });

        // Draw orbital path ring if ship is in orbit (Task 7.7)
        this.drawOrbitalPathRing(ctx);
        
        // Draw orbit departure warning line (Task 7.8.3-7.8.4)
        this.drawOrbitDepartureLine(ctx);

        for (const dock of this.spaceDocks) {
            dock.draw(ctx);
        }

        // TASK 6.1: Draw all fleet ships first (behind active ship)
        this.fleetShips.forEach(fleetShip => {
            if (fleetShip && fleetShip.draw) {
                fleetShip.draw();
            }
        });

        // Draw active ship on top
        this.ship.draw();
        this.particles.forEach(p => p.draw(ctx));
        this.camera.end(ctx);
        this.drawSpeedometer.call(this);
        this.drawCompass.call(this);
        this.drawRadar.call(this);
        this.drawHud.call(this);
        this.drawDebugInfo.call(this);
        this.navScreen.draw(ctx);
        this.updateHUD();

        // Show or hide the "Access Dock" UI based on docking status
        const accessDockUI = document.getElementById('access-dock-ui');
        if (this.ship.isDocked) {
            accessDockUI.style.display = 'block';
        } else {
            accessDockUI.style.display = 'none';
        }

        // Launch Drop Ship Button visibility based on stable orbit
        const launchUI = document.getElementById('launch-ui');
        if (this.ship.isOrbitLocked) {
            launchUI.style.display = 'block';
        } else {
            launchUI.style.display = 'none';
        }
    }
    drawSpeedometer() {
        if (!this.ship) return;

        // Use lockedOrbitSpeed when in orbit, otherwise calculate from velocity
        const speed = this.ship.isOrbitLocked ? this.ship.lockedOrbitSpeed : Math.hypot(this.ship.velX, this.ship.velY);
        const maxSpeed = 20; // The max speed we want the gauge to show.

        // --- Gauge settings ---
        const centerX = 120;
        const centerY = 120;
        const radius = 80;
        const startAngle = Math.PI * 0.75; // Start angle (bottom-left)
        const endAngle = Math.PI * 2.25;   // End angle (bottom-right)
        const totalAngle = endAngle - startAngle;

        ctx.save();
        ctx.lineWidth = 15;
        ctx.font = '16px "Orbitron", Arial, sans-serif';

        // --- Draw the color-coded arcs ---
        // Arc Outline (White)
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffffff'; // White
        ctx.beginPath();
        ctx.arc(centerX, centerY, 90, startAngle, endAngle);
        ctx.stroke();
        ctx.restore();

        // Docking Speed (Blue)
        ctx.strokeStyle = '#a0e0ff'; // Light Blue
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle * 0.05);
        ctx.stroke();

        // Orbit Speed (Green)
        ctx.strokeStyle = '#00ff00'; // Green
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.1, startAngle + totalAngle * 0.25);
        ctx.stroke();

        // Gravity Assist Speed (Yellow)
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.251, startAngle + totalAngle * 0.5);
        ctx.stroke();

        // --- Draw the needle ---
        const speedRatio = Math.min(speed / maxSpeed, 1.0); // Cap at 1.0
        const needleAngle = startAngle + (speedRatio * totalAngle);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(needleAngle) * (radius + 10), centerY + Math.sin(needleAngle) * (radius + 10));
        ctx.stroke();

        // --- Draw the speed text ---
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(speed.toFixed(2), centerX, centerY + 40);

        // Draw the speed range labels
        ctx.save();
        if (speed >= 0.01 && speed <= 1.0) {
            ctx.fillStyle = '#a0e0ff'; // Light blue like docking arc
            ctx.fillText('DOCK OK', centerX, centerY + 80);
        } else if (speed >= MIN_ORBIT_SPEED && speed <= MAX_ORBIT_SPEED) {
            ctx.fillStyle = '#00ff00'; // Green like orbit arc
            ctx.fillText('ORBIT OK', centerX, centerY + 80);
        } else if (speed >= 5.0 && speed <= 10.0) {
            ctx.fillStyle = 'yellow'; // Yellow like gravity assist arc
            ctx.fillText('GRAV ASSIST', centerX, centerY + 80);
        } else if (speed > 20.0) {
            ctx.font = '20px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'red'; // Red for dangerous speeds
            ctx.fillText('OVERSPEED', centerX, centerY + 80);
        }
        ctx.restore();
    }
    
    drawOrbitalPathRing(ctx) {
        // Only draw if ship is in orbit (Task 7.7)
        if (!this.ship || !this.ship.isOrbitLocked || !this.ship.orbitingPlanet) return;
        
        const planet = this.ship.orbitingPlanet;
        const orbitRadius = this.ship.orbitRadius;
        
        // Calculate current speed fraction to determine if we're at high speed
        const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
        const speedAboveMin = this.ship.lockedOrbitSpeed - MIN_ORBIT_SPEED;
        const speedFraction = speedAboveMin / speedRange;
        const highSpeedThreshold = 0.8; // 80% of max speed
        const isAtHighSpeed = speedFraction >= highSpeedThreshold;
        
        // Calculate opacity based on time since last thrust or high speed (Task 7.7.3-7.7.4)
        const currentTime = Date.now();
        const timeSinceThrust = (currentTime - this.orbitalRingLastThrustTime) / 1000; // Convert to seconds
        const timeSinceHighSpeed = (currentTime - this.orbitalRingLastHighSpeedTime) / 1000; // Convert to seconds
        const normalFadeDelay = 3.0; // seconds to keep visible after normal thrust stops
        const highSpeedFadeDelay = 10.0; // seconds to keep visible at high speed (80%+)
        const highSpeedRingOpacityMultiplier = 0.5; // Dim the ring at high speed (0.0-1.0) to emphasize departure line
        
        let opacity = 0;
        
        if (this.ship.thrusting || this.ship.reversing) {
            // Full opacity while thrusting (dimmed at high speed)
            opacity = isAtHighSpeed ? highSpeedRingOpacityMultiplier : 1.0;
        } else if (isAtHighSpeed) {
            // Currently at high speed (80%+): fade over 10 seconds with dimmer opacity
            if (timeSinceHighSpeed < highSpeedFadeDelay) {
                opacity = (1.0 - (timeSinceHighSpeed / highSpeedFadeDelay)) * highSpeedRingOpacityMultiplier;
            } else {
                return; // Hidden after 10 second fade
            }
        } else if (timeSinceThrust < normalFadeDelay) {
            // Below 80% speed: fade over 3 seconds
            opacity = 1.0 - (timeSinceThrust / normalFadeDelay);
        } else {
            // Completely hidden after fade delay
            return; // Don't draw at all
        }
        
        // Draw light grey ring at current orbital radius
        ctx.save();
        ctx.strokeStyle = `rgba(200, 200, 200, ${opacity})`; // Light grey with calculated opacity
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    drawOrbitDepartureLine(ctx) {
        // Only draw if ship is in orbit (Task 7.8.1-7.8.4)
        if (!this.ship || !this.ship.isOrbitLocked || !this.ship.orbitingPlanet) return;
        
        // Calculate how close we are to departure (as a fraction from 0 to 1)
        const speedRange = MAX_ORBIT_SPEED - MIN_ORBIT_SPEED;
        const speedAboveMin = this.ship.lockedOrbitSpeed - MIN_ORBIT_SPEED;
        const speedFraction = speedAboveMin / speedRange;
        
        // Warning threshold - show line when at 80% or higher of speed range
        const warningThreshold = 0.8;
        const isAtHighSpeed = speedFraction >= warningThreshold;
        
        // Only show if currently at or above threshold
        if (!isAtHighSpeed) {
            return; // Hidden below 80%
        }
        
        // Calculate opacity - fade over 10 seconds when at high speed
        const currentTime = Date.now();
        const timeSinceHighSpeed = (currentTime - this.orbitalRingLastHighSpeedTime) / 1000;
        const highSpeedFadeDelay = 10.0;
        
        let opacity = 0;
        
        if (this.ship.thrusting || this.ship.reversing) {
            // Full opacity while thrusting
            opacity = 1.0;
        } else if (timeSinceHighSpeed < highSpeedFadeDelay) {
            // Fade over 10 seconds at high speed
            opacity = 1.0 - (timeSinceHighSpeed / highSpeedFadeDelay);
        } else {
            // Hidden after 10 second fade
            return;
        }
        
        // Calculate departure angle (tangent to orbit, direction-dependent)
        // CCW (dir=1): +90°, CW (dir=-1): -90°
        const departureAngle = this.ship.orbitAngle + (Math.PI / 2) * (this.ship.orbitDirection || 1);
        
        // Line length based on how close to departure (longer as speed increases)
        const minLineLength = 500;
        const maxLineLength = 1500;
        const normalizedSpeed = Math.max(0, speedFraction - warningThreshold) / (1 - warningThreshold);
        const lineLength = minLineLength + normalizedSpeed * (maxLineLength - minLineLength);
        
        // Calculate line endpoint
        const endX = this.ship.x + Math.cos(departureAngle) * lineLength;
        const endY = this.ship.y + Math.sin(departureAngle) * lineLength;
        
        // Draw departure line with calculated opacity
        ctx.save();
        ctx.strokeStyle = `rgba(200, 200, 200, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(this.ship.x, this.ship.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        ctx.restore();
    }
    
    drawCompass() {
        if (!this.ship) return;

        let target = null; // The object we want the compass to point at.
        let minDistance = Infinity;

        // First, determine what our target is.
        const nextWaypoint = this.navScreen.waypoints[0] || this.navScreen.finalWaypoint;

        if (nextWaypoint) {
            // If we have a waypoint, that is our target.
            target = nextWaypoint;
            /* Function for finding the closest planet
        } else {
            // Otherwise, find the closest planet as a default target.
            for (const planet of celestialBodies) {
                const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    target = planet;
                }
            }
                */
        }

        // If we have a target, draw the compass.
        if (target) {
            const distance = Math.hypot(this.ship.x - target.x, this.ship.y - target.y);

            // Only draw the compass if the target is far away.
            if (distance > (target.radius || 0) * 1.15) {
                const angleToTarget = Math.atan2(target.y - this.ship.y, target.x - this.ship.x);

                const hudX = canvas.width / 2;
                const hudY = canvas.height / 2;
                const compassRadius = 120;

                ctx.save();
                ctx.translate(hudX + Math.cos(angleToTarget) * compassRadius, hudY + Math.sin(angleToTarget) * compassRadius);
                ctx.rotate(angleToTarget + Math.PI / 2);

                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red arrow
                ctx.beginPath();
                ctx.moveTo(0, -7.5);
                ctx.lineTo(-5, 5);
                ctx.lineTo(5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '22px "Consolas", "Courier New", "Monaco", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.floor(distance).toLocaleString()}m`, hudX, hudY + compassRadius + 30);
            }
        }
    }

    drawRadar() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Cache ship position and radar settings
        const shipPos = {
            x: this.ship.x,
            y: this.ship.y
        };

        // --- Radar Settings (tweak these to change the look and feel!) ---
        const radarRadius = 100; // The size of the radar circle
        const radarX = canvas.width - radarRadius - 20; // Position from the right edge
        const radarY = radarRadius + 20; // Position from the top edge
        const radarRange = this.WORLD_WIDTH / 4; // The max distance the radar can "see". Tied to world size!
        const radarScale = radarRadius / radarRange; // How to scale world distances to radar distances

        ctx.save();

        // Draw the semi-transparent background circle
        ctx.beginPath();
        ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 50, 0, 0.5)'; // Dark green, semi-transparent
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Brighter green border
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw each planet as a blip on the radar
        for (const planet of celestialBodies) {
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);

            let blipX, blipY;

            if (distance < radarRange) {
                // Planet is inside radar range, position it proportionally
                blipX = radarX + dx * radarScale;
                blipY = radarY + dy * radarScale;
            } else {
                // Planet is outside range, pin it to the edge of the radar
                const angle = Math.atan2(dy, dx);
                blipX = radarX + Math.cos(angle) * radarRadius;
                blipY = radarY + Math.sin(angle) * radarRadius;
            }

            // Draw the planet's blip
            ctx.beginPath();
            ctx.arc(blipX, blipY, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.fill();
        }
        // Draw each dock as a blip on the radar
        for (const dock of this.spaceDocks) {
            const dx = dock.x - this.ship.x;
            const dy = dock.y - this.ship.y;
            const distance = Math.hypot(dx, dy);

            let blipX, blipY;

            if (distance < radarRange) {
                // Dock is inside radar range, position it proportionally
                blipX = radarX + dx * radarScale;
                blipY = radarY + dy * radarScale;
            } else {
                // Dock is outside range, pin it to the edge of the radar
                const angle = Math.atan2(dy, dx);
                blipX = radarX + Math.cos(angle) * radarRadius;
                blipY = radarY + Math.sin(angle) * radarRadius;
            }

            // Draw the dock's blip
            ctx.beginPath();
            // Draw a star shape for the dock
            const spikes = 5;
            const outerRadius = 6;
            const innerRadius = 3;
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes;
                const x = blipX + Math.cos(angle) * radius;
                const y = blipY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(40, 219, 239, 0.9)';
            ctx.fill();
        }

        // Draw the player's blip in the center (using radarX, radarY - the center of the radar)
        ctx.beginPath();
        ctx.moveTo(radarX, radarY - 3);     // Top point
        ctx.lineTo(radarX - 3, radarY + 3); // Bottom left
        ctx.lineTo(radarX + 3, radarY + 3); // Bottom right
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();

        // --- NEW RADAR WAYPOINT LOGIC ---
        // Get the full route from the Nav Screen
        const routePoints = [this.ship, ...this.navScreen.waypoints];
        if (this.navScreen.finalWaypoint) {
            routePoints.push(this.navScreen.finalWaypoint);
        }

        // This helper function converts a world point to a radar point
        const toRadarCoords = (point) => {
            const dx = point.x - this.ship.x;
            const dy = point.y - this.ship.y;
            const dist = Math.hypot(dx, dy);
            if (dist < radarRange) {
                return { x: radarX + dx * radarScale, y: radarY + dy * radarScale };
            } else {
                const angle = Math.atan2(dy, dx);
                return { x: radarX + Math.cos(angle) * radarRadius, y: radarY + Math.sin(angle) * radarRadius };
            }
        };
        // Draw the connecting lines
        if (routePoints.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(radarX, radarY); // Start from player in center
            for (let i = 1; i < routePoints.length; i++) {
                const radarPoint = toRadarCoords(routePoints[i]);
                ctx.lineTo(radarPoint.x, radarPoint.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw rings for the waypoints
        ctx.lineWidth = 2;

        // Intermediate Waypoints (White Rings)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.navScreen.waypoints.forEach(wp => {
            const radarPoint = toRadarCoords(wp);
            ctx.beginPath();
            ctx.arc(radarPoint.x, radarPoint.y, 8, 0, Math.PI * 2); // 8-pixel ring
            ctx.stroke();
        });

        // Final Waypoint (Yellow Ring)
        if (this.navScreen.finalWaypoint) {
            const radarPoint = toRadarCoords(this.navScreen.finalWaypoint);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(radarPoint.x, radarPoint.y, 10, 0, Math.PI * 2); // 10-pixel ring
            ctx.stroke();
        }

        ctx.restore();
    }
    drawHud() {
        if (this.ship && this.ship.isDocked) {
            ctx.save();
            ctx.font = '30px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'cyan';
            ctx.textAlign = 'center'; // Ensure text is centered
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            // Center the text exactly like the CSS button: canvas.width / 2
            ctx.fillText('SHIP DOCKED', canvas.width / 2, canvas.height * 0.10); // 10% down the screen
            ctx.restore();
            return;
        }
    }
    //if (!this.orbitData) return; // Don't draw if there's no data


    drawDebugInfo() {
        if (!this.ship || !celestialBodies.length) return;

        // Find the closest planet to the ship
        const closestPlanet = celestialBodies.reduce((closest, planet) => {
            const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
            if (dist < closest.dist) {
                return { dist, planet };
            }
            return closest;
        }, { dist: Infinity, planet: null }).planet;

        if (!closestPlanet) return;

        // Calculate the distance (radius) from the ship to the center of the planet
        const radius = Math.hypot(this.ship.x - closestPlanet.x, this.ship.y - closestPlanet.y);
        const zoom = this.camera.zoomLevel;

        // --- Draw the text on the screen ---
        ctx.save();
        ctx.font = '16px "Orbitron"';
        ctx.fillStyle = 'yellow';
        ctx.textAlign = 'left';
        ctx.fillText(`Radius: ${radius.toFixed(0)}`, 10, canvas.height - 30);
        ctx.fillText(`Zoom: ${zoom.toFixed(2)}`, 10, canvas.height - 10);
        ctx.restore();
    }


    updateHUD() {
        const hud = document.getElementById('player-hud');
        if (hud && playerDataManager.data) {
            hud.style.display = 'block';
            document.getElementById('hud-company-name').textContent = playerDataManager.getCompanyName();

            // Format the balance as currency
            const balance = playerDataManager.getBalance();
            const formattedBalance = `¢ ${balance.toLocaleString()}`;
            document.getElementById('hud-bank-balance').textContent = formattedBalance;
        }
    }

    handleKeys(e, isDown) {
        if (!this.ship || this.isPaused) return;

        const oldThrusting = this.ship.thrusting || this.ship.reversing;
        switch (e.key) {
            case 'ArrowUp': case 'w': this.ship.thrusting = isDown; break;
            case 'ArrowDown': case 's': this.ship.reversing = isDown; break;
            case 'ArrowLeft': case 'a': this.ship.rotatingLeft = isDown; break;
            case 'ArrowRight': case 'd': this.ship.rotatingRight = isDown; break;
            case 'q': case ',': this.ship.strafingLeft = isDown; break;
            case 'e': case '.': this.ship.strafingRight = isDown; break;
            case ' ': if (isDown) this.ship.rotation = 0; break;
        }
        const newThrusting = this.ship.thrusting || this.ship.reversing;
        if (thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    }

    // --- State Preservation Methods ---
    saveState() {
        if (this.ship && this.camera) {
            this.savedState = {
                ship: {
                    x: this.ship.x,
                    y: this.ship.y,
                    vx: this.ship.vx,
                    vy: this.ship.vy,
                    rotation: this.ship.rotation,
                    isOrbitLocked: this.ship.isOrbitLocked,
                    inStableOrbit: this.ship.inStableOrbit,
                    orbitingPlanet: this.ship.orbitingPlanet,
                    isDocked: this.ship.isDocked
                },
                camera: {
                    x: this.camera.x,
                    y: this.camera.y,
                    zoom: this.camera.zoom,
                    targetZoom: this.camera.targetZoom
                }
            };
            console.log('SpaceScene state saved:', this.savedState);
        }
    }

    restoreState() {
        if (this.savedState && this.ship && this.camera) {
            // Restore ship state
            this.ship.x = this.savedState.ship.x;
            this.ship.y = this.savedState.ship.y;
            this.ship.vx = this.savedState.ship.vx;
            this.ship.vy = this.savedState.ship.vy;
            this.ship.rotation = this.savedState.ship.rotation;
            this.ship.isOrbitLocked = this.savedState.ship.isOrbitLocked;
            this.ship.inStableOrbit = this.savedState.ship.inStableOrbit;
            this.ship.orbitingPlanet = this.savedState.ship.orbitingPlanet;
            this.ship.isDocked = this.savedState.ship.isDocked;

            // Restore camera state
            this.camera.x = this.savedState.camera.x;
            this.camera.y = this.savedState.camera.y;
            this.camera.zoom = this.savedState.camera.zoom;
            this.camera.targetZoom = this.savedState.camera.targetZoom;

            console.log('SpaceScene state restored:', this.savedState);
            this.savedState = null; // Clear saved state after restoration
            return true;
        }
        return false;
    }

    // TASK 6.6: Handle clicks on canvas to detect fleet ship selection
    handleShipClick(canvasX, canvasY) {
        if (!this.camera || !this.fleetShips || this.fleetShips.length === 0) {
            return; // No fleet ships to click on
        }

        // Convert canvas coordinates to world coordinates using camera transform
        // The camera uses its begin() method which translates to center the view on camera.x, camera.y
        // So we need to reverse that transformation
        const worldX = (canvasX - canvas.width / 2) / this.camera.zoomLevel + this.camera.x;
        const worldY = (canvasY - canvas.height / 2) / this.camera.zoomLevel + this.camera.y;

        // Check each fleet ship for collision with click point
        for (let i = 0; i < this.fleetShips.length; i++) {
            const fleetShip = this.fleetShips[i];
            if (!fleetShip || !fleetShip.fleetData) continue;

            // Calculate ship bounds (ships are drawn centered at x,y with rotation)
            // Use a simple rectangular collision check with some padding for easier clicking
            const shipHalfWidth = fleetShip.width / 2;
            const shipHalfHeight = fleetShip.height / 2;
            const clickPadding = 50; // Make clickable area slightly larger than visual ship

            // Simple AABB collision (ignore rotation for click detection to make it easier)
            const inBoundsX = worldX >= fleetShip.x - shipHalfWidth - clickPadding && 
                            worldX <= fleetShip.x + shipHalfWidth + clickPadding;
            const inBoundsY = worldY >= fleetShip.y - shipHalfHeight - clickPadding && 
                            worldY <= fleetShip.y + shipHalfHeight + clickPadding;

            if (inBoundsX && inBoundsY) {
                // Player clicked on this fleet ship - switch control to it
                this.switchToFleetShip(i);
                return; // Exit after first match
            }
        }
    }

    // TASK 6.6: Switch active ship control to a clicked fleet ship
    switchToFleetShip(fleetShipIndex) {
        const clickedFleetShip = this.fleetShips[fleetShipIndex];
        if (!clickedFleetShip || !clickedFleetShip.fleetData) {
            console.error('Invalid fleet ship index for switching');
            return;
        }

        console.log(`Switching control from ${this.ship.fleetData?.name || 'Unknown'} to ${clickedFleetShip.fleetData.name}...`);

        // Step 1: Save current active ship's state to RAM
        const currentActiveShipId = playerDataManager.data.activeShipId;
        const currentShipLocation = {
            type: this.ship.isOrbitLocked ? 'orbit' : 'space',
            x: this.ship.x,
            y: this.ship.y,
            velX: this.ship.velX || 0,
            velY: this.ship.velY || 0,
            angle: this.ship.angle || 0,
            isDocked: this.ship.isDocked || false,
            isOrbitLocked: this.ship.isOrbitLocked || false,
            planetName: this.ship.orbitingPlanet?.name || null,
            orbitData: null
        };

        if (this.ship.isOrbitLocked && this.ship.orbitingPlanet) {
            currentShipLocation.orbitData = {
                planetIndex: this.ship.orbitingPlanet.index,
                orbitRadius: this.ship.orbitRadius,
                orbitAngle: this.ship.orbitAngle,
                lockedOrbitSpeed: this.ship.lockedOrbitSpeed || 0
            };
        }

        playerDataManager.updateShipLocation(currentActiveShipId, currentShipLocation);
        console.log(`  Saved current ship ${currentActiveShipId} state to RAM`);

        // Step 2: Update activeShipId in playerDataManager RAM
        const newActiveShipId = clickedFleetShip.fleetData.id;
        playerDataManager.data.activeShipId = newActiveShipId;
        console.log(`  Updated activeShipId to ${newActiveShipId}`);

        // Step 3: Swap ships - make clicked fleet ship the new active ship
        // Store reference to old active ship
        const oldActiveShip = this.ship;
        
        // Make clicked ship the new active ship
        this.ship = clickedFleetShip;
        this.ship.isFleetShip = false; // Mark as player-controllable
        
        // Store old active ship in the fleet ships array at the clicked position
        // IMPORTANT: Ensure the old ship keeps its fleetData so it can be clicked again
        oldActiveShip.isFleetShip = true; // Mark as non-controllable
        if (!oldActiveShip.fleetData) {
            // If old ship doesn't have fleetData, find it from playerDataManager
            const shipInfo = playerDataManager.data.fleet.find(s => s.id === currentActiveShipId);
            oldActiveShip.fleetData = shipInfo;
        }
        this.fleetShips[fleetShipIndex] = oldActiveShip;
        
        console.log(`  Swapped ship instances in scene arrays`);

        // Step 4: Update camera target and position to follow new active ship
        this.camera.target = this.ship;  // CRITICAL: Update camera's target
        this.camera.x = this.ship.x;
        this.camera.y = this.ship.y;
        console.log(`  Camera target updated and centered on new ship at (${Math.round(this.ship.x)}, ${Math.round(this.ship.y)})`);

        // Step 5: Save to localStorage
        playerDataManager.saveData();
        console.log(`  Saved all changes to localStorage`);

        console.log(`✓ Successfully switched control to ${this.ship.fleetData.name}`);
    }
};