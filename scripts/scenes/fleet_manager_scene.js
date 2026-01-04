const fleetManagerScene = {
    name: 'menu', // We can reuse the menu music

    start(settings) {
        console.log("Starting Fleet Manager Scene...");
        // This scene just shows a background. The fleet manager UI is a separate HTML element.
        canvas.style.display = 'block';
        const fleetManager = document.getElementById('fleet-manager');

        // Make sure it's visible before the animation starts
        fleetManager.style.display = 'none';

        // Remove any old animation classes
        fleetManager.classList.remove('slide-out', 'slide-in', 'clip-reveal', 'clip-close');

        // ENHANCED: Check if returning from space scene for proper state restoration (Task 4.6 & 4.7)
        const returningFromSpace = settings && settings.fromSpaceScene;
        const dockedReturn = settings && settings.dockedReturn;

        if (returningFromSpace) {
            console.log('Fleet Manager: Returning from space scene, refreshing ship states');
        }

        if (dockedReturn) {
            console.log('Fleet Manager: Ship auto-returned after docking - ship is now available for new commands');
            // Could add special handling here like highlighting the docked ship or showing a message
        }

        // Add a delay before showing the missions and animating
        setTimeout(() => {
            fleetManager.style.display = 'flex';
            this.showFleetManager();
            // Animation is handled in showFleetManager()
        }, 500); // A 0.5 second delay

        // Add Accept Trade and Close listeners
        //this._tradeList = document.getElementById('fleet-list');
        this._closeBtn = document.getElementById('closeFleetManagerBtn');
        this._fleetList = document.getElementById('fleet-list');
        //if (this._tradeList) {
        //    this._tradeList.addEventListener('click', this.handleAcceptTrade);
        //}

        // Add fleet list click handler for ship details
        if (this._fleetList) {
            // Store bound function reference so we can properly remove it later
            this.boundHandleFleetClick = this.handleFleetClick.bind(this);
            this._fleetList.addEventListener('click', this.boundHandleFleetClick);
        }

        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this.handleCloseFleetManager);
        }
    },

    // NEW METHOD: Refresh fleet display without animation (Task 4.6)
    refreshFleetDisplay() {
        // This method updates the fleet manager display with current ship states
        // Used when returning from space scene to show updated ship information
        console.log('Refreshing fleet display with current ship states');
        this.populateFleetList();
    },

    showFleetManager() {
        const fleetManager = document.getElementById('fleet-manager');
        // Display is already set in start(), no need to repeat
        //fleetManager.classList.add('slide-in'); // Alternative: slides in from bottom
        fleetManager.classList.add('clip-reveal'); // Expanding chamfer effect

        // Delay the fleet list population to create the "holo" effect
        setTimeout(() => {
            this.populateFleetList();
        }, 1000); // Delay fleet list population by 300ms for holo effect
    },

    // NEW METHOD: Populate fleet list with current ship data (Task 4.6)
    populateFleetList() {
        const fleetList = document.getElementById('fleet-list');

        // Get the player's fleet from playerDataManager
        const playerFleet = playerDataManager.data.fleet || [];
        const activeShipId = playerDataManager.data.activeShipId;

        fleetList.innerHTML = '';

        if (playerFleet.length === 0) {
            fleetList.innerHTML = '<p style="color: #fff; text-align: center; margin-top: 50px;">No ships in fleet</p>';
        } else {
            playerFleet.forEach((ship) => {
                const shipData = shipCatalogue[ship.shipTypeId];
                if (!shipData) return; // Skip if ship type not found

                const shipElement = document.createElement('div');
                shipElement.className = `fleet-ship-container ${ship.id === activeShipId ? 'active-ship' : ''}`;
                const glamShotImage = assetManager.getImage(shipData.shipGlamShot);
                const imageSrc = glamShotImage ? glamShotImage.src : '';

                console.log('Ship debug:', {
    shipId: ship.id,
    shipName: ship.name,
    activeShipId: activeShipId,
    isActive: ship.id === activeShipId,
    locationType: ship.location?.type,
    locationData: ship.location
});
                // ENHANCED: Determine ship status and location from saved fleet data (Task 4.6)
                // This ensures the fleet manager shows accurate info even after returning from space
                // Mission status logic
                let status = '';
                let location = 'Docked';
                let actionText = 'Dispatch';
                let actionType = 'dispatch';

                // Mission assignment check
                let missionTitle = '';
                const hasMission = ship.assignedMissionId && missionCatalogue[ship.assignedMissionId];
                if (hasMission) {
                    missionTitle = missionCatalogue[ship.assignedMissionId].title;
                    status = `On Assignment - ${missionTitle}`;
                } else {
                    // Only set status if no mission assigned
                    status = 'Awaiting Orders';
                }

                // ALWAYS check location, regardless of mission status
                if (ship.id === activeShipId) {
                    // For active ship, check its saved location data first
                    if (ship.location) {
                        switch (ship.location.type) {
                            case 'space':
                                location = `Deep Space (${Math.round(ship.location.x)}, ${Math.round(ship.location.y)})`;
                                actionText = 'Jump To';
                                actionType = 'jump_to';
                                break;
                            case 'orbit':
                                const planetName = ship.location.planetName || 'Unknown Planet';
                                location = `Orbiting ${planetName}`;
                                actionText = 'Jump To';
                                actionType = 'jump_to';
                                break;
                            case 'docked':
                                location = 'Docked at Station';
                                actionText = 'Dispatch';
                                actionType = 'dispatch';
                                break;
                            default:
                                // Fallback - treat as remote command active
                                actionText = 'Jump To';
                                actionType = 'jump_to';
                        }
                    }
                } else {
                    // For non-active ships, check their stored state
                    if (ship.location) {
                        if (ship.location.type === 'docked') {
                            location = 'Docked at Station';
                            actionText = 'Dispatch';
                            actionType = 'dispatch';
                        } else if (ship.location.type === 'orbit') {
                            location = `Orbiting ${ship.location.planetName || 'Unknown Planet'}`;
                            actionText = 'Jump To';
                            actionType = 'jump_to';
                        } else if (ship.location.type === 'space') {
                            location = `Deep Space (${Math.round(ship.location.x)}, ${Math.round(ship.location.y)})`;
                            actionText = 'Jump To';
                            actionType = 'jump_to';
                        }
                    }
                }

                // Check ship health status
                if (ship.currentHealth <= 0) {
                    status = 'Disabled';
                    actionText = 'Repair Required';
                    actionType = 'disabled';
                } else if (ship.currentHealth < ship.maxHealth * 0.3) {
                    status = 'Damaged - ' + status;
                }

                // Check fuel status
                const currentFuel = ship.consumables?.fuel?.current || 0;
                const maxFuel = ship.consumables?.fuel?.max || shipData.shipConsumables?.shipFuel?.max || 100;
                if (currentFuel < maxFuel * 0.1) {
                    status = 'Low Fuel - ' + status;
                }

                shipElement.innerHTML = `
                    <img class="fleet-ship-image" src="${imageSrc}" alt="${ship.name}">
                    
                    <div class="fleet-ship-info">
                        <h3>${shipData.shipID} (ID: ${ship.name})</h3>
                        <p class="ship-status">Status: ${status}</p>
                        <p class="ship-location">Location: ${location}</p>
                        <div class="ship-stats">
                            <span>Health: ${ship.currentHealth}/${ship.maxHealth}</span>
                            <span>Fuel: ${ship.consumables?.fuel?.current || 0}/${ship.consumables?.fuel?.max || shipData.shipConsumables?.shipFuel?.max || 100}</span>
                        </div>
                    </div>
                    
                    <div class="fleet-ship-actions">
                        <button class="fleet-action-btn ${actionType === 'disabled' ? 'disabled' : ''}" 
                                data-ship-id="${ship.id}" 
                                data-action="${actionType}"
                                ${actionType === 'disabled' ? 'disabled' : ''}>
                            ${actionText}
                        </button>
                    </div>
                `;

                fleetList.appendChild(shipElement);
            });
        }
    },

    handleFleetClick(event) {
        // Handle ship container clicks for detailed view
        const shipContainer = event.target.closest('.fleet-ship-container');
        if (shipContainer && !event.target.closest('.fleet-action-btn')) {
            const shipId = shipContainer.querySelector('.fleet-action-btn').dataset.shipId;
            this.showShipDetails(parseInt(shipId));
        }

        // Handle action button clicks
        if (event.target.classList.contains('fleet-action-btn')) {
            const shipId = parseInt(event.target.dataset.shipId);
            const action = event.target.dataset.action;
            this.handleShipAction(shipId, action);
        }
    },

    showShipDetails(shipId) {
        const ship = playerDataManager.data.fleet.find(s => s.id === shipId);
        if (!ship) return;

        const shipData = shipCatalogue[ship.shipTypeId];
        if (!shipData) return;

        // Mission Parameters section
        let missionParamsHtml = '';
        if (ship.assignedMissionId && missionCatalogue[ship.assignedMissionId]) {
            const m = missionCatalogue[ship.assignedMissionId];
            missionParamsHtml = `
                <div class="detail-section">
                    <h3>Mission Parameters</h3>
                    <p><strong>Mission:</strong> ${m.title}</p>
                    <p><strong>Description:</strong> ${m.description}</p>
                    <p><strong>Reward:</strong> ¢ ${m.reward.toLocaleString()}</p>
                </div>
            `;
        } else {
            missionParamsHtml = `
                <div class="detail-section">
                    <h3>Mission Parameters</h3>
                    <p>No mission assigned</p>
                </div>
            `;
        }
        // Create modal for detailed ship view
        const modal = document.createElement('div');
        modal.className = 'ship-details-modal';
        modal.innerHTML = `
            <div class="ship-details-content">
                <div class="ship-details-header">
                    <h2>${ship.name} - Detailed Parameters</h2>
                    <button class="close-details-btn">×</button>
                </div>
                <div class="ship-details-body">
                    <div class="ship-details-image">
                        <img src="${assetManager.getImage(shipData.shipGlamShot)?.src || ''}" alt="${ship.name}">
                    </div>
                    <div class="ship-details-info">
                        <div class="detail-section">
                            <h3>Ship Information</h3>
                            <p><strong>Ship ID:</strong> ${ship.id}</p>
                            <p><strong>Ship Type:</strong> ${shipData.shipID}</p>
                            <p><strong>Ship Name:</strong> ${ship.name}</p>
                            <p><strong>Description:</strong> ${shipData.shipDescription || 'No description available'}</p>
                        </div>
                        ${missionParamsHtml}
                        <div class="detail-section">
                            <h3>Status & Condition</h3>
                            <p><strong>Health:</strong> ${ship.currentHealth}/${ship.maxHealth} (${Math.round((ship.currentHealth / ship.maxHealth) * 100)}%)</p>
                            <p><strong>Operational Status:</strong> ${ship.currentHealth > 0 ? 'Operational' : 'Disabled'}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Consumables</h3>
                            <p><strong>Fuel:</strong> ${ship.consumables?.fuel?.current || 0}/${ship.consumables?.fuel?.max || shipData.shipConsumables?.shipFuel?.max || 100}</p>
                            <p><strong>Oxygen:</strong> ${ship.consumables?.oxygen?.current || 100}/${ship.consumables?.oxygen?.max || shipData.shipConsumables?.shipOxygen?.max || 100}</p>
                            <p><strong>Electricity:</strong> ${ship.consumables?.electricity?.current || 100}/${ship.consumables?.electricity?.max || shipData.shipConsumables?.shipElectricity?.max || 100}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Specifications</h3>
                            <p><strong>Max Speed:</strong> ${shipData.shipMaxSpeed || 'N/A'} %LightSpeed</p>
                            <p><strong>Acceleration:</strong> ${shipData.shipThrustPower || 'N/A'} %LightSpeed</p>
                            <p><strong>Cargo Capacity:</strong> ${shipData.shipCargoCapacity || 0} m³</p>
                            <p><strong>Fuel Capacity:</strong> ${ship.consumables?.fuel?.max || shipData.shipConsumables?.shipFuel?.max || 100} units</p>
                        </div>
                        <div class="detail-section">
                            <h3>Upgrades</h3>
                            <p>${ship.upgrades && ship.upgrades.length > 0 ? ship.upgrades.join(', ') : 'No upgrades installed'}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Drop Ships</h3>
                            <p>${ship.equippedDropShips && ship.equippedDropShips.length > 0 ?
                ship.equippedDropShips.map(ds => ds.name).join(', ') : 'No drop ships equipped'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);

        // Add close handler
        modal.querySelector('.close-details-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    },

    handleShipAction(shipId, action) {
        console.log(`Ship action: ${action} for ship ${shipId}`);

        const ship = playerDataManager.data.fleet.find(s => s.id === shipId);
        if (!ship) {
            console.error(`Ship with ID ${shipId} not found`);
            return;
        }

        switch (action) {
            case 'dispatch':
                this.dispatchShip(ship);
                break;
            case 'jump_to':
                this.jumpToShip(ship);
                break;
            case 'disabled':
                // Ship is disabled, show repair message
                alert('This ship requires repairs before it can be operated.');
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    },

    dispatchShip(ship) {
        // Check if ship can be dispatched
        if (ship.currentHealth <= 0) {
            alert('Cannot dispatch a disabled ship. Repairs are required.');
            return;
        }

        const fuelLevel = ship.consumables?.fuel?.current || 0;
        const shipData = shipCatalogue[ship.shipTypeId];
        const maxFuel = ship.consumables?.fuel?.max || shipData?.shipConsumables?.shipFuel?.max || 100;

        if (fuelLevel < maxFuel * 0.1) {
            if (!confirm('Ship has low fuel. Dispatch anyway?')) {
                return;
            }
        }

        // Set ship as active and save its location as "dispatching from dock"
        // ENHANCED: Use dispatch-specific location for proper launch positioning (Task 3.6)
        this.setActiveShipAndLocation(ship, {
            type: 'space',
            x: 0, // Will be set by space scene to launch position (further from dock)
            y: 0,
            isDocked: false,
            isOrbitLocked: false,
            dispatchMode: 'launch'  // Mark this as a fresh launch for positioning logic
        });

        // Switch to space scene
        console.log(`Dispatching ship ${ship.name} (ID: ${ship.id})`);
        this.closeAndSwitchToSpace('dispatch');
    },

    jumpToShip(ship) {
        // Check if ship can be controlled
        if (ship.currentHealth <= 0) {
            alert('Cannot control a disabled ship. Repairs are required.');
            return;
        }

        if (!ship.location) {
            console.warn('Ship has no stored location, defaulting to docked');
            ship.location = { type: 'docked' };
        }

        // Set ship as active and maintain its current location
        this.setActiveShipAndLocation(ship, ship.location);

        // Switch to space scene
        console.log(`Jumping to ship ${ship.name} (ID: ${ship.id}) at location:`, ship.location);
        this.closeAndSwitchToSpace('jump_to');
    },

    setActiveShipAndLocation(ship, location) {
        // UPDATED: Use the FleetManager class for proper ship state management
        // This integrates with our new PlayerDataManager methods for consistency

        // First, update the ship's location in the fleet data
        // This ensures the ship's location is set before we switch to it
        playerDataManager.updateShipLocation(ship.id, location);

        // Use FleetManager's enhanced setActiveShip method
        // This automatically saves the current ship's state and switches to the new ship
        fleetManager.setActiveShip(ship.id);

        console.log(`Fleet Manager Scene: Switched to ship ${ship.name} (ID: ${ship.id})`);
        // NOTE: No need to manually save data - FleetManager methods handle saving automatically
    },

    saveCurrentShipState(shipId, spaceScene) {
        const ship = playerDataManager.data.fleet.find(s => s.id === shipId);
        if (!ship || !spaceScene.ship) return;

        // Save ship's current state in space
        ship.location = {
            type: 'space',
            x: spaceScene.ship.x,
            y: spaceScene.ship.y,
            velX: spaceScene.ship.velX || 0,
            velY: spaceScene.ship.velY || 0,
            angle: spaceScene.ship.angle || 0,
            isDocked: spaceScene.ship.isDocked || false,
            isOrbitLocked: spaceScene.ship.isOrbitLocked || false
        };

        // If orbiting, save planet info
        if (spaceScene.ship.isOrbitLocked && spaceScene.ship.orbitingPlanet) {
            ship.location.type = 'orbit';
            ship.location.planetName = spaceScene.ship.orbitingPlanet.name;
            ship.location.orbitData = {
                planetIndex: spaceScene.ship.orbitingPlanet.index,
                orbitRadius: spaceScene.ship.orbitRadius,
                orbitAngle: spaceScene.ship.orbitAngle
            };
        }

        // If docked, save dock info
        if (spaceScene.ship.isDocked) {
            ship.location.type = 'docked';
        }

        console.log(`Saved state for ship ${shipId}:`, ship.location);
    },

    closeAndSwitchToSpace(mode) {
        // Store the dispatch/jump mode for space scene to use
        gameManager.fleetDispatchMode = mode;

        // Clear fleet list content immediately for clean holo effect
        const fleetList = document.getElementById('fleet-list');
        if (fleetList) {
            fleetList.innerHTML = '';
        }

        // Close fleet manager with animation
        const fleetManager = document.getElementById('fleet-manager');
        fleetManager.classList.remove('clip-reveal');
        fleetManager.classList.add('clip-close');

        setTimeout(() => {
            // Create space scene with fleet dispatch settings
            gameManager.switchScene(gameManager.getSpaceScene(), {
                fromFleetManager: true,
                dispatchMode: mode
            });
        }, 800); // Match the clip-close animation duration
    },

    handleCloseFleetManager() {
        if (gameManager.activeScene === fleetManagerScene) {
            // Clear fleet list content immediately for clean holo effect
            const fleetList = document.getElementById('fleet-list');
            if (fleetList) {
                fleetList.innerHTML = '';
            }

            const fleetManager = document.getElementById('fleet-manager');
            fleetManager.classList.remove('clip-reveal');
            fleetManager.classList.add('clip-close');

            setTimeout(() => {
                gameManager.switchScene(spaceDockScene);
            }, 800); // Match the clip-close animation duration
        }
    },

    stop() {
        // We will no longer hide the board here directly.
        // The animation will handle it.
        console.log("Stopping Fleet Manager Scene...");

        // Remove Accept Trade and Close listeners
        //if (this._tradeList) {
        //    this._tradeList.removeEventListener('click', this.handleAcceptTrade);
        //}
        if (this._fleetList && this.boundHandleFleetClick) {
            this._fleetList.removeEventListener('click', this.boundHandleFleetClick);
            this.boundHandleFleetClick = null; // Clean up reference
        }
        if (this._closeBtn) {
            this._closeBtn.removeEventListener('click', this.handleCloseFleetManager);
        }

        // Clear fleet list content to prevent old content from showing on next opening
        const fleetList = document.getElementById('fleet-list');
        if (fleetList) {
            fleetList.innerHTML = '';
        }

        const fleetManager = document.getElementById('fleet-manager');
        fleetManager.style.display = 'none';
        //tradeHub.classList.remove('slide-in', 'slide-out');
    },

    update() {
        // This scene is static, so there's nothing to update each frame.
    },

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the background image for the fleet manager.
        const fleetManagerBg = assetManager.getImage('fleet_manager');
        const holodeskOverlay = assetManager.getImage('holodesk_overlay');

        if (fleetManagerBg && fleetManagerBg.complete) {
            ctx.drawImage(fleetManagerBg, 0, 0, canvas.width, canvas.height);
        }
        if (holodeskOverlay && holodeskOverlay.complete) {
            ctx.drawImage(holodeskOverlay, (canvas.width - 600)/2, canvas.height - 700, 600, 700);
        }
    },

    handleKeys(e, isDown) {
        // Handle any keyboard input for the fleet manager
        if (isDown && e.key === 'Escape') {
            // Example: ESC key returns to space dock
            this.handleCloseFleetManager();
        }
    },

};