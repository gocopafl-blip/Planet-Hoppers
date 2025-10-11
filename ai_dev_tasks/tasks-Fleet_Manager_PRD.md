## Relevant Files

- `index.html` - Update button text and IDs for UI changes (Fleet Terminal Access, Dock Ship, remove Depart Station, add Terminate Remote Command)
- `scripts/main.js` - Update event listeners for renamed buttons and new functionality  
- `scripts/scenes/space_dock_scene.js` - Update button references and event handlers for renamed Fleet Terminal Access button
- `scripts/scenes/space_scene.js` - Add Terminate Remote Command button logic and update Access Dock behavior
- `scripts/scenes/fleet_manager_scene.js` - Implement fleet display UI, ship interaction, and Jump To/Dispatch functionality
- `scripts/scenes/mission_board_scene.js` - Add ship assignment modal for mission acceptance flow
- `scripts/managers/fleet_manager.js` - Extend fleet management functionality for ship state persistence and active ship switching
- `scripts/managers/mission_manager.js` - Add ship assignment logic for missions
- `scripts/core/player_data.js` - Update fleet structure to support per-ship mission assignments and state persistence
- `scripts/managers/player_data_manager.js` - Add fleet and active ship management methods
- `style.css` - Add styling for ship assignment modal and updated fleet manager UI

### Notes

- The existing fleet manager scene has basic structure but needs significant enhancement to match PRD requirements
- Player data structure already has fleet array but needs mission assignment per ship
- Current fleet manager uses hardcoded activeShipId in FleetManager class - needs integration with player data
- Space scene already has state persistence methods that can be leveraged for multi-ship state management

## Tasks

- [x] 1.0 Update UI Elements and Button Structure
  - [x] 1.1 Rename "Fleet Management Services" button to "Fleet Terminal Access" in index.html dock menu
  - [x] 1.2 Remove "Depart Station" button from space dock UI in index.html
  - [x] 1.3 Rename "Access SpaceDock" button to "Dock Ship" in space scene UI
  - [x] 1.4 Add "Terminate Remote Command" button to space scene HUD near speedometer
  - [x] 1.5 Update event listeners in main.js for renamed buttons
  - [x] 1.6 Update space_dock_scene.js event handler references for renamed fleet button
- [x] 2.0 Implement Core Fleet Manager Scene Functionality
  - [x] 2.1 Create fleet list display showing all player ships with containers for each ship
  - [x] 2.2 Add ship container layout with glam-shot image, ship info (name, ID, status, location), and action button
  - [x] 2.3 Implement visual highlighting for currently active ship in fleet list
  - [x] 2.4 Add ship status determination logic (Ready for Dispatch, Orbiting Planet, Deep Space, etc.)
  - [x] 2.5 Add ship location display logic (Docked, planet names, coordinates for deep space)
  - [x] 2.6 Implement ship container click handler to show detailed ship parameters in expanded view
  - [x] 2.7 Add "Jump To" and "Dispatch" button functionality with proper ship state checking
- [x] 3.0 Add Ship State Management and Persistence
  - [x] 3.1 Update player_data.js fleet structure to include ship location, velocity, fuel, and mission assignment
  - [x] 3.2 Add fleet management methods to player_data_manager.js for ship state operations
  - [x] 3.3 Implement ship state persistence when switching between ships in fleet_manager.js
  - [x] 3.4 Add active ship switching functionality that saves current ship state and loads target ship state
  - [x] 3.5 Update space scene to restore ship state from fleet data when entering via Jump To or Dispatch
  - [x] 3.6 Add ship positioning logic for Dispatch (placing ship outside dock) vs Jump To (current location)
  - [x] 3.7 Add proper error handling for missing ship data or invalid locations
  - [x] 3.8 Add proper ship location initialization for new ships (set to docked state when added to fleet)
- [x] 4.0 Add Remote Command Termination and Space Scene Integration
  - [x] 4.1 Implement "Terminate Remote Command" button click handler in space scene
  - [x] 4.2 Add ship state saving logic when terminating remote command (FIXED - added fleet manager save call)
  - [x] 4.3 Add scene transition from space scene back to fleet manager via terminate button
  - [x] 4.4 Update space scene start method to properly handle ship spawning for both Jump To and Dispatch actions
  - [x] 4.5 Integrate fleet manager ship selection with space scene ship initialization
  - [x] 4.6 Add proper ship state restoration when returning to fleet manager from space scene
  - [x] 4.7 Add auto-return to fleet manager when ship docks (clears activeShipId and switches to fleet manager scene)
  - [x] 4.8 Test complete workflow: fleet manager → ship selection → space scene → terminate → fleet manager
- [ ] 5.0 Implement Mission Assignment Flow with Ship Selection
  - [ ] 5.1 Create ship assignment modal HTML structure in index.html
  - [ ] 5.2 Add modal styling in style.css with ship selection interface
  - [ ] 5.3 Update mission_board_scene.js Accept button to show ship assignment modal instead of direct acceptance
  - [ ] 5.4 Implement modal population with available (unassigned) ships from player fleet
  - [ ] 5.5 Add ship selection logic in modal with mission assignment to chosen ship
  - [ ] 5.6 Update mission_manager.js to handle per-ship mission assignments
  - [ ] 5.7 Add mission assignment storage in player data per ship basis
  - [ ] 5.8 Update fleet manager display to show "Active Mission" parameter for ships with assignments
- [ ] 6.0 Implement Multi-Ship Rendering and Fleet Visualization
  - [ ] 6.1 Add multi-ship rendering support to space scene for visualizing entire fleet
  - [ ] 6.2 Implement ship-to-ship visual indicators when multiple ships are in same sector
  - [ ] 6.3 Add fleet formation and positioning logic for multiple ships in same location
  - [ ] 6.4 Create visual distinction between active ship and other fleet ships in space view
  - [ ] 6.5 Add fleet tactical overview mode showing all ship positions simultaneously
  - [ ] 6.6 Implement ship selection/switching directly from space scene when multiple ships visible