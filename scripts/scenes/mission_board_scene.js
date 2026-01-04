// scripts/scenes/mission_board_scene.js

const missionBoardScene = {
    name: 'menu', // We can reuse the menu music

    start(settings) {
        console.log("Starting Mission Board Scene...");
        // This scene just shows a background. The mission board UI is a separate HTML element.
        canvas.style.display = 'block';
        const missionBoard = document.getElementById('mission-board');

        // Make sure it's visible before the animation starts
        missionBoard.style.display = 'flex';

        // Remove any old animation classes
        missionBoard.classList.remove('slide-out');

        // Add a delay before showing the missions and animating
        setTimeout(() => {
            this.showMissionBoard();
            missionBoard.classList.add('slide-in');
        }, 500); // A 0.5 second delay

        // Add Accept Mission and Close listeners
        this._missionList = document.getElementById('mission-list');
        this._closeBtn = document.getElementById('closeMissionBoardBtn');
        // Ship assignment modal elements (Task 5.4)
        this._shipAssignmentModal = document.getElementById('ship-assignment-modal');
        this._shipAssignmentList = document.getElementById('ship-assignment-list');
        this._shipAssignmentConfirm = document.getElementById('ship-assignment-confirm');
        this._shipAssignmentCancel = document.getElementById('ship-assignment-cancel');
        this._shipAssignmentClose = document.getElementById('closeShipAssignmentModalBtn');
        // Internal selection state (Task 5.5)
        this._selectedShipId = null;
        if (this._missionList) {
            this._missionList.addEventListener('click', this.handleAcceptMission);
        }
        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', this.handleCloseMissionBoard);
        }

        // Attach modal close/cancel handlers
        if (this._shipAssignmentCancel) {
            this.boundHandleCancelAssign = this.handleCancelAssign.bind(this);
            this._shipAssignmentCancel.addEventListener('click', this.boundHandleCancelAssign);
        }
        if (this._shipAssignmentClose) {
            this.boundHandleCancelAssignX = this.handleCancelAssign.bind(this);
            this._shipAssignmentClose.addEventListener('click', this.boundHandleCancelAssignX);
        }
        // Attach modal list click handler (Task 5.5)
        if (this._shipAssignmentList) {
            this.boundHandleShipListClick = this.handleShipListClick.bind(this);
            this._shipAssignmentList.addEventListener('click', this.boundHandleShipListClick);
        }
        // Attach confirm handler (Task 5.5)
        if (this._shipAssignmentConfirm) {
            this.boundHandleConfirmAssign = this.handleConfirmAssign.bind(this);
            this._shipAssignmentConfirm.addEventListener('click', this.boundHandleConfirmAssign);
        }
    },

    stop() {
        // We will no longer hide the board here directly.
        // The animation will handle it.
        console.log("Stopping Mission Board Scene...");

        // Remove Accept Mission and Close listeners
        if (this._missionList) {
            this._missionList.removeEventListener('click', this.handleAcceptMission);
        }
        if (this._closeBtn) {
            this._closeBtn.removeEventListener('click', this.handleCloseMissionBoard);
        }
        if (this._shipAssignmentCancel && this.boundHandleCancelAssign) {
            this._shipAssignmentCancel.removeEventListener('click', this.boundHandleCancelAssign);
        }
        if (this._shipAssignmentClose && this.boundHandleCancelAssignX) {
            this._shipAssignmentClose.removeEventListener('click', this.boundHandleCancelAssignX);
        }
        if (this._shipAssignmentList && this.boundHandleShipListClick) {
            this._shipAssignmentList.removeEventListener('click', this.boundHandleShipListClick);
        }
        if (this._shipAssignmentConfirm && this.boundHandleConfirmAssign) {
            this._shipAssignmentConfirm.removeEventListener('click', this.boundHandleConfirmAssign);
        }
    },

    handleAcceptMission(event) {
        if (event.target.classList.contains('accept-btn')) {
            const missionId = event.target.dataset.missionId;
            // Populate and show the ship assignment modal instead of accepting directly (Task 5.4)
            missionBoardScene.populateShipAssignmentList();
            if (missionBoardScene._shipAssignmentModal) {
                missionBoardScene._shipAssignmentModal.style.display = 'flex';
                missionBoardScene._shipAssignmentModal.dataset.missionId = missionId;
            }
            // Hide the mission board while modal is open
            const missionBoard = document.getElementById('mission-board');
            if (missionBoard) missionBoard.style.display = 'none';
        }
    },

    handleCloseMissionBoard() {
        if (gameManager.activeScene === missionBoardScene) {
            const missionBoard = document.getElementById('mission-board');
            missionBoard.classList.remove('slide-in');
            missionBoard.classList.add('slide-out');

            setTimeout(() => {
                gameManager.switchScene(spaceDockScene);
            }, 500);
        }
    },

    // Task 5.4: Populate ship assignment modal with available ships (unassigned)
    populateShipAssignmentList() {
        if (!this._shipAssignmentList) return;
        // Reset selection state each time modal opens
        this._selectedShipId = null;
        const availableShips = playerDataManager.getAvailableShips ? playerDataManager.getAvailableShips() : [];
        this._shipAssignmentList.innerHTML = '';

        if (!availableShips || availableShips.length === 0) {
            const msg = document.createElement('p');
            msg.style.color = '#fff';
            msg.style.textAlign = 'center';
            msg.style.margin = '20px 0';
            msg.textContent = 'No available ships for assignment.';
            this._shipAssignmentList.appendChild(msg);
            if (this._shipAssignmentConfirm) this._shipAssignmentConfirm.disabled = true;
            return;
        }

        if (this._shipAssignmentConfirm) this._shipAssignmentConfirm.disabled = true; // Enable in 5.5 upon selection

        availableShips.forEach((ship) => {
            const shipData = shipCatalogue[ship.shipTypeId];
            if (!shipData) return;
            const glamShotImage = assetManager.getImage(shipData.shipGlamShot);
            const imageSrc = glamShotImage ? glamShotImage.src : '';

            // Derive status and location similarly to fleet manager
            let status = 'Ready for Dispatch';
            let location = 'Docked at Station';
            if (ship.location) {
                switch (ship.location.type) {
                    case 'orbit':
                        location = `Orbiting ${ship.location.planetName || 'Unknown Planet'}`;
                        status = 'In Stable Orbit';
                        break;
                    case 'space':
                        location = `Deep Space (${Math.round(ship.location.x)}, ${Math.round(ship.location.y)})`;
                        status = 'Awaiting Orders';
                        break;
                    case 'docked':
                    default:
                        location = 'Docked at Station';
                        status = 'Ready for Dispatch';
                }
            }

            const container = document.createElement('div');
            container.className = 'assignment-ship-container';
            container.dataset.shipId = ship.id;
            container.innerHTML = `
                <img class="assignment-ship-image" src="${imageSrc}" alt="${ship.name}">
                <div class="assignment-ship-info">
                    <h3>${shipData.shipID} (ID: ${ship.name})</h3>
                    <p class="ship-status">Status: ${status}</p>
                    <p class="ship-location">Location: ${location}</p>
                    <div class="ship-stats">
                        <span>Health: ${ship.currentHealth}/${ship.maxHealth}</span>
                        <span>Fuel: ${ship.consumables?.fuel?.current || 0}/${ship.consumables?.fuel?.max || shipData.shipConsumables?.shipFuel?.max || 100}</span>
                    </div>
                </div>
            `;
            this._shipAssignmentList.appendChild(container);
        });
    },

    // Close/cancel simply hides modal and re-shows mission board
    handleCancelAssign() {
        const modal = missionBoardScene._shipAssignmentModal;
        if (modal) {
            modal.style.display = 'none';
            modal.dataset.missionId = '';
        }
        const missionBoard = document.getElementById('mission-board');
        if (missionBoard) missionBoard.style.display = 'flex';
    },

    // Task 5.5: Handle clicks in the ship list to select a ship
    handleShipListClick(event) {
        const item = event.target.closest('.assignment-ship-container');
        if (!item) return;
        // Clear previous selection
        const prev = missionBoardScene._shipAssignmentList.querySelector('.assignment-ship-container.selected');
        if (prev) prev.classList.remove('selected');
        // Mark new selection
        item.classList.add('selected');
        missionBoardScene._selectedShipId = parseInt(item.dataset.shipId);
        if (missionBoardScene._shipAssignmentConfirm) missionBoardScene._shipAssignmentConfirm.disabled = false;
    },

    // Task 5.5: Confirm assignment to selected ship
    handleConfirmAssign() {
        const shipId = missionBoardScene._selectedShipId;
        const modal = missionBoardScene._shipAssignmentModal;
        const missionId = modal ? modal.dataset.missionId : null;
        if (!shipId || !missionId) return;

        // Assign mission to the chosen ship using PlayerDataManager
        if (typeof playerDataManager.assignMissionToShip === 'function') {
            playerDataManager.assignMissionToShip(shipId, missionId, {});
            console.log('[MissionBoard] Assigned mission to ship', { shipId, missionId });
            const assignedShip = playerDataManager.getShipById ? playerDataManager.getShipById(shipId) : null;
            if (assignedShip) console.log('[MissionBoard] Ship state after assign', { assignedMissionId: assignedShip.assignedMissionId });
        }
        // NOTE: Legacy global mission set is disabled in per-ship flow
        // if (typeof playerDataManager.setActiveMissionId === 'function') {
        //     playerDataManager.setActiveMissionId(missionId);
        // }
        console.log('[MissionBoard] Skipped legacy setActiveMissionId in favor of per-ship assignments');

        // Close modal and return to mission board
        missionBoardScene.handleCancelAssign();
        console.log(`Mission ${missionId} assigned to ship ${shipId}`);
    },


    showMissionBoard() {
        const missionBoard = document.getElementById('mission-board');
        const missionList = document.getElementById('mission-list');

        const missions = missionManager.generateAvailableMissions(5);
        missionList.innerHTML = '';

        missions.forEach(mission => {
            const missionElement = document.createElement('div');
            missionElement.className = 'mission-item';
            missionElement.innerHTML = `
                <h3>${mission.title}</h3>
                <p>${mission.description}</p>
                <div class="mission-footer">
                    <span class="mission-reward">REWARD: ¢ ${mission.reward.toLocaleString()}</span>
                    <button class="accept-btn" data-mission-id="${mission.id}">Accept</button>
                </div>
            `;
            missionList.appendChild(missionElement);
        });

        missionBoard.style.display = 'flex';
    },

    update() {
        // This scene is static, so there's nothing to update each frame.
    },

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the background image for the mission board.
        const missionBoardBg = assetManager.getImage('mission_board_bg');
        if (missionBoardBg && missionBoardBg.complete) {
            ctx.drawImage(missionBoardBg, 0, 0, canvas.width, canvas.height);
        }
    },
};