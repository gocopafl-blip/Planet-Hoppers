# Testing Task 8.1: Background Fleet Simulation

## Test Plan

This document outlines testing steps for the background fleet simulation feature.

## Pre-Test Setup

1. Open the game in a browser (`index.html`)
2. Open browser Developer Tools (F12) to view console logs
3. Ensure you have at least 2 ships in your fleet (if not, buy ships from Fleet Management Services)

## Test Scenarios

### Test 1: Background Simulator Initialization

**Steps:**
1. Open `index.html` in browser
2. Wait for game to load (start screen should appear)
3. Check browser console for initialization messages

**Expected Results:**
- Console should show: `BackgroundFleetSimulator started`
- No errors in console
- Game loads normally

**Verify:**
```javascript
// In console, check if simulator is active
gameManager.backgroundFleetSimulator.isActive  // Should be true
```

---

### Test 2: Fleet Data Updates in Background (Not in Space Scene)

**Steps:**
1. Ensure you have at least 2 ships in fleet
2. Dispatch one ship to space (using Fleet Terminal Access → Dispatch)
3. Terminate Remote Command to return to Fleet Manager
4. Stay in Fleet Manager scene (don't enter space scene)
5. Monitor fleet data in console

**Expected Results:**
- Fleet ship positions should update in `playerDataManager.data.fleet`
- Ship coordinates (x, y) should change over time
- Console should NOT show errors about undefined planets or ships

**Verify in Console:**
```javascript
// Check fleet ship positions every few seconds
setInterval(() => {
    const fleet = playerDataManager.data.fleet;
    fleet.forEach(ship => {
        if (ship.location && ship.location.type === 'space') {
            console.log(`${ship.name}: (${Math.round(ship.location.x)}, ${Math.round(ship.location.y)})`);
        }
    });
}, 3000); // Every 3 seconds

// Check update rate
gameManager.backgroundFleetSimulator.updateRate  // Should be 12 (12fps)
```

---

### Test 3: Rate Switching (Background → Active)

**Steps:**
1. Be in Fleet Manager scene (background simulator running at 12fps)
2. Note current update rate in console: `gameManager.backgroundFleetSimulator.updateRate`
3. Dispatch a ship (Jump To or Dispatch)
4. Enter Space Scene
5. Check update rate again

**Expected Results:**
- Before space scene: Update rate = 12
- After entering space scene: Console should show "BackgroundFleetSimulator update rate set to 60 fps"
- Update rate should be 60

**Verify in Console:**
```javascript
// Before entering space scene
gameManager.backgroundFleetSimulator.updateRate  // Should be 12

// After entering space scene
gameManager.backgroundFleetSimulator.updateRate  // Should be 60
```

---

### Test 4: Rate Switching (Active → Background)

**Steps:**
1. Be in Space Scene (active simulator running at 60fps)
2. Click "Terminate Remote Command"
3. Return to Fleet Manager
4. Check update rate

**Expected Results:**
- Console should show "BackgroundFleetSimulator update rate set to 12 fps"
- Update rate should switch back to 12

**Verify in Console:**
```javascript
gameManager.backgroundFleetSimulator.updateRate  // Should be 12
```

---

### Test 5: Orbital Ship Simulation

**Steps:**
1. Dispatch a ship to space
2. Navigate ship to orbit around a planet (enter orbit)
3. Terminate Remote Command
4. Wait 10-15 seconds while in Fleet Manager
5. Jump To the same ship

**Expected Results:**
- Ship should still be in orbit when you return
- Ship's orbital position should have advanced (moved around the planet)
- Orbit data should be preserved

**Verify in Console:**
```javascript
// Check orbital ship data
const fleet = playerDataManager.data.fleet;
const orbitalShip = fleet.find(s => s.location && s.location.type === 'orbit');
if (orbitalShip) {
    console.log('Orbit Angle:', orbitalShip.location.orbitData.orbitAngle);
    console.log('Planet:', orbitalShip.location.planetName);
}
```

---

### Test 6: Multiple Ships in Different States

**Steps:**
1. Have at least 3 ships:
   - Ship A: Docked at station
   - Ship B: In deep space (moving)
   - Ship C: In orbit around a planet
2. Stay in Fleet Manager scene
3. Monitor all ships in console

**Expected Results:**
- Ship A (docked): Should not move (no physics updates)
- Ship B (space): Should move continuously
- Ship C (orbit): Should orbit continuously
- All position updates should happen in background

**Verify in Console:**
```javascript
setInterval(() => {
    const fleet = playerDataManager.data.fleet;
    fleet.forEach(ship => {
        const loc = ship.location;
        if (loc) {
            console.log(`${ship.name}: ${loc.type} at (${Math.round(loc.x)}, ${Math.round(loc.y)})`);
        }
    });
}, 5000); // Every 5 seconds
```

---

### Test 7: Position Persistence Across Scenes

**Steps:**
1. Dispatch Ship A to deep space
2. Move it to position (1000, 1000)
3. Terminate Remote Command
4. Wait 5 seconds in Fleet Manager
5. Jump To Ship A again

**Expected Results:**
- Ship should appear at the position it was simulated to (not the position you left it)
- If ship was moving, it should be further along its trajectory

**Verify:**
- Ship position should match `playerDataManager.data.fleet[shipIndex].location`
- Position should reflect background simulation updates

---

### Test 8: World Boundaries

**Steps:**
1. Dispatch a ship
2. Move it near world boundary (very high x or y coordinates)
3. Terminate Remote Command
4. Let it simulate in background
5. Check if ship bounces back or stops at boundaries

**Expected Results:**
- Ship should be constrained within world boundaries
- Velocity should dampen at boundaries
- Ship should not disappear or go to negative coordinates

---

## Known Issues to Watch For

### Potential Issues:

1. **Planets Not Found Error**
   - Symptom: Console shows "Planet X not found for ship Y in orbit"
   - Cause: `planetManager.celestialBodies` might be empty when simulator starts
   - Check: Ensure planets are generated before simulator starts

2. **Update Rate Not Switching**
   - Symptom: Update rate stays at 12 even when in space scene
   - Cause: Scene switching logic might not be detecting space scene correctly
   - Check: `gameManager.switchScene()` should detect scene.name === 'space'

3. **No Fleet Ships Updating**
   - Symptom: Ship positions don't change in background
   - Cause: Simulator might not be running or fleet is empty
   - Check: `gameManager.backgroundFleetSimulator.isActive` should be true

4. **Performance Issues**
   - Symptom: Game lags or browser freezes
   - Cause: Too many ships or update rate too high
   - Check: Try reducing `FLEET_BACKGROUND_UPDATE_RATE` if needed

## Success Criteria

Task 8.1 is successful when:
- [x] Background simulator starts automatically on game load
- [ ] Fleet ships update positions when not in space scene
- [ ] Update rate switches correctly between 12fps and 60fps
- [ ] Orbital ships maintain stable orbits in background
- [ ] Multiple ships in different states all simulate correctly
- [ ] No console errors during normal operation
- [ ] Performance is acceptable (< 5% CPU overhead)

## Debugging Commands

Use these console commands for debugging:

```javascript
// Check simulator status
gameManager.backgroundFleetSimulator.isActive
gameManager.backgroundFleetSimulator.updateRate
gameManager.backgroundFleetSimulator.lastUpdateTime

// Check fleet data
playerDataManager.data.fleet
playerDataManager.data.activeShipId

// Check world state
planetManager.celestialBodies.length
gameManager.spaceScene.WORLD_WIDTH

// Force a simulator update (for testing)
gameManager.backgroundFleetSimulator.update(performance.now())

// Check fleet ship count
playerDataManager.data.fleet.length
```

## Next Steps After Testing

If all tests pass:
- Proceed to Task 8.2: Fleet Manager Tactical View
- Proceed to Task 8.3: Data Persistence Integration
- Proceed to Task 8.4: Performance Validation

If issues found:
- Document issues in this file
- Fix critical bugs before proceeding
- Re-test after fixes

