# Product Requirements Document: Real-Time Fleet Background Simulation

## Introduction

Currently, fleet ships only update their positions and physics when the player is actively viewing the space scene. When the player switches to other scenes (Fleet Manager, Trade Hub, Mission Board, etc.), fleet ships remain frozen in their last known state. This PRD defines a system for continuous background simulation of all fleet ships, allowing them to move, orbit, and navigate in real-time even when the player is not directly viewing the space scene.

## Goals

1. **Continuous Simulation**: All fleet ships continue physics simulation (gravity, velocity, orbital mechanics) regardless of which scene the player is viewing
2. **Performance Optimization**: Implement configurable update rates to balance realism with resource usage
3. **Real-Time Awareness**: Players can monitor fleet positions and states through the Fleet Manager without needing to jump to the space scene
4. **Foundation for Future Features**: Establish the architecture needed for autopilot, AI captains, and advanced fleet coordination

## User Stories

### Core Functionality
- As a player, I want my fleet ships to continue moving while I'm managing other tasks, so that time feels consistent across all game activities
- As a player, I want to see accurate, up-to-date positions for all my ships in the Fleet Manager, without needing to jump to each ship
- As a player, I want ships in stable orbits to remain in orbit while I'm away, so I don't have to constantly micromanage them

### Future Enhancements (Context for Design)
- As a player, I want to plan navigation routes for my fleet ships from the Fleet Manager tactical view
- As a player with autopilot-equipped ships, I want to redirect those ships remotely and have them follow new flight paths
- As a player, I want to receive alerts when fleet ships need attention (low fuel, emergency, mission complete)

## Functional Requirements

### 7.1: Background Simulation Loop
- **Background Physics Engine**: Create a persistent physics update system that runs independently of scene rendering
- **Update Rate**: Default to reduced update rate (10-15fps) when space scene is inactive
- **Configuration**: Make update rate configurable for performance testing and adjustment
- **Full Rate Sync**: Switch to full 60fps updates when entering space scene for active ship control
- **Lifecycle**: Simulation runs continuously from game start (post-start screen) until game close

### 7.2: Fleet Manager Tactical View (Information Display)
- **Visual Display**: Create a "tactical holo-map" in Fleet Manager scene using NavScreen class as foundation
- **Styling**: Adapt NavScreen visual style to match Fleet Manager aesthetic (holographic, command center feel)
- **Multi-Ship Display**: Show all fleet ships simultaneously with their current positions
- **Flight Path Display**: Render selected navigation routes for each ship (if nav route exists)
- **Ship Information**: Hovering over a ship displays:
  - Ship name
  - Current speed
  - Current destination (if set)
  - Active cargo/mission (if applicable)
- **Real-Time Updates**: Tactical view updates positions as background simulation progresses

### 7.3: Data Persistence Integration
- **Position Updates**: Background simulation continuously updates ship positions in playerDataManager RAM
- **Checkpoint Saves**: Use existing checkpoint system to persist fleet states to localStorage:
  - Scene transitions
  - Manual saves
  - Page unload (beforeunload event)
- **State Recovery**: On game load, restore all ships to their last saved positions and velocities

### 7.4: Physics Fidelity
- **Full Physics**: Apply same physics calculations as active ship:
  - Gravitational forces from all celestial bodies
  - Velocity-based movement
  - Orbital mechanics
  - Boundary constraints (game window edges)
- **Deferred Features**: Note that the following are NOT implemented yet (future tasks):
  - Collision detection (Task TBD)
  - Fuel depletion (Task TBD)
  - Enhanced gravity/orbital mechanics (Task 9.0)

## Non-Goals

### Explicitly Out of Scope for Initial Implementation:
- **Collision Detection**: Not implemented (applies to active ship too; future task)
- **Fuel Consumption**: Ships do not consume fuel during background simulation (not implemented anywhere yet)
- **Automatic Mission Completion**: Ships cannot complete missions without player control (future autopilot feature)
- **Player Alerts/Notifications**: No pop-ups or warnings when ships need attention (future Fleet Manager Portal Advisory Upgrade)
- **Remote Control**: Players cannot change ship direction/speed from Fleet Manager (future autopilot feature)
- **Nav Route Planning from Fleet Manager**: Tactical view is information-only; cannot edit routes (future enhancement)
- **AI Captains**: No autonomous decision-making (future upgrade feature)

