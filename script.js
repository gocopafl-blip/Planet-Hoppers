// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const menu = document.getElementById('menu');
const shipSelectionMenu = document.getElementById('ship-selection');

canvas.width = 1000;
canvas.height = 700;

// Base URL for assets from the GitHub repo
const ASSET_BASE_URL = 'https://raw.githubusercontent.com/gocopafl-blip/Planet-Hoppers/main/assets/';

// --- Asset Definitions ---
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

// --- NEW: Music Manager Class ---
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
                this.currentTrack.play().catch(e => console.error("Music play failed:", e));
            } else if (this.currentTrack) {
                // If not loaded, wait for it to load
                this.currentTrack.addEventListener('canplaythrough', () => {
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
}

// --- Create a single instance of the MusicManager ---
const musicManager = new MusicManager();

// --- Sound Effects (unchanged) ---
const thrusterSound = createSound('sounds/thruster.mp3', true, 0.5);
const explosionSound = createSound('sounds/explosion.mp3', false, 0.7);

const shipTypes = {
    scout:  { src: 'images/lander-scout.png',  width: 40,  height: 40,  img: new Image(), thrusterOffset: 20 },
    classic:{ src: 'images/lander-classic.png', width: 80,  height: 80,  img: new Image(), thrusterOffset: 40 },
    heavy:  { src: 'images/lander-heavy.png',   width: 160, height: 160, img: new Image(), thrusterOffset: 65 }
};
const spaceShipeImage = new Image();
const planetImages = [new Image(), new Image(), new Image()];
let celestialBodies = [];
let settings = {};

// --- Game Manager ---
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
        // Tell the music manager which scene is starting
        musicManager.playPlaylistForScene(scene.name || 'menu');
        scene.start(settings);
    }
};

