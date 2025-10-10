# Task 4.8: Fleet Manager Workflow Testing Guide

## Complete Workflow Test Plan

This document provides a comprehensive testing plan for validating the fleet manager → ship selection → space scene → terminate → fleet manager workflow.

## Pre-Test Setup

### 1. Ensure Test Environment
- [X] Game loads successfully
- [X] Player has at least 2 ships in fleet
- [X] Fleet manager is accessible from space dock
- [X] All console logging enabled for debugging

### 2. Initial State Validation
- [ ] Check `playerDataManager.data.fleet` has ships with proper location data
- [ ] Verify `playerDataManager.data.activeShipId` initial state
- [ ] Confirm fleet manager displays correctly

## Test Scenarios

### Scenario 1: Basic Dispatch Workflow
**Objective**: Test dispatching a docked ship and returning via terminate command

**Steps**:
1. [X] Open fleet manager from space dock
2. [X] Verify fleet list shows ships with correct status
3. [X] Select a docked ship
4. [X] Click "Dispatch" button
5. [X] Verify space scene loads with ship at launch position (not dock position)
6. [X] Move ship to different location
7. [X] Click "Terminate Remote Command"
8. [X] Verify return to fleet manager
9. [X] Verify ship shows new location in fleet manager

**Expected Results**:
- Ship appears at launch position (SHIP_LAUNCH_OFFSET) when dispatched
- Ship state is saved when terminating remote command
- Fleet manager shows updated ship location
- No console errors during transition

### Scenario 2: Jump To Workflow
**Objective**: Test jumping to ship at saved location

**Steps**:
1. [X] Complete Scenario 1 first (ship should be in space)
2. [X] Open fleet manager
3. [X] Find the ship that was moved in Scenario 1
4. [X] Verify ship shows "Deep Space" location with coordinates
5. [X] Click "Jump To" button
6. [X] Verify space scene loads with ship at exact saved position
7. [X] Move ship to orbit around a planet
8. [X] Click "Terminate Remote Command"
9. [X] Verify return to fleet manager
10. [X] Verify ship shows "Orbiting [Planet]" status

**Expected Results**:
- Ship appears at exact saved coordinates when using Jump To
- Orbital state is properly saved and displayed
- All velocity and position data preserved

### Scenario 3: Auto-Return on Docking
**Objective**: Test automatic return to fleet manager when ship docks

**Steps**:
1. [X] Dispatch or Jump To a ship
2. [X] Navigate ship to space dock
3. [X] Dock the ship (proper speed and distance)
4. [X] Wait for auto-return (should happen after ~1.5 seconds)
5. [X] Verify fleet manager opens automatically
6. [ ] Verify no active ship is selected (activeShipId cleared)
7. [ ] Verify docked ship shows "Docked at Station" status

**Expected Results**:
- Airlock sound plays when docking
- Automatic return to fleet manager after delay
- Ship marked as docked with no active ship
- All ship state properly preserved

### Scenario 4: Multi-Ship Fleet Management
**Objective**: Test switching between multiple ships

**Steps**:
1. [ ] Ensure fleet has at least 2 ships
2. [ ] Dispatch Ship A to deep space
3. [ ] Terminate remote command (Ship A in space)
4. [ ] Dispatch Ship B to different location
5. [ ] Terminate remote command (Ship B in space)
6. [ ] Jump To Ship A - verify correct position restoration
7. [ ] Jump To Ship B - verify correct position restoration
8. [ ] Verify fleet manager shows both ships with different locations

**Expected Results**:
- Each ship maintains independent state
- Switching between ships preserves individual positions
- No cross-contamination of ship states
- Fleet manager accurately displays all ship statuses

## State Validation Checklist

### During Each Test, Verify:

**Fleet Data Structure**:
- [ ] `ship.location.type` correctly set ('space', 'orbit', 'docked')
- [ ] `ship.location.x` and `ship.location.y` accurate
- [ ] `ship.location.velX` and `ship.location.velY` preserved
- [ ] `ship.consumables` properly maintained

**Active Ship Management**:
- [ ] `playerDataManager.data.activeShipId` correctly updated
- [ ] Active ship highlighting in fleet manager
- [ ] Proper action buttons (Dispatch vs Jump To)

**Scene Transitions**:
- [ ] No console errors during scene switches
- [ ] Proper settings passed to scenes
- [ ] Animation and UI state preserved

## Console Commands for Testing

Use these console commands to inspect state during testing:

```javascript
// Check current fleet state
console.log('Fleet:', playerDataManager.data.fleet);

// Check active ship
console.log('Active Ship ID:', playerDataManager.data.activeShipId);
console.log('Active Ship:', playerDataManager.getActiveShip());

// Check specific ship location
const ship = playerDataManager.getShipById(SHIP_ID);
console.log('Ship Location:', ship?.location);

// Force refresh fleet manager display
fleetManagerScene.refreshFleetDisplay();

// Enhanced ship position validation (includes orbital mechanics validation)
validateShipPosition(SHIP_ID);

// Create test orbital ship using realistic planet-based radius calculations
createTestOrbitalShip();
```

