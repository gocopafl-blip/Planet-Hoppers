// scripts/managers/music_manager.js

function createSound(assetKey, loop = false, volume = 1.0) {
    const sound = assetManager.getSound(assetKey);
    if (!sound) {
        console.error(`AssetManager: Sound asset not found for key: ${assetKey}`);
        return null;
    }
    // Consider already-ready audio as loaded immediately
    sound.isLoaded = sound.readyState >= 3; // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4)
    // If it wasn't ready yet, mark loaded on first readiness event
    const markLoaded = () => {
        if (!sound.isLoaded) {
            sound.isLoaded = true;
            console.log(`Sound loaded: ${assetKey}`);
        }
    };
    sound.addEventListener('canplaythrough', markLoaded, { once: true });
    sound.addEventListener('loadeddata', markLoaded, { once: true });
    sound.addEventListener('error', (e) => {
        console.error(`Failed to load sound: ${assetKey}`, e);
        sound.isLoaded = false;
    });
    sound.loop = loop;
    sound.volume = volume;
    return sound;
}

//Music Manager Class ---
class MusicManager {
    constructor() {
        // Define all music tracks, organized by scene
        this.playlists = {
            menu: [
                { src: 'music_menu', volume: 0.3 }
            ],
            space: [
                { src: 'music_bold', volume: 0.3 },
                { src: 'music_prospect', volume: 0.3 },
                { src: 'music_mystery', volume: 0.3 },
                { src: 'music_trek', volume: 0.3 },
            ],
            lander: [
                { src: 'music_battle', volume: 0.5 },
                // { src: 'music_lander_calm', volume: 0.5 }
            ]
        };

        this.audioTracks = {}; // To store the created Audio objects
        this.currentTrack = null;
        this.currentPlaylist = [];
        this.currentTrackIndex = 0;
        this.isMuted = false; // Track mute state
        // Do not preload immediately; assets may not be loaded yet.
    }

    preloadAll() {
        for (const scene in this.playlists) {
            this.playlists[scene].forEach(trackData => {
                if (!this.audioTracks[trackData.src]) {
                    const audio = createSound(trackData.src, false, trackData.volume); // Music never loops individually
                    if (!audio) return; // Asset not ready yet
                    // Add listener to play the next track when one ends
                    audio.addEventListener('ended', () => this.playNextTrack());
                    this.audioTracks[trackData.src] = audio;
                }
            });
        }
    }

    // Ensure an audio track for the key exists by pulling from AssetManager when ready
    ensureTrackLoaded(assetKey) {
        if (this.audioTracks[assetKey]) return true;
        const audio = createSound(assetKey, false, this.getConfiguredVolume(assetKey));
        if (!audio) return false;
        audio.addEventListener('ended', () => this.playNextTrack());
        this.audioTracks[assetKey] = audio;
        return true;
    }

    getConfiguredVolume(assetKey) {
        for (const scene in this.playlists) {
            const track = this.playlists[scene].find(t => t.src === assetKey);
            if (track) return track.volume;
        }
        return 0.3;
    }

    playPlaylistForScene(sceneName) {
        if (!this.playlists[sceneName] || this.playlists[sceneName].length === 0) {
            console.warn(`No playlist found for scene: ${sceneName}`);
            this.stop();
            return;
        }

        const newPlaylist = this.playlists[sceneName].map(t => t.src);

        // Don't restart if it's the same playlist
        if (JSON.stringify(newPlaylist) === JSON.stringify(this.currentPlaylist)) {
            return;
        }

        this.stop(); // Stop any currently playing music
        this.currentPlaylist = newPlaylist;
        this.currentTrackIndex = 0;
        this.playCurrentTrack();
    }

    playCurrentTrack() {
        if (this.currentPlaylist.length > 0) {
            const trackSrc = this.currentPlaylist[this.currentTrackIndex];
            if (!this.ensureTrackLoaded(trackSrc)) {
                console.warn(`MusicManager: Track '${trackSrc}' not ready yet.`);
                return;
            }
            this.currentTrack = this.audioTracks[trackSrc];
            const isReady = this.currentTrack && (this.currentTrack.isLoaded || this.currentTrack.readyState >= 3);
            if (isReady) {
                this.currentTrack.currentTime = 0;
                // Set volume based on mute state before playing
                this.currentTrack.volume = this.isMuted ? 0 : this.getCurrentTrackVolume();
                this.currentTrack.play().catch(e => console.error("Music play failed:", e));
            } else if (this.currentTrack) {
                // If not loaded, wait for it to load
                const tryPlay = () => {
                    // Set volume based on mute state before playing
                    this.currentTrack.volume = this.isMuted ? 0 : this.getCurrentTrackVolume();
                    this.currentTrack.play().catch(e => console.error("Music play failed:", e));
                };
                this.currentTrack.addEventListener('canplaythrough', tryPlay, { once: true });
                this.currentTrack.addEventListener('loadeddata', tryPlay, { once: true });
            }
        }
    }

    playNextTrack() {
        this.currentTrackIndex++;
        // If we've reached the end of the playlist, loop back to the start
        if (this.currentTrackIndex >= this.currentPlaylist.length) {
            this.currentTrackIndex = 0;
        }
        this.playCurrentTrack();
    }

    stop() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
            this.currentTrack = null;
            this.currentPlaylist = [];
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.currentTrack) {
            this.currentTrack.volume = this.isMuted ? 0 : this.getCurrentTrackVolume();
        }

        console.log(`Music ${this.isMuted ? 'muted' : 'unmuted'}`);
        return this.isMuted;
    }

    getCurrentTrackVolume() {
        // Get the original volume for the current track
        const trackSrc = this.currentPlaylist[this.currentTrackIndex];
        for (const scene in this.playlists) {
            const track = this.playlists[scene].find(t => t.src === trackSrc);
            if (track) return track.volume;
        }
        return 0.3; // Default fallback
    }
}


// Create a single instance of the MusicManager and expose it globally
const musicManager = new MusicManager();
window.musicManager = musicManager;

// --- Sound Effects ---
// Initialize SFX after assets are loaded to avoid null references
let thrusterSound;
let explosionSound;
let airlockSound;
let airlockSoundPlayed = false;

function initializeSfx() {
    thrusterSound = createSound('thruster', true, 0.5);
    explosionSound = createSound('explosion', false, 0.7);
    airlockSound = createSound('airlock', false, 0.7);
}
window.initializeSfx = initializeSfx;
