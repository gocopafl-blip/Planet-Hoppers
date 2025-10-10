// Fleet Manager Testing Utilities for Task 4.8
// Copy and paste these functions into browser console for testing

// Utility: Display current fleet state
function debugFleetState() {
    console.log('=== FLEET STATE DEBUG ===');
    console.log('Active Ship ID:', playerDataManager.data.activeShipId);
    console.log('Fleet Count:', playerDataManager.data.fleet?.length || 0);
    
    if (playerDataManager.data.fleet) {
        playerDataManager.data.fleet.forEach((ship, index) => {
            console.log(`Ship ${index + 1}:`, {
                id: ship.id,
                name: ship.name,
                type: ship.shipTypeId,
                location: ship.location,
                health: `${ship.currentHealth}/${ship.maxHealth}`,
                fuel: ship.consumables?.fuel
            });
        });
    }
    console.log('=== END FLEET STATE ===');
}

// Utility: Test ship position validation
function validateShipPosition(shipId) {
    const ship = playerDataManager.getShipById(shipId);
    if (!ship) {
        console.error('Ship not found:', shipId);
        return false;
    }
    
    console.log('=== Validating ship position:', ship.name, '===');
    const location = ship.location;
    
    if (!location) {
        console.error('Ship has no location data');
        return false;
    }
    
    console.log('Location type:', location.type);
    console.log('Position:', location.x, location.y);
    console.log('Velocity:', location.velX, location.velY);
    console.log('State flags:', {
        isDocked: location.isDocked,
        isOrbitLocked: location.isOrbitLocked
    });
    
    // Enhanced validation for orbital ships
    if (location.type === 'orbit') {
        console.log('=== ORBITAL VALIDATION ===');
        const orbitData = location.orbitData;
        const planetName = location.planetName;
        
        if (!orbitData) {
            console.error('❌ Missing orbit data for orbital ship');
            return false;
        }
        
        if (!planetName) {
            console.error('❌ Missing planet name for orbital ship');
            return false;
        }
        
        console.log('Planet:', planetName);
        console.log('Orbit radius:', orbitData.orbitRadius);
        console.log('Orbit angle:', orbitData.orbitAngle);
        
        // Find the planet to validate orbit radius
        const planets = planetManager?.celestialBodies || [];
        const planet = planets.find(p => p.name === planetName);
        
        if (planet) {
            console.log('Planet found - radius:', planet.radius);
            
            // Calculate expected orbit bounds using new constants
            const minRadius = Math.max(planet.radius * ORBIT_RADIUS_MULTIPLIERS.MIN, ORBIT_RADIUS_BOUNDS.ABSOLUTE_MIN);
            const maxRadius = Math.min(planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX, ORBIT_RADIUS_BOUNDS.ABSOLUTE_MAX);
            const expectedDefault = planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT;
            
            console.log('Valid orbit range:', minRadius.toFixed(0), '-', maxRadius.toFixed(0));
            console.log('Expected default:', expectedDefault.toFixed(0));
            
            if (orbitData.orbitRadius < minRadius || orbitData.orbitRadius > maxRadius) {
                console.error('❌ Orbit radius', orbitData.orbitRadius, 'outside valid range for planet', planetName);
                console.error('   Planet radius:', planet.radius, 'Valid range:', minRadius.toFixed(0), '-', maxRadius.toFixed(0));
                return false;
            } else {
                console.log('✅ Orbit radius within valid bounds');
            }
            
            // Validate distance from planet center
            const actualDistance = Math.hypot(location.x - planet.x, location.y - planet.y);
            const distanceDiff = Math.abs(actualDistance - orbitData.orbitRadius);
            
            if (distanceDiff > 10) { // Allow 10 units tolerance for floating point precision
                console.warn('⚠️  Ship position distance from planet center (', actualDistance.toFixed(1), ') differs from orbit radius (', orbitData.orbitRadius, ') by', distanceDiff.toFixed(1));
            } else {
                console.log('✅ Ship position matches orbit radius');
            }
            
        } else {
            console.error('❌ Planet', planetName, 'not found in celestial bodies');
            return false;
        }
    }
    
    console.log('=== VALIDATION COMPLETE ===');
    return true;
}

