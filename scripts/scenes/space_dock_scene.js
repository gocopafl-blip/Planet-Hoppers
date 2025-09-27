const spaceDockScene = {
    name: 'menu', // We can reuse the menu music for now

    start(settings) {
        console.log("Starting SpaceDock Scene...");
        // Hide other UI elements and show the ones for this scene
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        descentUI.style.display = 'none';
        //zoomControls.style.display = 'none';
        document.getElementById('dock-ui').style.display = 'block';
        this.updateCargoManifest();
        canvas.style.display = 'block';
    },

    stop() {
        // This function will be called when we leave the scene
        console.log("Stopping SpaceDock Scene...");
        document.getElementById('dock-ui').style.display = 'none';
        document.getElementById('mission-board').style.display = 'none';
    },

    updateCargoManifest() {
        // 1. Find the list element in our HTML.
        const cargoListElement = document.getElementById('cargo-list');

        // 2. Get the player's ship and its cargo hold.
        const activeShip = playerDataManager.getActiveShip();
        if (!activeShip) return; // Safety check in case there's no ship

        console.log('UPDATING MANIFEST. Reading hold:', activeShip.cargoHold);

        // 3. Clear out any old items from the list.
        cargoListElement.innerHTML = '';

        // 4. Check if the cargo hold is empty.
        if (activeShip.cargoHold.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Hold is empty.';
            cargoListElement.appendChild(emptyMessage);
        } else {
            // 5. Loop through each item in the cargo hold.
            for (const item of activeShip.cargoHold) {
                // Look up the item's full details in our catalogue.
                const itemDetails = cargoCatalogue[item.id];
                if (itemDetails) {
                    // Create a new list item element (<li>).
                    const listItem = document.createElement('li');

                    // Set the text of the list item.
                    listItem.textContent = `${itemDetails.name} (Size: ${itemDetails.size})`;

                    // Add the new item to the list on the screen.
                    cargoListElement.appendChild(listItem);
                }
            }
        }
    },
    /*showMissionBoard() {
        const missionBoard = document.getElementById('mission-board');
        const missionList = document.getElementById('mission-list');

        // 1. Generate a fresh list of missions
        const missions = missionManager.generateAvailableMissions(3); // Get 3 missions

        // 2. Clear out the old list from the display
        missionList.innerHTML = '';

        // 3. Create and add the HTML for each new mission
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

        // 4. Finally, show the mission board
        missionBoard.style.display = 'flex';
    },*/

    update() {
        // Nothing is moving yet, so this is empty for now.
    },

    draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the background image, covering the whole canvas
        if (spaceDockTerminalImage.isLoaded || spaceDockTerminalImage.complete) {
            ctx.drawImage(spaceDockTerminalImage, 0, 0, canvas.width, canvas.height);
        }
    },

    handleKeys(e, isDown) {
        // We will use this later for keyboard shortcuts.
    }
};

