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
            this._fleetList.addEventListener('click', this.handleFleetClick.bind(this));
        }
    
        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this.handleCloseFleetManager);
        }
    },

    showFleetManager() {
        const fleetManager = document.getElementById('fleet-manager');
        // Display is already set in start(), no need to repeat
        //fleetManager.classList.add('slide-in'); // Alternative: slides in from bottom
        fleetManager.classList.add('clip-reveal'); // Expanding chamfer effect
        
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

                // Determine ship status and location
                let status = 'Ready for Dispatch';
                let location = 'Docked';
                let actionText = 'Dispatch';
                let actionType = 'dispatch';
                
                if (ship.id === activeShipId) {
                    status = 'Currently Under Remote Command';
                    actionText = 'Jump To';
                    actionType = 'jump_to';
                    
                    // Check if we have saved state for current ship in space scene
                    // Use gameManager.activeScene to access the space scene properly
                    const currentSpaceScene = gameManager.activeScene;
                    if (currentSpaceScene && currentSpaceScene.name === 'space' && currentSpaceScene.savedState) {
                        location = `Deep Space (${Math.round(currentSpaceScene.savedState.shipX)}, ${Math.round(currentSpaceScene.savedState.shipY)})`;
                        status = 'Active in Deep Space';
                    } else if (currentSpaceScene && currentSpaceScene.name === 'space') {
                        if (currentSpaceScene.ship && currentSpaceScene.ship.isDocked) {
                            location = 'Docked at Station';
                            status = 'Ready for Dispatch';
                            actionText = 'Dispatch';
                            actionType = 'dispatch';
                        } else if (currentSpaceScene.ship && currentSpaceScene.ship.isOrbitLocked) {
                            const planetName = currentSpaceScene.ship.orbitingPlanet ? currentSpaceScene.ship.orbitingPlanet.name : 'Unknown Planet';
                            location = `Orbiting ${planetName}`;
                            status = 'In Stable Orbit';
                            actionText = 'Jump To';
                            actionType = 'jump_to';
                        } else {
                            location = 'Deep Space';
                            status = 'Active in Deep Space';
                            actionText = 'Jump To';
                            actionType = 'jump_to';
                        }
                    }
                } else {
                    // For non-active ships, check their stored state
                    if (ship.location) {
                        if (ship.location.type === 'docked') {
                            location = 'Docked at Station';
                            status = 'Ready for Dispatch';
                            actionText = 'Dispatch';
                            actionType = 'dispatch';
                        } else if (ship.location.type === 'orbit') {
                            location = `Orbiting ${ship.location.planetName || 'Unknown Planet'}`;
                            status = 'In Stable Orbit';
                            actionText = 'Jump To';
                            actionType = 'jump_to';
                        } else if (ship.location.type === 'space') {
                            location = `Deep Space (${Math.round(ship.location.x)}, ${Math.round(ship.location.y)})`;
                            status = 'Awaiting Orders';
                            actionText = 'Jump To';
                            actionType = 'jump_to';
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
                    const maxFuel = shipData.shipFuelCapacity || 100;
                    if (currentFuel < maxFuel * 0.1) {
                        status = 'Low Fuel - ' + status;
                    }
                }

                shipElement.innerHTML = `
                    <img class="fleet-ship-image" src="${imageSrc}" alt="${ship.name}">
                    
                    <div class="fleet-ship-info">
                        <h3>${ship.name} (ID: ${ship.id})</h3>
                        <p class="ship-status">Status: ${status}</p>
                        <p class="ship-location">Location: ${location}</p>
                        <div class="ship-stats">
                            <span>Health: ${ship.currentHealth}/${ship.maxHealth}</span>
                            <span>Fuel: ${ship.consumables?.fuel?.current || 0}/${shipData.shipFuelCapacity || 100}</span>
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

        fleetManager.style.display = 'flex';
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
                        <div class="detail-section">
                            <h3>Status & Condition</h3>
                            <p><strong>Health:</strong> ${ship.currentHealth}/${ship.maxHealth} (${Math.round((ship.currentHealth/ship.maxHealth)*100)}%)</p>
                            <p><strong>Operational Status:</strong> ${ship.currentHealth > 0 ? 'Operational' : 'Disabled'}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Consumables</h3>
                            <p><strong>Fuel:</strong> ${ship.consumables?.fuel?.current || 0}/${shipData.shipFuelCapacity || 100}</p>
                            <p><strong>Oxygen:</strong> ${ship.consumables?.oxygen?.current || 100}/100</p>
                            <p><strong>Electricity:</strong> ${ship.consumables?.electricity?.current || 100}/100</p>
                        </div>
                        <div class="detail-section">
                            <h3>Specifications</h3>
                            <p><strong>Max Speed:</strong> ${shipData.shipMaxSpeed || 'N/A'} %LightSpeed</p>
                            <p><strong>Acceleration:</strong> ${shipData.shipThrustPower || 'N/A'} %LightSpeed</p>
                            <p><strong>Cargo Capacity:</strong> ${shipData.shipCargoCapacity || 0} m³</p>
                            <p><strong>Fuel Capacity:</strong> ${shipData.shipFuelCapacity || 100} units</p>
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
        
        switch(action) {
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
        const maxFuel = shipData?.shipFuelCapacity || 100;
        
        if (fuelLevel < maxFuel * 0.1) {
            if (!confirm('Ship has low fuel. Dispatch anyway?')) {
                return;
            }
        }
        
        // Set ship as active and save its location as "just outside dock"
        this.setActiveShipAndLocation(ship, {
            type: 'space',
            x: 0, // Will be set by space scene to just outside dock
            y: 0,
            isDocked: false,
            isOrbitLocked: false
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
        // Save current active ship state if switching from another ship
        const currentActiveId = playerDataManager.data.activeShipId;
        const currentScene = gameManager.activeScene;
        
        if (currentActiveId && currentActiveId !== ship.id && currentScene && currentScene.name === 'space') {
            // Save current space scene state for the previously active ship
            this.saveCurrentShipState(currentActiveId, currentScene);
        }
        
        // Set new active ship
        playerDataManager.data.activeShipId = ship.id;
        
        // Update ship location
        ship.location = location;
        
        // Save data
        playerDataManager.saveData();
        
        console.log(`Active ship changed to: ${ship.name} (ID: ${ship.id})`);
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
        if (this._fleetList) {
            this._fleetList.removeEventListener('click', this.handleFleetClick);
        }
        if (this._closeBtn) {
            this._closeBtn.removeEventListener('click', this.handleCloseFleetManager);
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
            ctx.drawImage(holodeskOverlay, 300, 0, 600, 700);
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