## Technical Considerations

### Architecture
- **Scene-Independent Game Loop**: Background simulation must run outside scene-specific update loops
- **GameManager Integration**: Likely implement as a dedicated update method called from main game loop
- **NavScreen Class Reuse**: Leverage existing NavScreen class for Fleet Manager tactical view with minimal modifications

### Performance
- **Configurable Update Rate**: 
  - Default: 10-15fps for background updates (not in space scene)
  - Active: 60fps when space scene is active
  - Exposed as constant for easy adjustment during testing
- **Resource Monitoring**: Test with multiple ships (3-5+) to validate performance assumptions
- **Optimization Strategy**: If performance issues arise, consider selective updates (only ships near planets, etc.)

### Data Flow
```
Background Simulation Loop
    ↓
Update Fleet Ship Physics (gravity, velocity, position)
    ↓
Write to playerDataManager.data (RAM)
    ↓
(On Checkpoint Events)
    ↓
playerDataManager.saveData() → localStorage
```

### Dependencies
- **Task 6.1**: Multi-ship rendering (COMPLETE)
- **Task 6.1.1**: Ship location persistence fix (COMPLETE)
- **Task 6.1.2**: Fleet ship checkpoint persistence (COMPLETE)
- **Task 9.0**: Enhanced gravity/orbital physics (PENDING - will affect physics calculations)

## Success Metrics

### Phase 1 (Initial Implementation - Task 7.0)
1. **Position Accuracy**: Fleet ship X,Y coordinates update in real-time in Fleet Manager (visible in ship list)
2. **Scene Transition**: Switching to space scene shows ships at their current simulated positions
3. **Persistence**: Page refresh restores all ships to correct positions with ongoing simulation
4. **Orbital Stability**: Ships in orbit remain in orbit when player is managing other activities

### Phase 2 (Future Iterations)
- **Tactical View Functionality**: Fleet Manager tactical holo-map displays all ships with flight paths
- **Nav Route Planning**: Players can modify flight paths from Fleet Manager
- **Autopilot Integration**: Autopilot-equipped ships follow nav routes automatically
- **Alert System**: Fleet Manager Portal Advisory notifies player of ship status changes

## Open Questions

### Resolved in Requirements Gathering:
- ✅ Update rate strategy: Configurable reduced rate (10-15fps default) when not in space scene
- ✅ Tactical view location: Fleet Manager scene, using NavScreen class
- ✅ Orbital behavior: Ships maintain orbit until player commands otherwise
- ✅ Simulation lifecycle: Starts after start screen, runs until game close
- ✅ Display strategy: Real-time position updates in existing Fleet Manager, plus new tactical view

### Remaining:
- **Performance Validation**: Need to test actual resource usage with 3-5+ ships
- **Update Rate Optimization**: May need to adjust 10-15fps default after testing
- **NavScreen Adaptation**: Determine exact modifications needed for multi-ship tactical view

## Implementation Phases

### Task 7.0: Real-Time Fleet Background Simulation
**7.1**: Background Simulation Loop (configurable update rate)
**7.2**: Fleet Manager Tactical View (information display)
**7.3**: Data Persistence Integration
**7.4**: Testing & Performance Validation

### Future Task Reorganization:
- **Task 8.0**: Universal Dock Interface (was Task 7.0)
- **Task 9.0**: Gravity & Orbital Physics Improvements (new - mentioned in Q2)
- **Task 10.0**: Start Screen Improvements (was Task 8.0)

## Notes

- This feature establishes critical infrastructure for future fleet automation (autopilot, AI captains, remote control)
- The tactical view starts as information-only but provides foundation for interactive fleet command
- Physics fidelity will improve when Task 9.0 (enhanced gravity/orbits) is implemented
- Performance may need tuning based on actual testing with multiple ships
