// scripts/managers/music_manager.js

function createSound(src, loop = false, volume = 1.0) {
    const sound = new Audio(ASSET_BASE_URL + src);
    sound.isLoaded = false;
    sound.addEventListener('canplaythrough', () => {
        sound.isLoaded = true;
        console.log(`Sound loaded: ${src}`);
    });
    sound.addEventListener('error', (e) => {
        console.error(`Failed to load sound: ${src}`, e);
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
                { src: 'sounds/music_menu.mp3', volume: 0.3 }
            ],
            space: [
                { src: 'sounds/music_bold_brave.mp3', volume: 0.3 }, // Placeholder for your new music
                { src: 'sounds/music_prospect_determined.mp3', volume: 0.3 },
                { src: 'sounds/music_dark_mystery.mp3', volume: 0.3 },
                { src: 'sounds/music_trek.mp3', volume: 0.3 },  // Add as many as you like
            ],
            lander: [
                { src: 'sounds/music_battle_tense.mp3', volume: 0.5 }, // Tense lander music
               // { src: 'sounds/music_lander_calm.mp3', volume: 0.5 }
            ]
        };

        this.audioTracks = {}; // To store the created Audio objects
        this.currentTrack = null;
        this.currentPlaylist = [];
        this.currentTrackIndex = 0;
        this.isMuted = false; // Track mute state

        // Preload all music files
        this.preloadAll();
    }

    preloadAll() {
        for (const scene in this.playlists) {
            this.playlists[scene].forEach(trackData => {
                if (!this.audioTracks[trackData.src]) {
                    const audio = createSound(trackData.src, false, trackData.volume); // Music never loops individually
                    // Add listener to play the next track when one ends
                    audio.addEventListener('ended', () => this.playNextTrack());
                    this.audioTracks[trackData.src] = audio;
                }
            });
        }
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
            this.currentTrack = this.audioTracks[trackSrc];
            if (this.currentTrack && this.currentTrack.isLoaded) {
                this.currentTrack.currentTime = 0;
                // Set volume based on mute state before playing
                this.currentTrack.volume = this.isMuted ? 0 : this.getCurrentTrackVolume();
                this.currentTrack.play().catch(e => console.error("Music play failed:", e));
            } else if (this.currentTrack) {
                // If not loaded, wait for it to load
                this.currentTrack.addEventListener('canplaythrough', () => {
                    // Set volume based on mute state before playing
                    this.currentTrack.volume = this.isMuted ? 0 : this.getCurrentTrackVolume();
                    this.currentTrack.play().catch(e => console.error("Music play failed:", e));
                }, { once: true });
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


// Create a single instance of the MusicManager
const musicManager = new MusicManager();

// --- Sound Effects ---
const thrusterSound = createSound('sounds/thruster.mp3', true, 0.5);
const explosionSound = createSound('sounds/explosion.mp3', false, 0.7);
const airlockSound = createSound('sounds/airlock.mp3', false, 0.7);
let airlockSoundPlayed = false;
