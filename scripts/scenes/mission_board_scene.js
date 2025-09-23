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
    },

    stop() {
        // We will no longer hide the board here directly.
        // The animation will handle it.
        console.log("Stopping Mission Board Scene...");
    },

    showMissionBoard() {
        const missionBoard = document.getElementById('mission-board');
        const missionList = document.getElementById('mission-list');

        const missions = missionManager.generateAvailableMissions(3);
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
        if (missionBoardBackgroundImage.complete) {
            ctx.drawImage(missionBoardBackgroundImage, 0, 0, canvas.width, canvas.height);
        }
    }
};