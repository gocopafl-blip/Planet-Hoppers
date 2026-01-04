# Task 8.0: Real-Time Fleet Background Simulation - Implementation Plan

## Overview
This document outlines the implementation plan for Task 8.0: Real-Time Fleet Background Simulation. The goal is to enable continuous physics simulation of all fleet ships regardless of which scene the player is viewing.

## Current State Analysis

### ✅ Completed Prerequisites
- Task 6.1: Multi-ship rendering (COMPLETE)
- Task 6.1.1: Ship location persistence fix (COMPLETE)
- Task 6.1.2: Fleet ship checkpoint persistence (COMPLETE)
- Task 7.9: Fleet ship orbit mechanics (COMPLETE)
- `updateFleetShips()` method exists in `space_scene.js` with full physics
- `saveFleetShipsToStorage()` method for persistence
- Fleet data structure in `playerDataManager.data.fleet`

### Current Architecture
- **GameManager**: Simple loop that only calls `update()`/`draw()` on active scene
- **SpaceScene**: Contains `updateFleetShips()` method that handles fleet ship physics (lines 507-641)
- **FleetManager**: Handles ship state persistence and active ship management
- **PlayerDataManager**: Stores fleet data in RAM and localStorage

### Key Code Locations
- `scripts/managers/game_manager.js`: Main game loop (needs background simulation integration)
- `scripts/scenes/space_scene.js`: `updateFleetShips()` method (needs extraction/adaptation)
- `scripts/managers/fleet_manager.js`: Ship state management
- `scripts/managers/player_data_manager.js`: Fleet data persistence

---

## Implementation Tasks Breakdown

### Task 8.1: Background Simulation Loop
**Goal**: Create a persistent physics update system that runs independently of scene rendering.

#### 8.1.1: Add FLEET_UPDATE_RATE constant to constants.js
- Add `FLEET_BACKGROUND_UPDATE_RATE = 12` (12 fps default)
- Add `FLEET_ACTIVE_UPDATE_RATE = 60` (60 fps when space scene active)
- Add `FLEET_UPDATE_INTERVAL_MS = 1000 / FLEET_BACKGROUND_UPDATE_RATE` (for timing)

**File**: `scripts/core/constants.js`

#### 8.1.2: Extract fleet physics logic from space_scene.js
- Create new method: `FleetManager.updateFleetPhysics(fleetShips, celestialBodies, worldWidth, worldHeight, deltaTime)`
- Move core physics logic from `space_scene.js:updateFleetShips()` to this method
- Keep orbital mechanics, velocity updates, boundary checks, orbit entry detection
- Remove rendering-specific code (keep pure physics calculations)

**Files**: 
- `scripts/managers/fleet_manager.js` (new method)
- `scripts/scenes/space_scene.js` (refactor to call new method)

#### 8.1.3: Create BackgroundFleetSimulator class in game_manager.js
- New class to manage background simulation
- Properties:
  - `isActive: boolean` - Whether simulation is running
  - `updateRate: number` - Current update rate (12 or 60 fps)
  - `lastUpdateTime: number` - Timestamp of last update
  - `updateInterval: number` - Milliseconds between updates
- Methods:
  - `start()` - Initialize and begin simulation
  - `stop()` - Stop simulation
  - `update(deltaTime)` - Run one physics update tick
  - `setUpdateRate(rate)` - Switch between background/active rates
  - `shouldUpdate(currentTime)` - Check if enough time has passed for next update

**File**: `scripts/managers/game_manager.js`

#### 8.1.4: Integrate background simulator with main game loop
- Add `backgroundFleetSimulator` instance to `gameManager`
- Call `backgroundFleetSimulator.update()` in `gameManager.loop()` (before scene update)
- Start simulator after game initialization (in `main.js:init()`)
- Auto-start when leaving start screen

**Files**:
- `scripts/managers/game_manager.js`
- `scripts/main.js`

#### 8.1.5: Implement rate switching logic
- Detect when space scene becomes active/inactive
- Call `setUpdateRate(FLEET_ACTIVE_UPDATE_RATE)` when entering space scene
- Call `setUpdateRate(FLEET_BACKGROUND_UPDATE_RATE)` when leaving space scene
- Integrate with `gameManager.switchScene()` method

