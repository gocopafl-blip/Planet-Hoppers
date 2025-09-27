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

        canvas.style.display = 'block';
    },

    stop() {
        // This function will be called when we leave the scene
        console.log("Stopping SpaceDock Scene...");
        document.getElementById('dock-ui').style.display = 'none';
        document.getElementById('mission-board').style.display = 'none';
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