## Advanced Testing Functions

The `fleet_testing_utils.js` file provides enhanced testing functions:

**`validateShipPosition(shipId)`**: 
- Comprehensive validation including orbital mechanics
- Uses new constants for realistic radius bounds
- Validates orbit radius relative to actual planet size
- Checks position consistency with orbital data

**`createTestOrbitalShip()`**:
- Creates realistic orbital positions using planet-relative constants
- Uses `ORBIT_RADIUS_MULTIPLIERS` instead of magic numbers
- Automatically validates the created position
- Tests orbital mechanics with actual planetary physics

**Orbital Constants Used**:
- `ORBIT_RADIUS_MULTIPLIERS.MIN`: 1.1 (110% of planet radius)
- `ORBIT_RADIUS_MULTIPLIERS.DEFAULT`: 1.25 (125% of planet radius)  
- `ORBIT_RADIUS_MULTIPLIERS.MAX`: 1.35 (135% of planet radius - matches gravity well)
- `FALLBACK_ORBIT_RADIUS`: 300 (used when planet data unavailable)
```

## Known Issues to Watch For

- Ships appearing at wrong positions (0,0 or dock when should be in space)
- Console errors during scene transitions
- Fleet manager not updating ship status
- Active ship not being cleared on docking
- Velocity/angle not being preserved
- Orbital state corruption
- **FIXED**: Infinite loop when clicking ship actions (event listener binding issue)

## Recent Bug Fixes

### Event Listener Memory Leak (CRITICAL FIX)
**Symptom**: Infinite loop of ship actions, repeated console messages when clicking "Jump To" or "Dispatch"

**Root Cause**: Event listeners were added with `.bind(this)` but removed without the bound reference, causing multiple listeners to accumulate.

**Fix Applied**: Store bound function reference (`this.boundHandleFleetClick`) and properly remove it in stop() method.

**Verification**: Ship actions should only execute once per click after fix.

### Wrong Ship Display on Jump To (CRITICAL FIX)
**Symptom**: Clicking "Jump To" shows previously viewed ship instead of newly selected ship. Console shows correct ship ID but space scene displays wrong ship.

**Root Cause**: Space scene was prioritizing saved state restoration over fleet dispatch, causing it to restore the previous ship's state instead of loading the newly selected ship.

**Fix Applied**: Reordered space scene startup logic to prioritize fleet dispatch over saved state when coming from fleet manager. Added `this.savedState = null` to clear stale state.

**Verification**: "Jump To" should always display the correct ship matching the console log output.

### Stationary Ship in Restored Orbit (CRITICAL FIX)
**Symptom**: When jumping to an orbiting ship, the ship appears at correct orbital position but doesn't move, even though speedometer shows orbital speed.

**Root Cause**: The `lockedOrbitSpeed` property was not being saved in fleet data, so restored orbiting ships had no orbital velocity data.

**Fix Applied**: 
1. Added `lockedOrbitSpeed` to saved `orbitData` in fleet manager
2. Restored exact saved `lockedOrbitSpeed` in space scene (no calculations)
3. Preserved all original velocity and orientation data

**Verification**: Restored orbiting ships should move at exactly the same speed they had when originally orbiting.

### Active Ship Clearing Issues (BUG FIX IN PROGRESS)
**Symptom**: After docking, ship still appears highlighted in fleet manager despite console showing active ship was cleared. Error spam: "Cannot set active ship: Ship with ID null not found in fleet"

**Root Cause**: 
1. `setActiveShip(null)` validation didn't handle null values properly
2. Update loop continued running after clearing active ship, causing repeated error calls
3. Timing issues between scene transitions and active ship clearing

**Fix Applied**: 
1. Added proper null handling in `setActiveShip()` method
2. Removed delay in docking scene transition to prevent update loop with null active ship
3. Scene transitions now happen immediately after clearing active ship

**Verification**: No error spam in console, and ships should not be highlighted when active ship is cleared.

## Success Criteria

Task 4.8 is complete when:
- [ ] All test scenarios pass without errors
- [ ] Ship state is reliably preserved across all transitions
- [ ] Fleet manager accurately displays current ship statuses
- [ ] No data corruption or loss during workflow
- [ ] User experience is smooth and intuitive
- [ ] All console logging shows proper state management

## Debugging Tips

If tests fail:
1. Check browser console for error messages
2. Verify PlayerDataManager data structure integrity
3. Confirm FleetManager methods are being called
4. Check scene transition settings parameters
5. Validate ship catalogue data consistency