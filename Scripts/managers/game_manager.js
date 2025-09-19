// scripts/managers/game_manager.js

const gameManager = {
    activeScene: null,
    loop() {
        if (this.activeScene) {
            this.activeScene.update();
            this.activeScene.draw();
        }
        requestAnimationFrame(this.loop.bind(this));
    },
    switchScene(scene, newSettings = {}) {
        if (this.activeScene?.stop) { this.activeScene.stop(); }
        Object.assign(settings, newSettings);
        this.activeScene = scene;
        musicManager.playPlaylistForScene(scene.name || 'menu');
        scene.start(settings);
    }
};
