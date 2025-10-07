# **Product Requirements Document: Fleet Manager**

## **1\. Introduction/Overview**

The Fleet Manager is a critical scene that establishes the player as a remote commander of their ships. It is the primary interface for piloting vessels. This feature solves the problem of being limited to a single ship and introduces a new layer of strategic gameplay. From the Fleet Manager, players can view their entire fleet, check the status of each ship, and choose which vessel to remotely pilot. The `space_dock_scene` will remain the hub for accessing station services (Missions, Trade, Banking), with the Fleet Manager serving as the gateway to and from active spaceflight.

## **2\. Goals**

* Provide players with a centralized terminal to view all their ships and their current status.  
* Allow the player to change which ship they are actively piloting by setting the `activeShipID`.  
* Establish a clear and intuitive flow for entering and exiting remote ship control.  
* Integrate mission assignment with the fleet, allowing players to assign tasks to specific ships.  
* Update existing UI elements to align with the new remote-commander gameplay loop.

  ## **3\. User Stories**

* **As a player, I want to** see a list of all my ships, **so that I** can quickly assess the status of my entire fleet.  
* **As a player, I want to** select a ship in my fleet, **so that I** can view its detailed statistics like fuel, repair state, and location.  
* **As a player, I want to** take control of a ship that is currently in deep space, **so that I** can continue its journey or respond to an emergency.  
* **As a player, I want to** launch a ship from the space dock, **so I can** activate the ship for a new mission.  
* **As a player, I want to** exit remote control of my active ship, **so that I** can return to the Fleet Manager to command another vessel.  
* **As a player, I want to** assign a mission to a specific ship, **so that I** know which vessel is responsible for completing the contract.

  ## **4\. Functional Requirements**

1. **Core UI and Scene Changes:**  
   * The "Fleet Management Services" button in the `space_dock_scene` will be renamed to **"Fleet Terminal Access"**. This will be the player's entry point to the `fleet_manager_scene`.  
   * The **"Depart Station"** button in the `space_dock_scene` will be removed.  
   * The **"Access SpaceDock"** button in the `space_scene` will be renamed to **"Dock Ship"**. This will be the primary method for docking a ship.  
   * A new UI button, **"Terminate Remote Command,"** will be added to the `space_scene` HUD (near the speedometer). Clicking this button will return the player to the `fleet_manager_scene`.  
2. **Fleet Manager Scene:**  
   * The default view will be a list of all ships owned by the player, with the currently `activeShipID` highlighted.  
   * Each ship will be displayed in its own full-span, rectangular container with rounded corners.  
   * The currently `activeShipID` will be visually highlighted in the list.  
   * Each ship container will display:  
     1. The ship's "glam-shot" image on the far left.  
     2. Key parameters in the center:  
        1. Ship Name & Ship ID  
        2. Status Summary (e.g., "Ready for Dispatch," "Orbiting Hades V," "Disabled").  
        3. Location (e.g., "Docked," "Orbiting \[Planet Name\]," "Deep Space at \[X,Y\]").  
     3. A button on the far right.  
3. **Ship Interaction:**  
* Clicking anywhere on a ship's container will open a larger, expanded "holo-screen" displaying a full list of that ship's parameters.  
* The button on the far right of each ship's container will have two states:  
  * **"Jump To":** For ships currently in space. Clicking this will:  
    1. Set the selected ship as the `activeShipID`.  
    2. Switch the game to the `space_scene`.  
    3. Place the player in direct control of the selected ship at its current location.  
  * **"Dispatch":** For ships currently docked at a space station. Clicking this will:  
    1. Set the selected ship as the `activeShipID`.  
    2. Switch the game to the `space_scene`, with the ship appearing just outside the dock.  
    3. Place the player in direct control of the newly dispatched ship.  
4.   
5. **Mission Assignment Flow:**  
   * When a player clicks "Accept" on a mission in the `mission_board_scene`, a modal window will appear.  
   * This modal will display a list of the player's available (unassigned) ships.  
   * The player must select one of these ships to assign the mission to.  
   * Once a mission is assigned, the Fleet Manager view for that ship will be updated to show an "Active Mission" parameter.  
6. **State Persistence:**  
   * The state (location, velocity, fuel, assigned mission, etc.) of all non-active ships must be saved and persist when the player is controlling a different ship.

   ## **5\. Non-Goals (Out of Scope for this version)**

* **Remote Commands:** Players cannot issue commands to non-active ships. Direct remote control is required.  
* **AI Captains:** Hiring AI pilots to automate tasks is a future goal.  
* **Mission Cancellation/Reassignment:** The ability to cancel a mission (potentially with a penalty) or transfer an active mission from one ship to another (e.g., in a rescue scenario) is planned for a future update but is not required for this initial implementation.

  ## **6\. Design Considerations**

* The "Terminate Remote Command" button should be designed to fit naturally within the existing `space_scene` HUD.  
* The mission assignment modal should be clear and easy to understand, presenting only the necessary information for the player to make a choice.

  ## **7\. Technical Considerations**

* The logic for mission assignment will need to be added to `scripts/managers/mission_manager.js`.  
* `player_data.js` will need to be updated to store the assigned `missionId` on a per-ship basis within the `fleet` array.  
* UI elements in `index.html` (like the "Depart" and "Access Dock" buttons) will need their IDs and text content updated. Event listeners in `main.js` will need to be re-wired accordingly.

  ## **8\. Success Metrics**

* Players can seamlessly enter and exit remote piloting via the Fleet Manager and the new HUD button.  
* The UI changes (button renaming/removal) are correctly implemented and functional.  
* Players can successfully assign a newly accepted mission to a specific ship.  
* The Fleet Manager correctly displays which ship is on a mission.

  ## **9\. Open Questions**

* For the mission assignment modal, what specific ship details are most important to show the player to help them decide? (e.g., should it show cargo capacity, current fuel, etc.?)