// Utility: Create test orbital ship position for validation
function createTestOrbitalShip() {
    const planets = planetManager?.celestialBodies || [];
    if (planets.length === 0) {
        console.error('No planets available for orbital test');
        return;
    }
    
    const planet = planets[0]; // Use first planet
    console.log('Creating test orbital ship around planet:', planet.name, '(radius:', planet.radius, ')');
    
    // Calculate realistic orbital parameters using new constants
    const defaultOrbitRadius = planet.radius * ORBIT_RADIUS_MULTIPLIERS.DEFAULT;
    const orbitAngle = Math.random() * Math.PI * 2; // Random angle
    
    console.log('Test orbit radius:', defaultOrbitRadius.toFixed(0));
    console.log('Valid range:', 
        (planet.radius * ORBIT_RADIUS_MULTIPLIERS.MIN).toFixed(0), '-',
        (planet.radius * ORBIT_RADIUS_MULTIPLIERS.MAX).toFixed(0)
    );
    
    const fleet = playerDataManager.data.fleet;
    if (fleet && fleet.length > 0) {
        const ship = fleet[0];
        
        // Create realistic orbital location data
        const orbitLocation = {
            type: 'orbit',
            x: planet.x + defaultOrbitRadius * Math.cos(orbitAngle),
            y: planet.y + defaultOrbitRadius * Math.sin(orbitAngle),
            velX: 0,
            velY: 0,
            angle: orbitAngle + Math.PI / 2, // Tangent to orbit
            isDocked: false,
            isOrbitLocked: true,
            planetName: planet.name,
            orbitData: {
                orbitRadius: defaultOrbitRadius,
                orbitAngle: orbitAngle
            }
        };
        
        ship.location = orbitLocation;
        console.log('✅ Created test orbital ship. Use validateShipPosition("' + ship.id + '") to validate');
        
        // Auto-validate the position
        setTimeout(() => validateShipPosition(ship.id), 100);
    } else {
        console.error('No ships in fleet to modify');
    }
}

// Utility: Force fleet manager refresh
function refreshFleetManager() {
    if (gameManager.activeScene?.name === 'fleet_manager' || 
        gameManager.activeScene === fleetManagerScene) {
        console.log('Refreshing fleet manager display...');
        fleetManagerScene.refreshFleetDisplay();
    } else {
        console.log('Not currently in fleet manager scene');
    }
}

// Utility: Simulate ship movement for testing
function testMoveShip(x, y) {
    if (gameManager.activeScene?.name === 'space' && gameManager.activeScene.ship) {
        const ship = gameManager.activeScene.ship;
        console.log(`Moving ship from (${ship.x}, ${ship.y}) to (${x}, ${y})`);
        ship.x = x;
        ship.y = y;
        ship.velX = 0;
        ship.velY = 0;
        console.log('Ship moved. Remember to save state before switching scenes.');
    } else {
        console.log('Not in space scene or no ship available');
    }
}

// Utility: Quick save current ship state
function quickSaveShipState() {
    if (gameManager.activeScene?.name === 'space') {
        console.log('Saving space scene state...');
        gameManager.activeScene.saveState();
        fleetManager.saveActiveShipStateFromSpaceScene(gameManager.activeScene);
        console.log('State saved successfully');
    } else {
        console.log('Not in space scene');
    }
}

// Utility: Test complete workflow programmatically
function testWorkflow() {
    console.log('=== STARTING WORKFLOW TEST ===');
    debugFleetState();
    
    const fleet = playerDataManager.data.fleet;
    if (!fleet || fleet.length === 0) {
        console.error('No ships in fleet for testing');
        return;
    }
    
    console.log('Available ships for testing:');
    fleet.forEach((ship, index) => {
        console.log(`  ${index}: ${ship.name} (${ship.shipTypeId}) - Status: ${ship.location?.type || 'unknown'}`);
    });
    
    console.log('\nTo test manually:');
    console.log('1. Use debugFleetState() to check current state');
    console.log('2. Switch to fleet manager and select a ship');
    console.log('3. Use validateShipPosition(shipId) to check position');
    console.log('4. Use quickSaveShipState() before switching scenes');
    console.log('5. Use refreshFleetManager() to update display');
}

// Auto-run basic state check
console.log('Fleet Manager Testing Utilities Loaded');
console.log('Available functions: debugFleetState(), validateShipPosition(id), createTestOrbitalShip(), refreshFleetManager(), testMoveShip(x,y), quickSaveShipState(), testWorkflow()');
testWorkflow();