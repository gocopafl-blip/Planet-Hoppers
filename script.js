// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const menu = document.getElementById('menu');
const shipSelectionMenu = document.getElementById('ship-selection');
const descentUI = document.getElementById('descent-ui');
const zoomControls = document.getElementById('zoom-controls');

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

// --- Create a single instance of the MusicManager ---
const musicManager = new MusicManager();

// --- Sound Effects (unchanged) ---
const thrusterSound = createSound('sounds/thruster.mp3', true, 0.5);
const explosionSound = createSound('sounds/explosion.mp3', false, 0.7);
const airlockSound = createSound('sounds/airlock.mp3', false, 0.7);
let airlockSoundPlayed = false;
const dockTypes = {
    alpha: { 
        src: 'images/spacedockalpha.png', 
        img: new Image() 
    },
    // When you're ready for a second dock, you'd just add it here!
    // beta: { 
    //     src: 'images/spacedockbeta.png', 
    //     img: new Image() 
    // }
};
const shipTypes = {
    scout:  { src: 'images/lander-scout.png',  width: 40,  height: 40,  img: new Image(), thrusterOffset: 20 },
    classic:{ src: 'images/lander-classic.png', width: 80,  height: 80,  img: new Image(), thrusterOffset: 40 },
    heavy:  { src: 'images/lander-heavy.png',   width: 160, height: 160, img: new Image(), thrusterOffset: 65 }
};
const spaceShipImage = new Image();
const planetImages = [new Image(), new Image(), new Image()];
const spaceDockImages = [new Image()];
const spaceDockTerminalImage = new Image();
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
class Ship {
        constructor(x, y, game) {
            this.x = x; this.y = y; this.velX = 0; this.velY = 0;
            this.angle = -Math.PI / 2;
            this.rotation = 0; this.thrusting = false;
            this.reversing = false;
            this.rotatingLeft = false;
            this.rotatingRight = false;
            this.strafingLeft = false;
            this.strafingRight = false;
            this.width = 200; // Adjusted for better visibility
            this.height = 240;
            this.game = game; // Store reference to the game
            this.isDocked = false;
            this.inStableOrbit = false;
            this.isOrbitLocked = false;
            this.orbitingPlanet = null;
            this.orbitRadius = 0;
            this.orbitAngle = 0;
            this.lockedOrbitSpeed = 0;
            this.orbitTransitionProgress = 0; // For smooth orbit lock transition
            this.initialApproachAngle = 0; // Store ship's angle when orbit lock starts
            this.thrusters = {
                front_left:  { 
                    x: -this.width / 6.0, 
                    y: -this.height / 4.7,     // Moved to bottom
                    outwardAngle: -Math.PI / 4  // 45 degrees outward
                },
                front_right: { 
                    x: this.width / 6.0,  
                    y: -this.height / 4.7,      // Moved to bottom
                    outwardAngle: Math.PI / 4   // 45 degrees outward
                },
                rear_left:   { 
                    x: -this.width / 6.0, 
                    y: this.height / 2.7,       // Moved to top
                    outwardAngle: Math.PI / 4  // 45 degrees outward
                },
                rear_right:  { 
                    x: this.width / 5.2,  
                    y: this.height / 2.7,       // Moved to top
                    outwardAngle: -Math.PI / 4   // 45 degrees outward
                }
            }
        }
       draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI / 2);
            ctx.drawImage(spaceShipImage, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
        
        update() {
            // --- ROTATION LOGIC ---
            // Apply rotational force if the keys are held down
            if (this.rotatingLeft) this.rotation -= this.game.ROTATION_SPEED * 0.1;
            if (this.rotatingRight) this.rotation += this.game.ROTATION_SPEED * 0.1;
            this.angle += this.rotation; // Apply the rotation to the ship's angle

            // --- FORWARD/REVERSE THRUST LOGIC (no change here) ---
            if (this.thrusting) {
                this.velX += this.game.THRUST_POWER * Math.cos(this.angle);
                this.velY += this.game.THRUST_POWER * Math.sin(this.angle);
            }
            if (this.reversing) {
                this.velX -= this.game.THRUST_POWER * Math.cos(this.angle);
                this.velY -= this.game.THRUST_POWER * Math.sin(this.angle);
            }

            // --- ADD NEW STRAFING LOGIC ---
            const strafeAngle = this.angle + Math.PI / 2; // 90 degrees to the ship's facing
            if (this.strafingLeft) {
                this.velX -= this.game.THRUST_POWER * Math.cos(strafeAngle);
                this.velY -= this.game.THRUST_POWER * Math.sin(strafeAngle);
            }
            if (this.strafingRight) {
                this.velX += this.game.THRUST_POWER * Math.cos(strafeAngle);
                this.velY += this.game.THRUST_POWER * Math.sin(strafeAngle);
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
    
     class SpaceParticle {
        constructor(x, y, angle, speed, isRotation = false, shipVelX = 0, shipVelY = 0) {
        this.x = x;
        this.y = y;
        
        // Rotational puffs are smaller and shorter-lived
        this.radius = isRotation ? Math.random() * 1.2 + 0.5 : Math.random() * 2 + 1;
        this.lifespan = isRotation ? 15 + Math.random() * 10 : 40 + Math.random() * 20;
        this.initialLifespan = this.lifespan;

        // Add some randomness to the particle speed (variation in exhaust velocity)
        const speedVariation = 0.2; // 20% variation
        const finalSpeed = speed * (1 + (Math.random() * speedVariation - speedVariation/2));
        
        // Add slight random spread to the angle (exhaust cone)
        const spread = isRotation ? 0.1 : 0.2; // Rotation particles spread less
        const finalAngle = angle + (Math.random() * spread - spread/2);

        // For rotation thrusters, only use thrust velocity (no ship velocity inheritance)
        // For main thrusters, combine ship velocity and thrust velocity
        //if (isRotation) {
          //  this.velX = finalSpeed * Math.cos(finalAngle);
           // this.velY = finalSpeed * Math.sin(finalAngle);
        //} else {
           // this.velX = shipVelX + (finalSpeed * Math.cos(finalAngle));
           // this.velY = shipVelY + (finalSpeed * Math.sin(finalAngle));

            // Combine ship velocity and thrust velocity
        this.velX = shipVelX + (finalSpeed * Math.cos(finalAngle));
        this.velY = shipVelY + (finalSpeed * Math.sin(finalAngle));
        
    }

    draw(ctx) {
        ctx.save();
        // Fade the particle out over its lifespan
        ctx.globalAlpha = this.lifespan / this.initialLifespan;
        // Start as bright yellow/orange
        const hue = 40; 
        // Start at 100% lightness (pure white) and fade down to 50% (vibrant color)
        const lightness = 100 - (50 * (1 - (this.lifespan / this.initialLifespan)));
        ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.lifespan--;
    }
 }
 class SpaceDock {
    constructor(x, y, width, height, image, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.type = type; // e.g., 'alpha', 'beta', etc.
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
    }

   // --- Space Scene ---
class SpaceScene {
    constructor() {
        // --- Scene State ---
        this.name = 'space'; // Give the scene a name for the MusicManager
        this.ship = null;
        this.stars = [];
        this.particles = []; // For thruster effects
        this.spaceDocks = []; // Array to hold all space docks
        this.difficulty = 'easy';
        this.isPaused = false;
        this.camera = null;
        //this.orbitData = null;
        this.dockingRadius = 1000;
        
        // --- World Settings ---
        this.WORLD_WIDTH = canvas.width * 200;
        this.WORLD_HEIGHT = canvas.height * 200;

        // --- Core Movement Settings ---
        this.ROTATION_SPEED = 0.005;  // Halved for more precise rotation control
        this.THRUST_POWER = 0.03;    // Reduced for smoother acceleration

        // --- Orbital Mechanics Settings ---
        this.GRAVITY_BOUNDARY_MULTIPLIER = 1.35;  // Gravity well extends to 1.5x planet radius
        this.ORBITAL_CONSTANT = 0.00035;         // Reduced for more manageable orbital velocities
        this.PLANET_MASS_SCALAR = 0.4;           // Reduced mass to prevent excessive gravitational acceleration

        // --- Camera Settings ---
        this.minZoom = 0.1; // minZoom is now used to configure the camera
        this.maxZoom = 2.0;
        //this.maxSpeedForZoom = 15; Used for dynamic zoom - currently disabled
        this.zoomSmoothing = 0.03;

        // --- Orbit Lock Settings ---
        this.ORBIT_LOCK_DURATION = 2;       // Time in seconds to lock orbit.
        this.orbitLockTimer = 0;

        // Central place for all flight model speed definitions
        this.MIN_DOCKING_SPEED = 0.1;
        this.MAX_DOCKING_SPEED = 1.0;
        this.MIN_ORBIT_SPEED = 2.0;
        this.MAX_ORBIT_SPEED = 5.0;
        this.GRAVITY_ASSIST_MIN_SPEED = 5.01;
        this.GRAVITY_ASSIST_MAX_SPEED = 10.0;
        this.MAX_SAFE_STRUCTURAL_SPEED = 25.0;
    }

getRotatedPosition(offsetX, offsetY) {
    const ship = this.ship;
    const correctedAngle = ship.angle + Math.PI / 2;
    const cos = Math.cos(correctedAngle);
    const sin = Math.sin(correctedAngle);
    return {
        x: ship.x + (offsetX * cos) - (offsetY * sin),
        y: ship.y + (offsetX * sin) + (offsetY * cos)
    };
}

emitThrusterParticles() {
    if (!this.ship) return;
    const ship = this.ship;

    // Helper function to emit a particle from a thruster
    const emitFromThruster = (thruster, baseAngle, speed, isRotation = false) => {
        const pos = this.getRotatedPosition(thruster.x, thruster.y);
        // Calculate final angle based on ship's orientation and thruster's outward angle
        const particleAngle = ship.angle + baseAngle + thruster.outwardAngle;
        this.particles.push(new SpaceParticle(
            pos.x, pos.y, 
            particleAngle, 
            speed, 
            isRotation,
            ship.velX,    // Pass ship's current X velocity
            ship.velY     // Pass ship's current Y velocity
        ));
    };

    if (ship.thrusting) { // Main engines (rear thrusters) firing backward
        emitFromThruster(ship.thrusters.rear_left, Math.PI, 3);   // Rear left fires backward
        emitFromThruster(ship.thrusters.rear_right, Math.PI, 3);  // Rear right fires backward
    }

    if (ship.reversing) { // Front RCS thrusters firing forward
        emitFromThruster(ship.thrusters.front_left, 0, 2);    // Front left fires forward
        emitFromThruster(ship.thrusters.front_right, 0, 2);   // Front right fires forward
    }

    if (ship.rotatingRight) { // Clockwise rotation
        // Right side thrusters fire outward
        emitFromThruster(ship.thrusters.front_left, 0, 1, true);       // Front right fires outward
        emitFromThruster(ship.thrusters.rear_right, Math.PI, 1, true);  // Rear right fires outward
    }

    if (ship.rotatingLeft) { // Counter-clockwise rotation
        // Left side thrusters fire outward
        emitFromThruster(ship.thrusters.front_right, 0, 1, true);       // Front left fires outward
        emitFromThruster(ship.thrusters.rear_left, Math.PI, 1, true);  // Rear left fires outward
    }

    if (ship.strafingRight) { // Strafe right (left thrusters fire right)
        // Left thrusters fire to the right
        emitFromThruster(ship.thrusters.front_left, -Math.PI/4, 1.5, true);  // Front left fires right
        emitFromThruster(ship.thrusters.rear_left, -Math.PI/1.4, 1.5, true);   // Rear left fires right
    }

    if (ship.strafingLeft) { // Strafe left (right thrusters fire left)
        // Right thrusters fire to the left
        emitFromThruster(ship.thrusters.front_right, Math.PI/4, 1.5, true); // Front right fires left
        emitFromThruster(ship.thrusters.rear_right, Math.PI/1.4, 1.5, true);  // Rear right fires left
    }
}


    createStars() {
        this.stars = [];
        for (let i = 0; i < 10000; i++) {
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
        const minDistance = 4000; 
        let attempts = 0; 
        const minRadius = 1200;  // Allows for smaller planets
        const maxRadius = 2000; // Allows for larger planets

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
                const existingWell = existingPlanet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;
                const newWell = newPlanet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;
                if (dist < existingWell + newWell + minDistance) {
                    overlapping = true;
                    break;
                }
            }
            // Check distance from space dock
            for (const dock of this.spaceDocks) {
            const distFromDock = Math.hypot(newPlanet.x - dock.x, newPlanet.y - dock.y);
            const safeDockDistance = 6000;  // Safe distance from any dock
            if (distFromDock < safeDockDistance + newPlanet.radius) {
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
    createSpaceDock(type, image, x, y, width, height) {
        const dock = new SpaceDock(x, y, width, height, image, type);
        this.spaceDocks.push(dock);
        return dock;
    }
    start(settings) {
        console.log("Starting Space Scene...");
        this.difficulty = settings.difficulty;
        this.isPaused = false;
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';

        // Initialize game world if not already done
        if (!this.stars.length) { 
            this.createStars(); 
            // Create the main space dock BEFORE creating planets
            this.createSpaceDock('alpha', dockTypes.alpha.img, this.WORLD_WIDTH / 2 - 1000, this.WORLD_HEIGHT / 2, 2400, 2000);
            // Now create planets - they will avoid the dock
            this.createPlanets();
        }

        // Get the alpha dock's position for ship placement
        const alphaDock = this.spaceDocks[0];
        if (alphaDock) {
            // Position the ship 1000 units to the right of the dock, and 300 units below
            this.ship = new Ship(alphaDock.x + 980, alphaDock.y + 270, this);
        } else {
            // Fallback position if no dock exists
            this.ship = new Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, this);
        }

        // Set up the camera to follow the ship
        this.camera = new Camera(this.ship, this.WORLD_WIDTH, this.WORLD_HEIGHT, { 
            zoomSmoothing: this.zoomSmoothing,
            followSmoothing: 0.5  // Instant camera following for tight ship centering
        });

        canvas.style.display = 'block';
        zoomControls.style.display = 'flex';
    }

    stop() {
        if (thrusterSound.isLoaded) thrusterSound.pause();
        zoomControls.style.display = 'none';
        document.getElementById('access-dock-ui').style.display = 'none';
        document.getElementById('launch-ui').style.display = 'none';
    }

    update() {
        if (!this.ship || this.isPaused) return;
        // --- ORBIT LOCK LOGIC ---
        if (this.ship.isOrbitLocked && this.ship.orbitingPlanet) {
            const ship = this.ship;
            const planet = this.ship.orbitingPlanet;

            // Check if the player wants to break orbit by thrusting
            const wantsToMove = ship.thrusting || ship.reversing || ship.strafingLeft || ship.strafingRight;
            if (wantsToMove) {
            // Calculate the current orbital velocity before breaking orbit
            const orbitalSpeed = ship.lockedOrbitSpeed / ship.orbitRadius;
            
            // Convert orbital angular velocity to linear velocity components
            // The velocity is tangential to the orbit (perpendicular to the radius)
            const tangentAngle = ship.orbitAngle + Math.PI / 2; // 90 degrees to the radius
            ship.velX = orbitalSpeed * ship.orbitRadius * Math.cos(tangentAngle);
            ship.velY = orbitalSpeed * ship.orbitRadius * Math.sin(tangentAngle);
            
            ship.isOrbitLocked = false;
            ship.orbitingPlanet = null;
            this.orbitLockTimer = 0;
            this.camera.targetZoom = 1.0;
                                    
            } else {
                const orbitalSpeed = ship.lockedOrbitSpeed / ship.orbitRadius;
                
                ship.orbitAngle += orbitalSpeed;
                const targetX = planet.x + Math.cos(ship.orbitAngle) * ship.orbitRadius;
                const targetY = planet.y + Math.sin(ship.orbitAngle) * ship.orbitRadius;
                const targetAngle = ship.orbitAngle + Math.PI / 2; // Target orbital angle
                
                // Smooth transition from approach angle to orbital angle
                if (ship.orbitTransitionProgress < 1) {
                    ship.orbitTransitionProgress += 0.01; // Adjust this for faster/slower transition
                    ship.orbitTransitionProgress = Math.min(ship.orbitTransitionProgress, 1); // Cap at 100%
                    
                    // Smoothly interpolate the ship's angle
                    const angleDiff = targetAngle - ship.initialApproachAngle;
                    // Handle angle wrapping (shortest path between angles)
                    let adjustedAngleDiff = angleDiff;
                    if (angleDiff > Math.PI) adjustedAngleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) adjustedAngleDiff += 2 * Math.PI;
                    
                    ship.angle = ship.initialApproachAngle + (adjustedAngleDiff * ship.orbitTransitionProgress);
                    
                    // Position follows orbital path immediately
                    ship.x = targetX;
                    ship.y = targetY;
                } else {
                    // Full orbital motion once transition is complete
                    ship.x = targetX;
                    ship.y = targetY;
                    ship.angle = targetAngle;
                }

                this.camera.update();
                return; 
            }
        }
        // --- UNDOCKING LOGIC ---
        const wantsToMove = this.ship.thrusting || this.ship.reversing || this.ship.strafingLeft || this.ship.strafingRight;
        if (this.ship.isDocked && wantsToMove) {
            this.ship.isDocked = false;
        }

        this.ship.update();
        // --- DOCKING LOGIC ---    
        const dock = this.spaceDocks[0];
        if (dock) {
            const distance = Math.hypot(this.ship.x - dock.x, this.ship.y - dock.y);
            const speed = Math.hypot(this.ship.velX, this.ship.velY);
            
            if (!wantsToMove && distance < this.dockingRadius && speed < this.MAX_DOCKING_SPEED && speed > this.MIN_DOCKING_SPEED) {
                this.ship.isDocked = true;

                this.ship.velX = 0; // Reduce residual velocity
                this.ship.velY = 0; // Reduce residual velocity
                if (this.ship.isDocked){
                    if (!airlockSoundPlayed) {
                        airlockSound.play();
                        airlockSoundPlayed = true;
                    }
                }
            }

            // Reset the sound flag when not docked (moved outside the docking condition)
            if (!this.ship.isDocked) {
                airlockSoundPlayed = false;
            }
        }
        
        // --- 4. FINALLY, HANDLE VISUALS AND OTHER PHYSICS ---
        this.emitThrusterParticles();
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifespan > 0;
        });
        this.camera.update();
        
    /*    if (this.ship.isDocked) {
             this.orbitData = null;
             return;
        }
        
        // Only clear orbital data if we're not in a locked orbit and not thrusting
        if (!this.ship.isOrbitLocked && !this.ship.thrusting) {
            this.orbitData = null;
        }
    */
        // --- Orbital Mechanics Logic ---
        for (const planet of celestialBodies) {
            // If we are locked in an orbit, ignore all other planets.
            if (this.ship.isOrbitLocked && this.ship.orbitingPlanet !== planet) {
                continue;
            }
            const dx = planet.x - this.ship.x;
            const dy = planet.y - this.ship.y;
            const distance = Math.hypot(dx, dy);
            
            
            const gravityWellEdge = planet.radius * this.GRAVITY_BOUNDARY_MULTIPLIER;

            // Only apply gravity if the ship is within the planet's gravity well
            if (distance < gravityWellEdge && distance > planet.radius) {
            const shipSpeed = Math.hypot(this.ship.velX, this.ship.velY);
            const startSpeed = this.MAX_ORBIT_SPEED; // Starts ramping up at 5.0
            const fullSpeed = this.GRAVITY_ASSIST_MAX_SPEED; // Reaches 100% at 10.0
            
            let gravityFactor = 0; // Default to 0% gravity
            if (shipSpeed > startSpeed) {
                // Calculate how far the ship's speed is into the transition zone
                const progress = (shipSpeed - startSpeed) / (fullSpeed - startSpeed);
                // Clamp the value between 0 and 1 to create the 0% to 100% factor
                gravityFactor = Math.max(0, Math.min(progress, 1));
            }

            if (gravityFactor > 0) {
                const baseForce = this.ORBITAL_CONSTANT * planet.mass / (distance * distance);
                // Apply the force scaled by our gravityFactor
                const appliedForce = baseForce * gravityFactor;
                
                const angle = Math.atan2(dy, dx);
                this.ship.velX += appliedForce * Math.cos(angle);
                this.ship.velY += appliedForce * Math.sin(angle);
            }

            // 2. Check for stable orbit conditions to engage the lock-in timer.
            if (shipSpeed > this.MIN_ORBIT_SPEED && shipSpeed < this.MAX_ORBIT_SPEED && !this.ship.isOrbitLocked) {
                this.ship.inStableOrbit = true;
                this.orbitLockTimer += 1 / 60; // Convert frames to seconds

                if (this.orbitLockTimer >= this.ORBIT_LOCK_DURATION) {
                    this.ship.isOrbitLocked = true;
                    this.ship.orbitingPlanet = planet;
                    this.ship.orbitRadius = distance;
                    this.ship.orbitAngle = Math.atan2(dy, dx) + Math.PI;
                    this.ship.lockedOrbitSpeed = Math.hypot(this.ship.velX, this.ship.velY);
                    this.ship.orbitTransitionProgress = 0; // Start transition at 0%
                    this.ship.initialApproachAngle = this.ship.angle; // Store current ship angle
                    this.camera.targetZoom = 0.5; // Set target zoom for orbit view
                }
            } else {
                this.ship.inStableOrbit = false;
                this.orbitLockTimer = 0;
            }
            }

            // Collision check (functionality disabled - handled by orbit lock system)
            if (distance < planet.radius) {
                //console.log("Approaching planet, showing ship selection...");
                //this.isPaused = true;
                //if (thrusterSound.isLoaded) thrusterSound.pause();
                //canvas.style.display = 'none';
                //shipSelectionMenu.style.display = 'block';
            }
        }

        // --- Dynamic Zoom Logic ---
        //const speed = Math.hypot(this.ship.velX, this.ship.velY);
        //const speedRatio = Math.min(speed / this.maxSpeedForZoom, 1); 
        //this.camera.targetZoom = this.maxZoom - (this.maxZoom - this.minZoom) * speedRatio;
    }
 
    draw() {
        if (!this.ship || this.isPaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.camera.begin(ctx);
        
        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        
        // Draw orbital indicators if we have orbital data
 /*       if (this.orbitData) {
            const { planet, distance, shipAngle, orbitQuality, velocityRatio } = this.orbitData;
            
            // Visual feedback for orbital mechanics
            ctx.lineWidth = 2;
            if (this.ship.isOrbitLocked && this.ship.orbitingPlanet === planet) {
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
     */   
        // Draw planets over the trajectory lines
        celestialBodies.forEach(p => { 
            ctx.drawImage(p.image, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2); 
        });
        
        for (const dock of this.spaceDocks) {
        dock.draw(ctx);
        }

        this.ship.draw();
        this.particles.forEach(p => p.draw(ctx));
        this.camera.end(ctx);
/*
        if (this.ship.isOrbitLocked) {
            descentUI.style.display = 'block';
        } else {
            descentUI.style.display = 'none';

            }
*/
        this.drawSpeedometer.call(this);
        this.drawCompass.call(this);
        this.drawRadar.call(this);
        this.drawHud.call(this);
        this.drawDebugInfo.call(this);

            // Show or hide the "Access Dock" UI based on docking status
        const accessDockUI = document.getElementById('access-dock-ui');
        if (this.ship.isDocked) {
            accessDockUI.style.display = 'block';
        } else {
            accessDockUI.style.display = 'none';
        }

        // Launch Drop Ship Button visibility based on stable orbit
        const launchUI = document.getElementById('launch-ui');
        if (this.ship.isOrbitLocked) {
            launchUI.style.display = 'block';
        } else {
            launchUI.style.display = 'none';
        }
    }
    drawSpeedometer() {
            if (!this.ship) return;

            const speed = Math.hypot(this.ship.velX, this.ship.velY);
            const maxSpeed = 20; // The max speed we want the gauge to show.

            // --- Gauge settings ---
            const centerX = 120;
            const centerY = 120;
            const radius = 80;
            const startAngle = Math.PI * 0.75; // Start angle (bottom-left)
            const endAngle = Math.PI * 2.25;   // End angle (bottom-right)
            const totalAngle = endAngle - startAngle;

            ctx.save();
            ctx.lineWidth = 15;
            ctx.font = '16px "Orbitron", Arial, sans-serif';

            // --- Draw the color-coded arcs ---
            // Arc Outline (White)
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffffff'; // White
            ctx.beginPath();
            ctx.arc(centerX, centerY, 90, startAngle, endAngle);
            ctx.stroke();
            ctx.restore();

            // Docking Speed (Blue)
            ctx.strokeStyle = '#a0e0ff'; // Light Blue
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle * 0.05);
            ctx.stroke();

            // Orbit Speed (Green)
            ctx.strokeStyle = '#00ff00'; // Green
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.1, startAngle + totalAngle * 0.25);
            ctx.stroke();
            
            // Gravity Assist Speed (Yellow)
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle + totalAngle * 0.251, startAngle + totalAngle * 0.5);
            ctx.stroke();

            // --- Draw the needle ---
            const speedRatio = Math.min(speed / maxSpeed, 1.0); // Cap at 1.0
            const needleAngle = startAngle + (speedRatio * totalAngle);
            
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(needleAngle) * (radius + 10), centerY + Math.sin(needleAngle) * (radius + 10));
            ctx.stroke();

            // --- Draw the speed text ---
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(speed.toFixed(2), centerX, centerY + 40);

            // Draw the speed range labels
            ctx.save();
            if (speed >= 0.01 && speed <= 1.0) {
            ctx.fillStyle = '#a0e0ff'; // Light blue like docking arc
            ctx.fillText('DOCK OK', centerX, centerY + 80);
            } else if (speed >= 2.0 && speed <= 5.0) {
            ctx.fillStyle = '#00ff00'; // Green like orbit arc
            ctx.fillText('ORBIT OK', centerX, centerY + 80);
            } else if (speed >= 5.0 && speed <= 10.0) {
            ctx.fillStyle = 'yellow'; // Yellow like gravity assist arc
            ctx.fillText('GRAV ASSIST', centerX, centerY + 80);
            } else if (speed > 20.0) {
            ctx.font = '20px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'red'; // Red for dangerous speeds
            ctx.fillText('OVERSPEED', centerX, centerY + 80);
            }
            ctx.restore();
        }
    drawCompass() {
        if (!this.ship || celestialBodies.length === 0) return;

        // Find the closest planet
        let closestPlanet = null;
        let minDistance = Infinity;

        // --- REPLACE THE LOOP WITH THIS ---
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
                ctx.font = '22px "Consolas", "Courier New", "Monaco", monospace';
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
        drawHud() {
        if (this.ship && this.ship.isDocked) {
            ctx.save();
            ctx.font = '30px "Orbitron", Arial, sans-serif';
            ctx.fillStyle = 'cyan';
            ctx.textAlign = 'center'; // Ensure text is centered
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            // Center the text exactly like the CSS button: canvas.width / 2
            ctx.fillText('SHIP DOCKED', canvas.width / 2, canvas.height * 0.10); // 10% down the screen
            ctx.restore();
            return;
        }
        //if (!this.orbitData) return; // Don't draw if there's no data

    }
        drawDebugInfo() {
            if (!this.ship || !celestialBodies.length) return;

            // Find the closest planet to the ship
            const closestPlanet = celestialBodies.reduce((closest, planet) => {
                const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
                if (dist < closest.dist) {
                    return { dist, planet };
                }
                return closest;
            }, { dist: Infinity, planet: null }).planet;

            if (!closestPlanet) return;
            
            // Calculate the distance (radius) from the ship to the center of the planet
            const radius = Math.hypot(this.ship.x - closestPlanet.x, this.ship.y - closestPlanet.y);
            const zoom = this.camera.zoomLevel;

            // --- Draw the text on the screen ---
            ctx.save();
            ctx.font = '16px "Orbitron"';
            ctx.fillStyle = 'yellow';
            ctx.textAlign = 'left';
            ctx.fillText(`Radius: ${radius.toFixed(0)}`, 10, canvas.height - 30);
            ctx.fillText(`Zoom: ${zoom.toFixed(2)}`, 10, canvas.height - 10);
            ctx.restore();
        }
    
        handleKeys(e, isDown) {
            if (!this.ship || this.isPaused) return;

            const oldThrusting = this.ship.thrusting || this.ship.reversing;
            switch (e.key) {
            case 'ArrowUp': case 'w': this.ship.thrusting = isDown; break;
            case 'ArrowDown': case 's': this.ship.reversing = isDown; break;
            case 'ArrowLeft': case 'a': this.ship.rotatingLeft = isDown; break;
            case 'ArrowRight': case 'd': this.ship.rotatingRight = isDown; break;
            case 'q': case ',': this.ship.strafingLeft = isDown; break;
            case 'e': case '.': this.ship.strafingRight = isDown; break;
            case ' ': if (isDown) this.ship.rotation = 0; break;
        }
        const newThrusting = this.ship.thrusting || this.ship.reversing;
        if (thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    }
};
const spaceDockScene = {
    name: 'menu', // We can reuse the menu music for now
    
    start(settings) {
        console.log("Starting SpaceDock Scene...");
        // Hide other UI elements and show the ones for this scene
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        descentUI.style.display = 'none';
        zoomControls.style.display = 'none';
        document.getElementById('dock-ui').style.display = 'block';

        canvas.style.display = 'block';
    },

    stop() {
        // This function will be called when we leave the scene
        console.log("Stopping SpaceDock Scene...");
        document.getElementById('dock-ui').style.display = 'none';
    },

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
        update() {
            // Simple linear motion - once a particle is emitted, it continues in a straight line
            this.x += this.velX;
            this.y += this.velY;
            this.lifespan--;
        }
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
        ctx.fillStyle = '#fff'; ctx.font = '18px "Consolas", "Courier New", "Monaco", monospace'; ctx.textAlign = 'left';
        ctx.fillText(`FUEL: ${Math.floor(this.lander.fuel)}`, 20, 30);
        ctx.fillText(`ALTITUDE: ${Math.floor(this.getAltitude())}m`, 20, 60);
        ctx.fillText(`H-SPEED: ${this.lander.velX.toFixed(2)}`, 20, 90);
        ctx.fillText(`V-SPEED: ${this.lander.velY.toFixed(2)}`, 20, 120);
        if (this.gameState === 'landed') {
            ctx.textAlign = 'center'; ctx.font = '50px "Consolas", "Courier New", "Monaco", monospace';
            ctx.fillStyle = '#0f0';
            ctx.fillText('THE EAGLE HAS LANDED', canvas.width / 2, canvas.height / 2);
        } else if (this.gameState === 'crashed') {
            ctx.textAlign = 'center'; ctx.font = '50px "Consolas", "Courier New", "Monaco", monospace'; ctx.fillStyle = '#f00';
            ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2);
        }
        if (this.gameState === 'landed' || this.gameState === 'crashed') {
            ctx.font = '20px "Consolas", "Courier New", "Monaco", monospace';
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
        ctx.fillStyle = '#fff'; ctx.font = '18px "Consolas", "Courier New", "Monaco", monospace'; ctx.textAlign = 'center';
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
    let fontsLoaded = false;
    const allImages = [
        ...Object.values(shipTypes).map(s => s.img),
        ...Object.values(dockTypes).map(d => d.img),
        spaceShipImage,
        ...planetImages,
    ];
    const totalImages = allImages.length;

    function checkAllAssetsLoaded() {
        if (imagesLoaded === totalImages && fontsLoaded) {
            console.log("All game assets loaded!");
            loadingScreen.style.display = 'none';
            startScreen.style.display = 'block';
        }
    }

    function onAssetLoad() {
        imagesLoaded++;
        console.log(`Asset loaded (${imagesLoaded}/${totalImages})`);
        checkAllAssetsLoaded();
    }

    // Font loading check
    function waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            // Modern browsers with Font Loading API
            document.fonts.ready.then(() => {
                console.log("Fonts loaded!");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                console.log("Font loading fallback completed");
                fontsLoaded = true;
                checkAllAssetsLoaded();
            }, 1000);
        }
    }

    waitForFonts();
    
    // Attach event handlers *before* setting src
    allImages.forEach(img => {
        img.onload = onAssetLoad;
        img.onerror = (e) => {
            console.error("An image failed to load:", e.target.src);
            onAssetLoad(); // Still count it as "loaded" to not block the game
        }
    });

    // Now set the src to trigger loading
    spaceShipImage.src = ASSET_BASE_URL + 'images/ship.png';
    spaceDockTerminalImage.src = ASSET_BASE_URL + 'images/spaceDockTerminal.png';
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
    Object.values(dockTypes).forEach(dock => {
        dock.img.src = ASSET_BASE_URL + dock.src;
    });
    landerScene.createStars();
    
    const spaceScene = new SpaceScene();
     document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (gameManager.activeScene === spaceScene) {
            // Calculate the new zoom level, adding 0.2 for a noticeable change
            const newZoom = spaceScene.camera.targetZoom + 0.2;
            // Use Math.min to ensure the zoom doesn't go past the maximum
            spaceScene.camera.targetZoom = Math.min(newZoom, spaceScene.maxZoom);
        }
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (gameManager.activeScene === spaceScene) {
            // Calculate the new zoom level
            const newZoom = spaceScene.camera.targetZoom - 0.2;
            // Use Math.max to ensure the zoom doesn't go past the minimum
            spaceScene.camera.targetZoom = Math.max(newZoom, spaceScene.minZoom);
        }
    });
    document.getElementById('descentBtn').addEventListener('click', () => {
        // We only want this to work if we are in the space scene and orbit is locked
        if (gameManager.activeScene === spaceScene && spaceScene.ship.isOrbitLocked) {
            console.log("Descent button clicked, changing scene.");

            // This is the same logic from the old collision check
            spaceScene.isPaused = true;
            if (thrusterSound.isLoaded) thrusterSound.pause();
            canvas.style.display = 'none';
            shipSelectionMenu.style.display = 'block';
            
            // Also hide the descent button itself
            descentUI.style.display = 'none'; 
        }
    });