**File**: `scripts/managers/game_manager.js`

#### 8.1.6: Update space scene to use background simulator data
- Modify `space_scene.js:updateFleetShips()` to skip physics if background simulator is handling it
- OR: Only call `updateFleetShips()` for rendering updates when in space scene
- Ensure active ship physics still run independently

**File**: `scripts/scenes/space_scene.js`

#### 8.1.7: Add world state access for background simulator
- Background simulator needs access to:
  - `celestialBodies` (planets array)
  - `WORLD_WIDTH` and `WORLD_HEIGHT`
  - Planet manager for planet data
- Options:
  - Pass as parameters to update method
  - Access through global `planetManager`
  - Store reference in simulator instance

**Files**: 
- `scripts/managers/game_manager.js`
- `scripts/managers/planet_manager.js` (ensure planets accessible)

---

### Task 8.2: Fleet Manager Tactical View (Information Display)
**Goal**: Create a tactical holo-map in Fleet Manager showing all ships with real-time positions.

#### 8.2.1: Create tactical holo-map container in fleet_manager_scene.js
- Add `<div id="fleet-tactical-view">` to HTML structure
- Style with holographic aesthetic matching Fleet Manager
- Position: Right side or full-screen toggle option
- Initial state: Hidden/collapsed

**File**: `index.html` (add container)
**File**: `style.css` (add styles)

#### 8.2.2: Adapt NavScreen class for multi-ship display
- Create new method: `NavScreen.renderMultiShipView(fleetShips, options)`
- Display all fleet ships simultaneously (not just active ship)
- Use different colors/icons for active ship vs fleet ships
- Show ship names/labels on hover or always visible

**File**: `scripts/ui/nav_screen.js`

#### 8.2.3: Apply Fleet Manager styling to tactical view
- Match holographic aesthetic (green glow, transparency)
- Use Fleet Manager color scheme
- Add animations for tactical view open/close
- Ensure visual consistency with rest of Fleet Manager UI

**File**: `style.css`

#### 8.2.4: Render all fleet ships with current positions
- Load fleet data from `playerDataManager.data.fleet`
- Convert stored positions to screen coordinates
- Render ship icons/indicators at correct positions
- Update positions in real-time as background simulation runs

**File**: `scripts/scenes/fleet_manager_scene.js`

#### 8.2.5: Display navigation routes for ships with active nav plans
- Check each ship for `navigation.waypoints` data
- Draw waypoint paths on tactical view
- Show active destination waypoint
- Color-code routes (different color per ship?)

**Files**:
- `scripts/scenes/fleet_manager_scene.js`
- `scripts/ui/nav_screen.js`

#### 8.2.6: Implement ship hover tooltips
- Display on mouse hover over ship icon:
  - Ship name
  - Current speed (or orbital speed if orbiting)
  - Current destination (if waypoint set)
  - Active cargo/mission (if applicable)
  - Location status (Docked, Orbiting [Planet], Deep Space)

**File**: `scripts/scenes/fleet_manager_scene.js`

