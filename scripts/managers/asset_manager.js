// scripts/managers/asset_manager.js
// Simple Asset Manager - Phase 1: Basic preloading

class AssetManager {
    constructor() {
        this.loadedAssets = {
            images: {},
            sounds: {}
        };
        this.loadingStatus = {
            total: 0,
            loaded: 0,
            failed: 0
        };
        this.onComplete = null;
        this.onProgress = null;
    }

    // Load all assets from the catalogue
    loadAllAssets(onComplete = null, onProgress = null) {
        this.onComplete = onComplete;
        this.onProgress = onProgress;
        
        // Determine which assets still need loading (idempotent behavior)
        const pendingImages = Object.entries(assetCatalogue.images)
            .filter(([key]) => !this.isImageLoaded(key));
        const pendingSounds = Object.entries(assetCatalogue.sounds)
            .filter(([key]) => !this.isSoundLoaded(key));

        // Count only pending assets
        this.loadingStatus.total = pendingImages.length + pendingSounds.length;
        this.loadingStatus.loaded = 0;
        this.loadingStatus.failed = 0;

        if (this.loadingStatus.total === 0) {
            // Nothing to load
            console.log("AssetManager: No pending assets to load.");
            if (this.onComplete) this.onComplete();
            return;
        }

        console.log(`AssetManager: Starting to load ${this.loadingStatus.total} assets...`);

        // Load only pending images
        pendingImages.forEach(([key, path]) => {
            this.loadImage(key, path);
        });

        // Load only pending sounds
        pendingSounds.forEach(([key, path]) => {
            this.loadSound(key, path);
        });
    }

    loadImage(key, path) {
        const img = new Image();
        
        img.onload = () => {
            this.loadedAssets.images[key] = img;
            this.onAssetLoaded(`Image: ${key}`);
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${key} from ${path}`);
            this.onAssetFailed(`Image: ${key}`);
        };
        
        img.src = path;
    }

    loadSound(key, path) {
        const audio = new Audio();

        let counted = false;
        const markLoaded = () => {
            if (counted) return;
            counted = true;
            this.loadedAssets.sounds[key] = audio;
            this.onAssetLoaded(`Sound: ${key}`);
        };

        audio.addEventListener('canplaythrough', markLoaded, { once: true });
        // Fallback in case canplaythrough behaves inconsistently
        audio.addEventListener('loadeddata', markLoaded, { once: true });

        audio.addEventListener('error', () => {
            console.warn(`Failed to load sound: ${key} from ${path}`);
            this.onAssetFailed(`Sound: ${key}`);
        }, { once: true });

        audio.preload = 'auto';
        audio.src = path;
        audio.load();
    }

    onAssetLoaded(assetName) {
        this.loadingStatus.loaded++;
        console.log(`Loaded: ${assetName} (${this.loadingStatus.loaded}/${this.loadingStatus.total})`);
        
        if (this.onProgress) {
            this.onProgress(this.loadingStatus.loaded, this.loadingStatus.total);
        }
        
        this.checkComplete();
    }

    onAssetFailed(assetName) {
        this.loadingStatus.failed++;
        console.error(`Failed: ${assetName} (${this.loadingStatus.failed} total failures)`);
        this.checkComplete();
    }

    checkComplete() {
        const totalProcessed = this.loadingStatus.loaded + this.loadingStatus.failed;
        if (totalProcessed >= this.loadingStatus.total) {
            console.log(`AssetManager: Loading complete! ${this.loadingStatus.loaded} loaded, ${this.loadingStatus.failed} failed`);
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    // Get a loaded asset
    getImage(key) {
        return this.loadedAssets.images[key] || null;
    }

    getSound(key) {
        return this.loadedAssets.sounds[key] || null;
    }

    // Check if an asset is loaded
    isImageLoaded(key) {
        return !!this.loadedAssets.images[key];
    }

    isSoundLoaded(key) {
        return !!this.loadedAssets.sounds[key];
    }

    // Get loading progress (0-1)
    getProgress() {
        if (this.loadingStatus.total === 0) return 1;
        return this.loadingStatus.loaded / this.loadingStatus.total;
    }
}

// Create global assetManager instance
const assetManager = new AssetManager();
// Expose globally so other scripts can access assets
window.assetManager = assetManager;