// --- Camera Class ---
class Camera {
    constructor(target, worldWidth, worldHeight, settings = {}) {
        this.target = target;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        this.x = target ? target.x : 0;
        this.y = target ? target.y : 0;
        this.zoomLevel = 1.0;
        this.targetZoom = 1.0;

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
        this.zoomLevel += (this.targetZoom - this.zoomLevel) * this.zoomSmoothing;
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

// --- Space Scene ---
class SpaceScene {
    constructor() {
        // --- Scene State ---
        this.name = 'space'; // Give the scene a name for the MusicManager
        this.ship = null;
        this.stars = [];
        this.difficulty = 'easy';
        this.isPaused = false;
        this.camera = null;
        this.orbitData = null;

        // --- World Settings ---
        this.WORLD_WIDTH = canvas.width * 20;
        this.WORLD_HEIGHT = canvas.height * 20;

        // --- Core Movement Settings ---
        this.ROTATION_SPEED = 0.05;
        this.THRUST_POWER = 0.05;  // Reduced for finer orbital control

        // --- Orbital Mechanics Settings ---
        this.GRAVITY_BOUNDARY_MULTIPLIER = 3.0;  // Gravity well extends to 2x planet radius
        this.ORBITAL_CONSTANT = 0.00035;         // Reduced for more manageable orbital velocities
        this.PLANET_MASS_SCALAR = 0.4;           // Reduced mass to prevent excessive gravitational acceleration

        // --- Camera Settings ---
        this.minZoom = 0.3; // minZoom is now used to configure the camera
        this.maxZoom = 1.5;
        this.maxSpeedForZoom = 15;
        this.zoomSmoothing = 0.03;
    }

    Ship = class {
        constructor(x, y, game) {
            this.x = x; this.y = y; this.velX = 0; this.velY = 0;
            this.angle = -Math.PI / 2;
            this.rotation = 0; this.thrusting = false;
            this.width = 100; // Adjusted for better visibility
            this.height = 120;
            this.orbitLocked = false;
            this.orbitingPlanet = null;
            this.game = game; // Store reference to the game
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI / 2);
            ctx.drawImage(spaceShipeImage, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
        
        update() {
            this.angle += this.rotation;
            if (this.thrusting) {
                this.velX += this.game.THRUST_POWER * Math.cos(this.angle);
                this.velY += this.game.THRUST_POWER * Math.sin(this.angle);
            }
            // No drag in space - objects maintain velocity (Newton's First Law)
            this.x += this.velX; this.y += this.velY;
            // World boundary checks
            if (this.x < 0 || this.x > this.game.WORLD_WIDTH || this.y < 0 || this.y > this.game.WORLD_HEIGHT) {
                this.x = Math.max(0, Math.min(this.x, this.game.WORLD_WIDTH));
                this.y = Math.max(0, Math.min(this.y, this.game.WORLD_HEIGHT));
                this.velX = 0; this.velY = 0;
            }
        }
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 2000; i++) {
            this.stars.push({ x: Math.random() * this.WORLD_WIDTH, y: Math.random() * this.WORLD_HEIGHT, radius: Math.random() * 1.5 });
        }
    }

    calculatePlanetParameters(minRadius, maxRadius) {
        const radius = Math.random() * (maxRadius - minRadius) + minRadius;
        const mass = Math.pow(radius, 3) * this.PLANET_MASS_SCALAR; // Mass scales with volume
        return {
            radius,
            mass
        };
    }

    createPlanets() {
        celestialBodies = [];
        const numPlanets = 8;
        const minDistance = 400; 
        let attempts = 0; 
        const minRadius = 200;  // Allows for smaller planets
        const maxRadius = 500; // Allows for larger planets

        while (celestialBodies.length < numPlanets && attempts < 1000) {
            const params = this.calculatePlanetParameters(minRadius, maxRadius);
            let newPlanet = {
                x: Math.random() * this.WORLD_WIDTH * 0.8 + this.WORLD_WIDTH * 0.1,
                y: Math.random() * this.WORLD_HEIGHT * 0.8 + this.WORLD_HEIGHT * 0.1,
                radius: params.radius,
                mass: params.mass,
                image: planetImages[celestialBodies.length % planetImages.length]
            };

            let overlapping = false;
            for (const existingPlanet of celestialBodies) {
                const dist = Math.hypot(newPlanet.x - existingPlanet.x, newPlanet.y - existingPlanet.y);
                if (dist < newPlanet.radius + existingPlanet.radius + minDistance) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                celestialBodies.push(newPlanet);
            }

            attempts++;
        }
        if (attempts >= 1000) {
            console.warn("Could not place all planets without overlapping. The world might be too crowded.");
        }
    }

    start(settings) {
        console.log("Starting Space Scene...");
        this.difficulty = settings.difficulty;
        // Create the ship with a reference to this game instance
        this.ship = new this.Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this);
        this.camera = new Camera(this.ship, this.WORLD_WIDTH, this.WORLD_HEIGHT, { 
            zoomSmoothing: this.zoomSmoothing 
        });
        this.isPaused = false;
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';
        // NEW: Music is now handled by gameManager.switchScene
        if (!this.stars.length) { this.createStars(); this.createPlanets(); }
    }

    stop() {
        if (thrusterSound.isLoaded) thrusterSound.pause();
    }

    update() {
        if (!this.ship || this.isPaused) return;
        this.ship.update();
        this.camera.update(); // Update camera position and zoom
        
        // Only clear orbital data if we're not in a locked orbit and not thrusting
        if (!this.ship.orbitLocked && !this.ship.thrusting) {
            this.orbitData = null;
        }

        // --- Orbital Mechanics Logic ---
        for (const planet of celestialBodies) {
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);
            
            const gravityWellEdge = planet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;

            // Only apply gravity if the ship is within the planet's gravity well
            if (distance < gravityWellEdge && distance > planet.radius) {
                // Calculate gravitational force using inverse square law
                const force = this.ORBITAL_CONSTANT * planet.mass / (distance * distance);
                
                // Calculate orbital velocity for a circular orbit at this distance
                const orbitalVelocity = Math.sqrt(this.ORBITAL_CONSTANT * planet.mass / distance);
                const shipVelocity = Math.hypot(this.ship.velX, this.ship.velY);
                const velocityRatio = shipVelocity / orbitalVelocity;
                
                // Calculate approach angle
                const shipAngle = Math.atan2(this.ship.velY, this.ship.velX);
                const radialAngle = Math.atan2(dy, dx);
                const orbitAngle = Math.abs(shipAngle - radialAngle) % (Math.PI * 2);
                const isOrbitalPath = (orbitAngle > Math.PI * 0.4 && orbitAngle < Math.PI * 0.6);

                // Always update orbitData for the planet we're orbiting or near
                if (this.ship.orbitLocked && this.ship.orbitingPlanet === planet || 
                    (!this.ship.orbitLocked && distance < this.GRAVITY_BOUNDARY_MULTIPLIER * planet.radius)) {
                    this.orbitData = {
                        planet,
                        distance,
                        shipVelocity,
                        orbitalVelocity,
                        velocityRatio,
                        shipAngle,
                        orbitQuality: this.ship.orbitLocked ? 'locked' : 'approaching'
                    };
                }

                // Check for orbital lock conditions - much wider velocity window, no angle requirement
                if (!this.ship.thrusting && !this.ship.orbitLocked && 
                    velocityRatio > 0.6 && velocityRatio < 1.4) {  // 40% tolerance either way
                    // Lock into orbit
                    this.ship.orbitLocked = true;
                    this.ship.orbitingPlanet = planet;
                    console.log("Orbit locked!"); // Debug message
                    
                    // Set exact orbital velocity
                    const tangentialAngle = radialAngle + Math.PI / 2;
                    this.ship.velX = orbitalVelocity * Math.cos(tangentialAngle);
                    this.ship.velY = orbitalVelocity * Math.sin(tangentialAngle);
                } else if (this.ship.orbitLocked && this.ship.orbitingPlanet === planet) {
                    if (this.ship.thrusting) {
                        // Break orbit if thrusters are used
                        this.ship.orbitLocked = false;
                        this.ship.orbitingPlanet = null;
                    } else {
                        // Maintain perfect orbital velocity while locked
                        const tangentialAngle = radialAngle + Math.PI / 2;
                        this.ship.velX = orbitalVelocity * Math.cos(tangentialAngle);
                        this.ship.velY = orbitalVelocity * Math.sin(tangentialAngle);
                        return; // Skip normal gravity application
                    }
                }
                
                // Apply gravitational acceleration if not in locked orbit
                if (!this.ship.orbitLocked || this.ship.orbitingPlanet !== planet) {
                    const angle = Math.atan2(dy, dx);
                    this.ship.velX += force * Math.cos(angle);
                    this.ship.velY += force * Math.sin(angle);
                }
                
                // Store orbital data for visualization
                if (distance < gravityWellEdge * 0.9) {  // Show within 90% of gravity well
                    const shipVelocity = Math.hypot(this.ship.velX, this.ship.velY);
                    const velocityRatio = shipVelocity / orbitalVelocity;
                    
                    // Calculate orbital indicators
                    const shipAngle = Math.atan2(this.ship.velY, this.ship.velX);
                    const radialAngle = Math.atan2(dy, dx);
                    const orbitAngle = Math.abs(shipAngle - radialAngle) % (Math.PI * 2);
                    const isOrbitalPath = (orbitAngle > Math.PI * 0.4 && orbitAngle < Math.PI * 0.6);
                    
                }
            }

            // Collision check
            if (distance < planet.radius) {
                console.log("Approaching planet, showing ship selection...");
                this.isPaused = true;
                if (thrusterSound.isLoaded) thrusterSound.pause();
                canvas.style.display = 'none';
                shipSelectionMenu.style.display = 'block';
            }
        }

        // --- Dynamic Zoom Logic ---
        const speed = Math.hypot(this.ship.velX, this.ship.velY);
        const speedRatio = Math.min(speed / this.maxSpeedForZoom, 1); 
        this.camera.targetZoom = this.maxZoom - (this.maxZoom - this.minZoom) * speedRatio;
    }
 