#### 8.2.7: Add real-time position updates
- Connect tactical view to background simulator updates
- Refresh tactical view render when fleet positions change
- Use requestAnimationFrame for smooth updates
- Throttle updates if needed (don't need 60fps for tactical view)

**File**: `scripts/scenes/fleet_manager_scene.js`

#### 8.2.8: Add tactical view toggle button
- Add button in Fleet Manager UI to show/hide tactical view
- Animate open/close transitions
- Save preference (show/hide) in player data if desired

**Files**:
- `index.html`
- `scripts/scenes/fleet_manager_scene.js`

---

### Task 8.3: Data Persistence Integration
**Goal**: Ensure background simulation continuously updates ship positions in RAM and persists to localStorage.

#### 8.3.1: Update playerDataManager RAM on each simulation tick
- Background simulator calls `playerDataManager.updateShipLocation()` after each physics update
- Update ship positions, velocities, orbital data in RAM
- Ensure all location types supported: 'space', 'orbit', 'docked'

**Files**:
- `scripts/managers/game_manager.js` (background simulator)
- `scripts/managers/player_data_manager.js` (ensure updateShipLocation handles all cases)

#### 8.3.2: Verify checkpoint saves capture fleet positions
- Existing checkpoint system should work:
  - Scene transitions (already implemented in `main.js`)
  - Manual saves (if implemented)
  - Page unload (`beforeunload` event in `main.js`)
- Verify `saveFleetShipsToStorage()` is called at all checkpoints
- Test that background-simulated positions are captured correctly

**Files**: Review existing save points:
- `scripts/main.js` (beforeunload handler)
- `scripts/scenes/space_scene.js` (scene transitions)

#### 8.3.3: Test position restoration after page refresh
- Ensure ships restore to last simulated positions (not frozen positions)
- Verify orbital ships maintain orbit after refresh
- Check that velocity data is preserved correctly
- Test with multiple ships in different states

**Testing**: Manual test with console validation

#### 8.3.4: Validate orbital stability during background simulation
- Ships in orbit should maintain stable orbits during background simulation
- Orbital radius should remain consistent
- Orbital speed should not drift
- Test with multiple ships in orbit simultaneously

**Testing**: Automated validation in console or manual testing

---

### Task 8.4: Testing and Performance Validation
**Goal**: Validate performance and accuracy of background simulation system.

#### 8.4.1: Test with 3+ ships in different locations
- Create test scenario with 3-5 ships:
  - Ship 1: Docked at station
  - Ship 2: In deep space (moving)
  - Ship 3: In orbit around planet
  - Ship 4: In orbit around different planet
  - Ship 5: Approaching orbit
- Verify all ships simulate correctly simultaneously
- Check for performance issues (FPS drops, lag)

**Testing**: Manual gameplay test + console monitoring

#### 8.4.2: Verify ships continue moving when viewing fleet manager
- Switch to Fleet Manager scene
- Observe ship positions updating in ship list
- Check tactical view (if implemented) shows real-time movement
- Confirm ships aren't frozen when not in space scene

**Testing**: Manual test + console logging

#### 8.4.3: Confirm accurate synchronization when entering space scene
- Have ships moving in background simulation
- Jump To ship in space
- Verify ship appears at correct position (matches background simulation)
- Check velocity matches expected state

**Testing**: Manual test with position validation

#### 8.4.4: Monitor resource usage and adjust update rate if needed
- Use browser DevTools Performance tab
- Monitor CPU usage with 3-5 ships in background
- Test with default 12 fps rate
- Adjust `FLEET_BACKGROUND_UPDATE_RATE` if needed (try 10 fps, 15 fps)
- Goal: Minimal performance impact (< 5% CPU overhead)

**Testing**: Performance profiling + iterative tuning

#### 8.4.5: Test persistence across scene transitions and page refresh
- Save test: Move ships in background, switch scenes, refresh page
- Verify ships at correct positions after refresh
- Test with multiple scene switches (fleet manager → trade hub → mission board → space scene)
- Ensure no data loss or corruption

**Testing**: Multi-step manual test + console validation

---

## Implementation Order

### Phase 1: Core Background Simulation (8.1)
1. ✅ Add constants (8.1.1)
2. ✅ Extract physics logic (8.1.2)
3. ✅ Create BackgroundFleetSimulator (8.1.3)
4. ✅ Integrate with game loop (8.1.4)
5. ✅ Implement rate switching (8.1.5)
6. ✅ Update space scene (8.1.6)
7. ✅ Add world state access (8.1.7)

### Phase 2: Tactical View (8.2)
1. Create container and basic UI (8.2.1, 8.2.3)
2. Adapt NavScreen for multi-ship (8.2.2)
3. Render fleet ships (8.2.4)
4. Add waypoint display (8.2.5)
5. Implement tooltips (8.2.6)
6. Real-time updates (8.2.7)
7. Toggle button (8.2.8)

### Phase 3: Persistence Integration (8.3)
1. RAM updates (8.3.1)
2. Verify checkpoints (8.3.2)
3. Test restoration (8.3.3)
4. Validate orbital stability (8.3.4)

### Phase 4: Testing (8.4)
1. Multi-ship test (8.4.1)
2. Fleet manager movement test (8.4.2)
3. Synchronization test (8.4.3)
4. Performance monitoring (8.4.4)
5. Persistence test (8.4.5)

---

## Technical Considerations

### Architecture Decisions

**1. Background Simulator Location**
- **Decision**: Create as new class in `game_manager.js` or separate file
- **Rationale**: GameManager already manages game loop, logical place for simulation coordination
- **Alternative**: Separate `scripts/managers/background_simulator.js` (cleaner separation)

**2. Physics Logic Extraction**
- **Decision**: Move to FleetManager or create separate physics module
- **Rationale**: FleetManager already handles fleet operations, physics belongs there
- **Implementation**: New method `FleetManager.updateFleetPhysics()`

**3. World State Access**
- **Decision**: Pass as parameters vs global access
- **Rationale**: Parameters are cleaner but need to ensure planets are accessible
- **Implementation**: Access `planetManager.getPlanets()` and pass WORLD constants

**4. Update Rate Strategy**
- **Decision**: Time-based delta vs fixed interval
- **Rationale**: Fixed interval simpler, time-based more accurate
- **Implementation**: Use `requestAnimationFrame` with deltaTime checking for 12fps target

### Performance Optimizations

1. **Throttle Tactical View Updates**: Don't render tactical view at 60fps if background sim runs at 12fps
2. **Batch Position Updates**: Update all ships in one batch, then save to RAM
3. **Conditional Rendering**: Only render tactical view when Fleet Manager scene is active
4. **Skip Physics for Docked Ships**: Docked ships don't need physics updates

### Edge Cases to Handle

1. **Ship State Transitions**: 
   - Docked → Dispatched: Start physics simulation
   - Orbiting → Deep Space: Remove orbital constraints
   - Deep Space → Orbiting: Detect orbit entry

2. **Planet Data Availability**:
   - Background simulator needs planet positions
   - Ensure planets are loaded before simulation starts
   - Handle missing planet data gracefully

3. **Scene Transitions**:
   - Background sim should continue during all scene transitions
   - Only pause if game is paused (not implemented yet)

4. **Active Ship Physics**:
   - Active ship physics in space scene should take priority
   - Don't run background sim on active ship when in space scene
   - Sync active ship state back to fleet data after space scene updates

---

## Success Criteria

### Task 8.1 Complete When:
- [ ] Background simulation runs independently of active scene
- [ ] Fleet ships update at 12fps when not in space scene
- [ ] Fleet ships update at 60fps when in space scene
- [ ] No console errors during background simulation
- [ ] Active ship physics unaffected by background simulation

### Task 8.2 Complete When:
- [ ] Tactical view displays all fleet ships with correct positions
- [ ] Ship positions update in real-time on tactical view
- [ ] Navigation waypoints display for ships with active nav plans
- [ ] Hover tooltips show ship information
- [ ] Toggle button works to show/hide tactical view

### Task 8.3 Complete When:
- [ ] Ship positions update in RAM during background simulation
- [ ] Checkpoint saves capture current simulated positions
- [ ] Page refresh restores ships to correct simulated positions
- [ ] Orbital ships maintain stable orbits across save/load cycles

### Task 8.4 Complete When:
- [ ] All test scenarios pass
- [ ] Performance is acceptable (< 5% CPU overhead with 5 ships)
- [ ] No data corruption or loss during extended testing
- [ ] Ships synchronize correctly when entering space scene

---

## Open Questions / Decisions Needed

1. **Tactical View Priority**: Should tactical view be visible by default or hidden? (Recommendation: Hidden, toggle to show)

2. **Performance Target**: Is 12fps acceptable for background simulation, or should we aim higher? (Recommendation: Start at 12fps, adjust based on testing)

3. **Active Ship Exclusion**: Should active ship be excluded from background simulation when in space scene? (Recommendation: Yes, space scene handles active ship physics independently)

4. **NavScreen Adaptation**: Should we modify existing NavScreen class or create new TacticalView class? (Recommendation: Adapt NavScreen with new method to reuse code)

---

## Next Steps After Task 8.0

- **Task 9.0**: Universal Dock Interface System
- **Task 10.0**: Start Screen Game Management
- **Future**: Autopilot system (leverages background simulation infrastructure)

---

## Notes

- This feature establishes critical infrastructure for future fleet automation
- Background simulation enables autopilot, AI captains, and remote fleet commands
- Performance tuning may be needed based on actual testing with 5+ ships
- Tactical view can be enhanced later with interactive features (nav planning, remote commands)

