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
        
        // Count total assets
        this.loadingStatus.total = Object.keys(assetCatalogue.images).length + 
                                   Object.keys(assetCatalogue.sounds).length;
        this.loadingStatus.loaded = 0;
        this.loadingStatus.failed = 0;

        console.log(`AssetManager: Starting to load ${this.loadingStatus.total} assets...`);

        // Load images
        Object.entries(assetCatalogue.images).forEach(([key, path]) => {
            this.loadImage(key, path);
        });

        // Load sounds
        Object.entries(assetCatalogue.sounds).forEach(([key, path]) => {
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
        
        audio.oncanplaythrough = () => {
            this.loadedAssets.sounds[key] = audio;
            this.onAssetLoaded(`Sound: ${key}`);
        };
        
        audio.onerror = () => {
            console.warn(`Failed to load sound: ${key} from ${path}`);
            this.onAssetFailed(`Sound: ${key}`);
        };
        
        audio.src = path;
        audio.load(); // Explicitly load the audio
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