    draw() {
        if (!this.ship || this.isPaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.camera.begin(ctx);
        
        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        
        // Draw orbital indicators if we have orbital data
        if (this.orbitData) {
            const { planet, distance, shipAngle, orbitQuality, velocityRatio } = this.orbitData;
            
            // Visual feedback for orbital mechanics
            ctx.lineWidth = 2;
            if (this.ship.orbitLocked && this.ship.orbitingPlanet === planet) {
                // Locked orbit indicator - always visible while locked
                const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // 0 to 1 pulsing
                // Locked orbit indicator - pulsing green ring
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + pulse * 0.2})`; // More subtle pulsing
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, distance, 0, Math.PI * 2);
                ctx.stroke();

                // Draw orbit locked text at top
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ORBIT LOCKED', canvas.width / 2, 30);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                ctx.fillText('ORBIT LOCKED', canvas.width / 2, 30);
                ctx.restore();
            } else if (velocityRatio < 0.6 || velocityRatio > 1.4) {
                // Too fast or too slow - red indicator
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, distance, 0, Math.PI * 2);
                ctx.stroke();
                
                // Speed guidance text
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                const text = velocityRatio > 1.4 ? 'Too fast' : 'Too slow';
                ctx.fillText(text, this.ship.x, this.ship.y - 30);
                ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
                ctx.fillText(text, this.ship.x, this.ship.y - 30);
                ctx.restore();
            }
            
            // Draw predicted trajectory arc
            if (!this.ship.thrusting && velocityRatio > 0.6 && velocityRatio < 1.4) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
                // Draw an arc that shows the next quarter orbit
                ctx.arc(planet.x, planet.y, distance, shipAngle, shipAngle + Math.PI/2);
                ctx.stroke();
            }
        }
        
        // Draw planets over the trajectory lines
        celestialBodies.forEach(p => { 
            ctx.drawImage(p.image, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2); 
        });
        
        this.ship.draw();
        this.camera.end(ctx);

        this.drawCompass.call(this);
        this.drawRadar.call(this);
    }

    drawCompass() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Find the closest planet
        let closestPlanet = null;
        let minDistance = Infinity;

        for (const planet of celestialBodies) {
            const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestPlanet = planet;
            }
        }

        // Only proceed if we found a closest planet
        if (closestPlanet) {
            // Only draw the compass if the planet is far away, based on its size
            const compassMaxViewDistance = closestPlanet.radius * 1.5; 
            if (minDistance > compassMaxViewDistance) {
                const angleToPlanet = Math.atan2(closestPlanet.y - this.ship.y, closestPlanet.x - this.ship.x);
                
                const hudX = canvas.width / 2;
                const hudY = canvas.height / 2;
                const compassRadius = 120;

                ctx.save();
                ctx.translate(hudX + Math.cos(angleToPlanet) * compassRadius, hudY + Math.sin(angleToPlanet) * compassRadius);
                ctx.rotate(angleToPlanet + Math.PI / 2);
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.moveTo(0, -7.5);
                ctx.lineTo(-5, 5);
                ctx.lineTo(5, 5);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '22px "Consolas"';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.floor(minDistance)}m`, hudX, hudY + compassRadius + 30);
            }
        }
    }

    drawRadar() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Cache ship position and radar settings
        const shipPos = {
            x: this.ship.x,
            y: this.ship.y
        };

        // --- Radar Settings (tweak these to change the look and feel!) ---
        const radarRadius = 100; // The size of the radar circle
        const radarX = canvas.width - radarRadius - 20; // Position from the right edge
        const radarY = radarRadius + 20; // Position from the top edge
        const radarRange = this.WORLD_WIDTH / 4; // The max distance the radar can "see". Tied to world size!
        const radarScale = radarRadius / radarRange; // How to scale world distances to radar distances

        ctx.save();
        
        // Draw the semi-transparent background circle
        ctx.beginPath();
        ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 50, 0, 0.5)'; // Dark green, semi-transparent
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Brighter green border
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the player's blip in the center
        ctx.beginPath();
        ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'lime';
        ctx.fill();

        // Draw each planet as a blip on the radar
        for (const planet of celestialBodies) {
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);

            let blipX, blipY;

            if (distance < radarRange) {
                // Planet is inside radar range, position it proportionally
                blipX = radarX + dx * radarScale;
                blipY = radarY + dy * radarScale;
            } else {
                // Planet is outside range, pin it to the edge of the radar
                const angle = Math.atan2(dy, dx);
                blipX = radarX + Math.cos(angle) * radarRadius;
                blipY = radarY + Math.sin(angle) * radarRadius;
            }
            
            // Draw the planet's blip
            ctx.beginPath();
            ctx.arc(blipX, blipY, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.fill();
        }

        ctx.restore();
    }

    handleKeys(e, isDown) {
        if (!this.ship || this.isPaused) return;
        const oldThrusting = this.ship.thrusting;
        switch (e.key) {
            case 'ArrowUp': case 'w': this.ship.thrusting = isDown; break;
            case 'ArrowLeft': case 'a': this.ship.rotation = isDown ? -this.ROTATION_SPEED : 0; break;
            case 'ArrowRight': case 'd': this.ship.rotation = isDown ? this.ROTATION_SPEED : 0; break;
        }
        const newThrusting = this.ship.thrusting;
        if (thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    }
};

