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
- [ ] 2.0 Implement Core Fleet Manager Scene Functionality
  - [ ] 2.1 Create fleet list display showing all player ships with containers for each ship
  - [ ] 2.2 Add ship container layout with glam-shot image, ship info (name, ID, status, location), and action button
  - [ ] 2.3 Implement visual highlighting for currently active ship in fleet list
  - [ ] 2.4 Add ship status determination logic (Ready for Dispatch, Orbiting Planet, Deep Space, etc.)
  - [ ] 2.5 Add ship location display logic (Docked, planet names, coordinates for deep space)
  - [ ] 2.6 Implement ship container click handler to show detailed ship parameters in expanded view
  - [ ] 2.7 Add "Jump To" and "Dispatch" button functionality with proper ship state checking
- [ ] 3.0 Add Ship State Management and Persistence
  - [ ] 3.1 Update player_data.js fleet structure to include ship location, velocity, fuel, and mission assignment
  - [ ] 3.2 Add fleet management methods to player_data_manager.js for ship state operations
  - [ ] 3.3 Implement ship state persistence when switching between ships in fleet_manager.js
  - [ ] 3.4 Add active ship switching functionality that saves current ship state and loads target ship state
  - [ ] 3.5 Update space scene to restore ship state from fleet data when entering via Jump To or Dispatch
  - [ ] 3.6 Add ship positioning logic for Dispatch (placing ship outside dock) vs Jump To (current location)
- [ ] 4.0 Implement Mission Assignment Flow with Ship Selection
  - [ ] 4.1 Create ship assignment modal HTML structure in index.html
  - [ ] 4.2 Add modal styling in style.css with ship selection interface
  - [ ] 4.3 Update mission_board_scene.js Accept button to show ship assignment modal instead of direct acceptance
  - [ ] 4.4 Implement modal population with available (unassigned) ships from player fleet
  - [ ] 4.5 Add ship selection logic in modal with mission assignment to chosen ship
  - [ ] 4.6 Update mission_manager.js to handle per-ship mission assignments
  - [ ] 4.7 Add mission assignment storage in player data per ship basis
  - [ ] 4.8 Update fleet manager display to show "Active Mission" parameter for ships with assignments
- [ ] 5.0 Add Remote Command Termination and Space Scene Integration
  - [ ] 5.1 Implement "Terminate Remote Command" button click handler in space scene
  - [ ] 5.2 Add ship state saving logic when terminating remote command
  - [ ] 5.3 Add scene transition from space scene back to fleet manager via terminate button
  - [ ] 5.4 Update space scene start method to properly handle ship spawning for both Jump To and Dispatch actions
  - [ ] 5.5 Integrate fleet manager ship selection with space scene ship initialization
  - [ ] 5.6 Add proper ship state restoration when returning to fleet manager from space scene
  - [ ] 5.7 Test complete workflow: fleet manager → ship selection → space scene → terminate → fleet manager