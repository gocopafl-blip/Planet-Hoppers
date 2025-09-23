// --- Camera Class ---
class Camera {
    constructor(target, worldWidth, worldHeight, settings = {}) {
        this.target = target;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        this.x = target ? target.x : 0;
        this.y = target ? target.y : 0;
        this.zoomLevel = 1.0;
        this.targetZoom = 1.0; // The zoom level we are smoothly moving towards
        this.isManualZooming = false;
        this.manualZoomTimer = 0;

        // Apply settings with defaults using nullish coalescing
        this.zoomSmoothing = settings.zoomSmoothing ?? 0.05;
        this.followSmoothing = settings.followSmoothing ?? 0.1;
    }

    update() {
        // Smoothly move the camera towards the target (lerp)
        if (this.target) {
            this.x += (this.target.x - this.x) * this.followSmoothing;
            this.y += (this.target.y - this.y) * this.followSmoothing;
        }
        // Smoothly adjust the zoom level
        if (!this.isManualZooming) {
            this.zoomLevel += (this.targetZoom - this.zoomLevel) * this.zoomSmoothing;
        }
    }

    begin(ctx) {
        ctx.save();

        const viewWidth = canvas.width / this.zoomLevel;
        const viewHeight = canvas.height / this.zoomLevel;

        const minCameraX = viewWidth / 2;
        const maxCameraX = this.worldWidth - viewWidth / 2;
        const minCameraY = viewHeight / 2;
        const maxCameraY = this.worldHeight - viewHeight / 2;

        let cameraX = Math.max(minCameraX, Math.min(this.x, maxCameraX));
        let cameraY = Math.max(minCameraY, Math.min(this.y, maxCameraY));

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.translate(-cameraX, -cameraY);
    }

    end(ctx) {
        ctx.restore();
    }
}