// --- Lander Scene ---
const landerScene = {
    name: 'lander', // Give the scene a name for the MusicManager
    lander: null, terrain: null, particles: [], stars: [], camera: null,
    baseGravity: 0, difficultySettings: null, selectedShip: null, 
    gameState: 'playing', zoomLevel: 1.5,
    ZOOM_IN: 1.5, ZOOM_OUT: 0.75,
    WORLD_WIDTH: canvas.width * 3, WORLD_HEIGHT: canvas.height * 2,
    BASE_THRUST_POWER: 0.035, ROTATION_SPEED: 0.05,
    Lander: class {
        constructor(x, y, initialFuel, shipData) {
            this.x = x; this.y = y; this.velX = 0; this.velY = 0;
            this.angle = -Math.PI / 2;
            this.rotation = 0; this.thrusting = false;
            this.width = shipData.width; this.height = shipData.height;
            this.image = shipData.img; this.thrusterOffset = shipData.thrusterOffset;
            this.fuel = initialFuel; this.crashed = false;
        }
        draw() {
            if (this.crashed) return;
            ctx.save();
            ctx.translate(this.x, this.y); ctx.rotate(this.angle + Math.PI / 2);
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
        emitThrusterParticles() {
            if (!this.thrusting || this.fuel <= 0) return;
            const baseAngle = this.angle + Math.PI;
            const baseOffsetX = Math.cos(baseAngle) * this.thrusterOffset;
            const baseOffsetY = Math.sin(baseAngle) * this.thrusterOffset;
            const baseX = this.x + baseOffsetX;
            const baseY = this.y + baseOffsetY;
            for (let i = 0; i < 3; i++) landerScene.particles.push(new landerScene.Particle(baseX, baseY, true));
        }
        update() {
            this.angle += this.rotation;
            if (this.thrusting && this.fuel > 0) {
                this.velX += landerScene.BASE_THRUST_POWER * Math.cos(this.angle);
                this.velY += landerScene.BASE_THRUST_POWER * Math.sin(this.angle);
                this.fuel -= 0.2;
            }
            this.velY += landerScene.baseGravity;
            this.x += this.velX; this.y += this.velY;
        }
    },
    Particle: class {
        constructor(x, y, isThruster = false) {
            this.x = x; this.y = y; this.isThruster = isThruster;
            if (isThruster) {
                this.radius = Math.random() * 3 + 2; this.lifespan = 30 + Math.random() * 20;
                const angle = landerScene.lander.angle + Math.PI + (Math.random() - 0.5) * 0.5;
                const speed = Math.random() * 2 + 1; const INERTIA = 1.0;
                this.velX = (landerScene.lander.velX * INERTIA) + speed * Math.cos(angle);
                this.velY = (landerScene.lander.velY * INERTIA) + speed * Math.sin(angle);
            } else {
                this.radius = Math.random() * 3 + 1; this.lifespan = 100;
                const angle = Math.random() * 2 * Math.PI; const speed = Math.random() * 3 + 1;
                this.velX = speed * Math.cos(angle); this.velY = speed * Math.sin(angle);
            }
        }
        draw() {
            ctx.save(); ctx.globalAlpha = this.lifespan / (this.isThruster ? 50 : 100);
            const hue = this.isThruster ? (40 + Math.random() * 20) : (this.lifespan * 0.5);
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        update() { this.x += this.velX; this.y += this.velY; this.lifespan--; }
    },
    createStars() {
        this.stars = [];
        for (let i = 0; i < 2000; i++) this.stars.push({ x: Math.random() * this.WORLD_WIDTH, y: Math.random() * this.WORLD_HEIGHT, radius: Math.random() * 1.5 });
    },
    generateTerrain() {
        let points = [];
        let y = this.WORLD_HEIGHT - Math.random() * 150 - 100;
        for (let x = 0; x <= this.WORLD_WIDTH; x += 20) {
            points.push({ x: x, y: y });
            y += Math.random() * 20 - 10;
            y = Math.max(this.WORLD_HEIGHT - 300, Math.min(this.WORLD_HEIGHT - 50, y));
        }
        const padWidth = this.difficultySettings.padWidth;
        const padIndex = Math.floor((this.WORLD_WIDTH / 2) / 20);
        const padY = points[padIndex].y;
        for (let i = 0; i < padWidth / 20; i++) {
            if (points[padIndex + i]) points[padIndex + i].y = padY;
        }
        const numCraters = 30;
        for (let i = 0; i < numCraters; i++) {
            const craterX = Math.random() * this.WORLD_WIDTH;
            const craterRadius = Math.random() * 80 + 40;
            if (craterX > points[padIndex].x - craterRadius && craterX < points[padIndex].x + padWidth + craterRadius) continue;
            for (let p of points) {
                const dist = Math.abs(p.x - craterX);
                if (dist < craterRadius) p.y += Math.sqrt(craterRadius * craterRadius - dist * dist) * 0.5;
            }
        }
        this.terrain = { points: points, padStart: points[padIndex].x, padEnd: points[padIndex].x + padWidth };
    },
    triggerCrash() {
        if (!this.lander.crashed) {
            this.gameState = 'crashed';
            if (thrusterSound.isLoaded) thrusterSound.pause();
            if (explosionSound.isLoaded) { explosionSound.currentTime = 0; explosionSound.play().catch(e => console.error("Explosion sound failed:", e)); }
            for (let i = 0; i < 50; i++) this.particles.push(new this.Particle(this.lander.x, this.lander.y, false));
            this.lander.crashed = true;
        }
    },
    drawWorld() {
        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        const padY = this.terrain.points.find(p => p.x >= this.terrain.padStart)?.y || this.WORLD_HEIGHT - 100;
        ctx.strokeStyle = '#fff'; ctx.fillStyle = '#808080'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.terrain.points[0].x, this.terrain.points[0].y);
        this.terrain.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(this.WORLD_WIDTH, this.WORLD_HEIGHT + 50);
        ctx.lineTo(0, this.WORLD_HEIGHT + 50);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#0f0'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(this.terrain.padStart, padY); ctx.lineTo(this.terrain.padEnd, padY); ctx.stroke();
    },
    drawUI() {
        ctx.fillStyle = '#fff'; ctx.font = '18px "Consolas"'; ctx.textAlign = 'left';
        ctx.fillText(`FUEL: ${Math.floor(this.lander.fuel)}`, 20, 30);
        ctx.fillText(`ALTITUDE: ${Math.floor(this.getAltitude())}m`, 20, 60);
        ctx.fillText(`H-SPEED: ${this.lander.velX.toFixed(2)}`, 20, 90);
        ctx.fillText(`V-SPEED: ${this.lander.velY.toFixed(2)}`, 20, 120);
        if (this.gameState === 'landed') {
            ctx.textAlign = 'center'; ctx.font = '50px "Consolas"';
            ctx.fillStyle = '#0f0';
            ctx.fillText('THE EAGLE HAS LANDED', canvas.width / 2, canvas.height / 2);
        } else if (this.gameState === 'crashed') {
            ctx.textAlign = 'center'; ctx.font = '50px "Consolas"'; ctx.fillStyle = '#f00';
            ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2);
        }
        if (this.gameState === 'landed' || this.gameState === 'crashed') {
            ctx.font = '20px "Consolas"';
            ctx.fillStyle = '#fff';
            ctx.fillText('Click to return to menu', canvas.width / 2, canvas.height / 2 + 40);
        }
    },
    getAltitude() {
        if (!this.terrain) return this.WORLD_HEIGHT;
        let groundY = this.WORLD_HEIGHT;
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            if (this.lander.x >= this.terrain.points[i].x && this.lander.x < this.terrain.points[i+1].x) {
                groundY = this.terrain.points[i].y;
                break;
            }
        }
        return Math.floor(groundY - this.lander.y - this.lander.height/2);
    },
    drawCompass() {
        if (this.gameState !== 'playing' || !this.terrain) return;
        const padY = this.terrain.points.find(p => p.x >= this.terrain.padStart)?.y;
        if (!padY) return;
        const padCenter = { x: this.terrain.padStart + (this.difficultySettings.padWidth / 2), y: padY };
        const dx = padCenter.x - this.lander.x;
        const dy = padCenter.y - this.lander.y;
        const distance = Math.hypot(dx, dy);
        const angleToPad = Math.atan2(dy, dx);
        if (distance < 250 && this.camera.targetZoom === this.ZOOM_IN) return;
        const hudX = canvas.width / 2; const hudY = 80; const arcRadius = 50;
        ctx.save(); ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(hudX, hudY, arcRadius, Math.PI, 0); ctx.stroke();
        ctx.save();
        ctx.translate(hudX + Math.cos(angleToPad) * arcRadius, hudY + Math.sin(angleToPad) * arcRadius);
        ctx.rotate(angleToPad + Math.PI / 2);
        ctx.fillStyle = 'red'; ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(-5, 5); ctx.lineTo(5, 5);
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = '18px "Consolas"'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(distance)}m`, hudX, hudY + 25);
        ctx.restore();
    },
    update() {
        if (this.gameState === 'playing') {
            this.lander.update();
            this.camera.update();
            this.lander.emitThrusterParticles();
            if (this.lander.x < 0 || this.lander.x > this.WORLD_WIDTH || this.lander.y < 0) this.triggerCrash();
            if (this.getAltitude() <= 0) {
                const onPad = this.lander.x > this.terrain.padStart && this.lander.x < this.terrain.padEnd;
                const safeSpeed = this.lander.velY < this.difficultySettings.safeSpeed && Math.abs(this.lander.velX) < this.difficultySettings.safeSpeed;
                const upright = Math.abs(this.lander.angle - (-Math.PI / 2)) < 0.2;
                if (onPad && safeSpeed && upright) {
                    this.gameState = 'landed';
                    if (thrusterSound.isLoaded) thrusterSound.pause();
                } else { this.triggerCrash(); }
            }
            const zoomOutZone = { left: this.terrain.padStart - canvas.width * 0.2, right: this.terrain.padEnd + canvas.width * 0.2 };
            if (this.camera.targetZoom === this.ZOOM_IN && (this.lander.x < zoomOutZone.left || this.lander.x > zoomOutZone.right)) {
                this.camera.targetZoom = this.ZOOM_OUT;
            } else if (this.camera.targetZoom === this.ZOOM_OUT && (this.lander.x > zoomOutZone.left && this.lander.x < zoomOutZone.right)) {
                this.camera.targetZoom = this.ZOOM_IN;
            }
        }
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifespan > 0;
        });
    },
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.camera.begin(ctx);

        this.drawWorld();
        this.lander.draw();
        this.particles.forEach(p => p.draw());

        this.camera.end(ctx);

        this.drawCompass();
        this.drawUI();
    },
    start(settings) {
        console.log("Starting Lander Scene...");
        this.selectedShip = settings.selectedShip;
        const difficulty = settings.difficulty;
        switch(difficulty) {
            case 'easy': this.difficultySettings = { gravity: 0.008, fuel: 1000, safeSpeed: 1.5, padWidth: 140 }; break;
            case 'medium': this.difficultySettings = { gravity: 0.01, fuel: 700, safeSpeed: 1.0, padWidth: 100 }; break;
            case 'hard': this.difficultySettings = { gravity: 0.012, fuel: 500, safeSpeed: 0.7, padWidth: 60 }; break;
        }
        this.baseGravity = this.difficultySettings.gravity;
        this.generateTerrain();
        this.lander = new this.Lander(this.WORLD_WIDTH / 2, 150, this.difficultySettings.fuel, this.selectedShip);
        this.camera = new Camera(this.lander, this.WORLD_WIDTH, this.WORLD_HEIGHT, {
            followSmoothing: 0.08, // A slightly slower, smoother follow for the lander
            zoomSmoothing: 0.04    // A custom zoom speed for the lander scene
        });
        this.camera.targetZoom = this.ZOOM_IN;
        this.particles = [];
        this.gameState = 'playing';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';
    },
    handleKeys(e, isDown) {
        if (!this.lander || this.gameState !== 'playing') return;
        const oldThrusting = this.lander.thrusting;
        switch (e.key) {
            case 'ArrowUp': case 'w': this.lander.thrusting = isDown; break;
            case 'ArrowLeft': case 'a': this.lander.rotation = isDown ? -this.ROTATION_SPEED : 0; break;
            case 'ArrowRight': case 'd': this.lander.rotation = isDown ? this.ROTATION_SPEED : 0; break;
        }
        const newThrusting = this.lander.thrusting;
        if (thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    },
    stop() {
        console.log("Stopping Lander Scene...");
    }
};

// --- INITIALIZATION ---
function init() {
    let imagesLoaded = 0;
    const allImages = [
        ...Object.values(shipTypes).map(s => s.img), 
        spaceShipeImage, 
        ...planetImages
    ];
    const totalImages = allImages.length;

    function onAssetLoad() {
        imagesLoaded++;
        console.log(`Asset loaded (${imagesLoaded}/${totalImages})`);
        if (imagesLoaded === totalImages) {
            console.log("All game assets loaded!");
            loadingScreen.style.display = 'none';
            menu.style.display = 'block';
            musicManager.playPlaylistForScene('menu'); // Start menu music once loaded
        }
    }
    
    // Attach event handlers *before* setting src
    allImages.forEach(img => {
        img.onload = onAssetLoad;
        img.onerror = (e) => {
            console.error("An image failed to load:", e.target.src);
            onAssetLoad(); // Still count it as "loaded" to not block the game
        }
    });

    // Now set the src to trigger loading
    spaceShipeImage.src = ASSET_BASE_URL + 'images/ship.png';
    planetImages.forEach((img, index) => {
        img.src = ASSET_BASE_URL + `images/planet${index + 1}.png`;
        img.onerror = () => {
            console.error(`Failed to load planet image ${index + 1}`);
            // Load a backup image or show a placeholder
            img.src = ASSET_BASE_URL + 'images/planet1.png';
        };
    });
    Object.values(shipTypes).forEach(ship => {
        ship.img.src = ASSET_BASE_URL + ship.src;
    });
    
    landerScene.createStars();
    
    const spaceScene = new SpaceScene();
    document.getElementById('easyBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'easy' }));
    document.getElementById('mediumBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'medium' }));
    document.getElementById('hardBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'hard' }));

    shipSelectionMenu.addEventListener('click', (event) => {
        const shipOption = event.target.closest('.ship-option');
        if (!shipOption) return;
        
        const shipName = shipOption.getAttribute('data-ship');
        settings.selectedShip = shipTypes[shipName];
        gameManager.switchScene(landerScene, settings);
    });
    
    window.addEventListener('keydown', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, true); }});
    window.addEventListener('keyup', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, false); }});
    
    canvas.addEventListener('click', () => {
        if (gameManager.activeScene === landerScene && (landerScene.gameState === 'landed' || landerScene.gameState === 'crashed')) {
            musicManager.stop(); // NEW: Tell the manager to stop all music
            if (thrusterSound.isLoaded) thrusterSound.pause();
            gameManager.activeScene = null; // Stop the animation loop for the scene
            menu.style.display = 'block';
            shipSelectionMenu.style.display = 'none';
            canvas.style.display = 'none';
        }
    });
    
    // Start the main game loop
    gameManager.loop();
}

// Run the game
init();