// ADD THIS NEW EVENT LISTENER
    document.getElementById('startBtn').addEventListener('click', () => {
        startScreen.style.display = 'none'; // Hide the start screen
        //menu.style.display = 'block';      // Show the main menu
        // DISABLED DURING REFACTOR FOR SPACE DOCK SCENE
        //musicManager.playPlaylistForScene('menu');
        gameManager.switchScene(spaceDockScene); // Start with the Space Dock scene
    });
    document.getElementById('departBtn').addEventListener('click', () => {
        gameManager.switchScene(spaceScene, { difficulty: 'easy' }); // For now, it will always be 'easy'
    });

    document.getElementById('accessDockBtn').addEventListener('click', () => {
        // Check if the current scene is the spaceScene before switching
        if (gameManager.activeScene === spaceScene) {
            gameManager.switchScene(spaceDockScene);
        }
    });
    document.getElementById('launchBtn').addEventListener('click', () => {
    // Check if the current scene is the spaceScene and we are in orbit
    if (gameManager.activeScene === spaceScene && spaceScene.ship.inStableOrbit) {
        // Use the existing settings to switch to the lander scene
        settings.selectedShip = shipTypes.classic;
        gameManager.switchScene(landerScene, settings);
    }
    });
    document.getElementById('easyBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'easy' }));
    document.getElementById('mediumBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'medium' }));
    document.getElementById('hardBtn').addEventListener('click', () => gameManager.switchScene(spaceScene, { difficulty: 'hard' }));

    // Mute button click handler
    document.getElementById('muteBtn').addEventListener('click', () => {
        const isMuted = musicManager.toggleMute();
        const btn = document.getElementById('muteBtn');
        btn.textContent = isMuted ? '♪̷' : '♪';
        btn.blur(); // Remove focus to prevent space bar from triggering this button
    });

    shipSelectionMenu.addEventListener('click', (event) => {
        const shipOption = event.target.closest('.ship-option');
        if (!shipOption) return;
        
        const shipName = shipOption.getAttribute('data-ship');
        settings.selectedShip = shipTypes[shipName];
        gameManager.switchScene(landerScene, settings);
    });
    
    window.addEventListener('keydown', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, true); }});
    window.addEventListener('keyup', e => { if (gameManager.activeScene?.handleKeys) { gameManager.activeScene.handleKeys(e, false); }});
    
    // Global mute key handler - M key toggles music
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            e.preventDefault(); // Prevent any other handlers from processing this key
            const isMuted = musicManager.toggleMute();
            // Update the button display if it exists
            const muteBtn = document.getElementById('muteBtn');
            if (muteBtn) {
                muteBtn.textContent = isMuted ? '♪̷' : '♪';
            }
        }
    });
    
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
    canvas.addEventListener('wheel', event => {
    // First, prevent the browser from scrolling the whole page
    event.preventDefault();

    // Only apply zoom if we are in the space scene
    if (gameManager.activeScene === spaceScene) {
        // Determine zoom direction (deltaY is negative for scroll up, positive for scroll down)
        const zoomAmount = 0.1;
        let newZoom;

        if (event.deltaY < 0) {
            // Scrolling up -> Zoom In
            newZoom = spaceScene.camera.targetZoom + zoomAmount;
        } else {
            // Scrolling down -> Zoom Out
            newZoom = spaceScene.camera.targetZoom - zoomAmount;
        }

        // Clamp the zoom level to the min/max values to prevent extreme zooming
        spaceScene.camera.targetZoom = Math.max(spaceScene.minZoom, Math.min(newZoom, spaceScene.maxZoom));
    }
}, { passive: false }); // passive: false is needed to allow preventDefault
    
    // Start the main game loop
    gameManager.loop();
}

// Run the game
init();
