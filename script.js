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

const backgroundMusic = createSound('sounds/musictrek.mp3', true, 0.3);
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
        scene.start(settings);
    }
};

// --- Space Scene ---
const spaceScene = {
    ship: null, stars: [], difficulty: 'easy', isPaused: false,
    WORLD_WIDTH: canvas.width * 20, WORLD_HEIGHT: canvas.height * 20,
    THRUST_POWER: 0.1, ROTATION_SPEED: 0.05,
    Ship: class {
        constructor(x, y) {
            this.x = x; this.y = y; this.velX = 0; this.velY = 0;
            this.angle = -Math.PI / 2;
            this.rotation = 0; this.thrusting = false;
            this.width = 100; // Adjusted for better visibility
            this.height = 120;
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
                this.velX += spaceScene.THRUST_POWER * Math.cos(this.angle);
                this.velY += spaceScene.THRUST_POWER * Math.sin(this.angle);
            }
            this.velX *= 0.99; this.velY *= 0.99;
            this.x += this.velX; this.y += this.velY;
            // World boundary checks
            if (this.x < 0 || this.x > spaceScene.WORLD_WIDTH || this.y < 0 || this.y > spaceScene.WORLD_HEIGHT) {
                this.x = Math.max(0, Math.min(this.x, spaceScene.WORLD_WIDTH));
                this.y = Math.max(0, Math.min(this.y, spaceScene.WORLD_HEIGHT));
                this.velX = 0; this.velY = 0;
            }
        }
    },
    createStars() {
        this.stars = [];
        for (let i = 0; i < 2000; i++) {
            this.stars.push({ x: Math.random() * this.WORLD_WIDTH, y: Math.random() * this.WORLD_HEIGHT, radius: Math.random() * 1.5 });
        }
    },
    createPlanets() {
        celestialBodies = [];
        const numPlanets = 5;
        const minDistance = 400; 
        let attempts = 0; 
        // New: Define a clear range for planet sizes
        const minRadius = 80;  // Allows for smaller planets
        const maxRadius = 300; // Allows for larger planets

        while (celestialBodies.length < numPlanets && attempts < 1000) {
            let newPlanet = {
                x: Math.random() * this.WORLD_WIDTH * 0.8 + this.WORLD_WIDTH * 0.1,
                y: Math.random() * this.WORLD_HEIGHT * 0.8 + this.WORLD_HEIGHT * 0.1,
                // New: Use our min/max variables to calculate a random radius within the new range
                radius: Math.random() * (maxRadius - minRadius) + minRadius,
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
    },
    start(settings) {
        console.log("Starting Space Scene...");
        this.difficulty = settings.difficulty;
        this.ship = new this.Ship(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2);
        this.isPaused = false;
        menu.style.display = 'none';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';
        if (backgroundMusic.isLoaded) { backgroundMusic.currentTime = 0; backgroundMusic.play().catch(e => console.error("Music play failed:", e)); }
        if (!this.stars.length) { this.createStars(); this.createPlanets(); }
    },
    stop() {
        if (thrusterSound.isLoaded) thrusterSound.pause();
    },
    update() {
        if (!this.ship || this.isPaused) return;
        this.ship.update();
        for (const planet of celestialBodies) {
            const dist = Math.hypot(this.ship.x - planet.x, this.ship.y - planet.y);
            if (dist < planet.radius) {
                console.log("Approaching planet, showing ship selection...");
                this.isPaused = true;
                if (thrusterSound.isLoaded) thrusterSound.pause();
                canvas.style.display = 'none'; // Hide canvas
                shipSelectionMenu.style.display = 'block'; // Show ship selection
            }
        }
    },
    draw() {
        if (!this.ship || this.isPaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        const viewWidth = canvas.width; const viewHeight = canvas.height;
        const minCameraX = viewWidth / 2; const maxCameraX = this.WORLD_WIDTH - viewWidth / 2;
        const minCameraY = viewHeight / 2; const maxCameraY = this.WORLD_HEIGHT - viewHeight / 2;
        let cameraX = Math.max(minCameraX, Math.min(this.ship.x, maxCameraX));
        let cameraY = Math.max(minCameraY, Math.min(this.ship.y, maxCameraY));
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.translate(-cameraX, -cameraY);
        ctx.fillStyle = 'white';
        this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        celestialBodies.forEach(p => { ctx.drawImage(p.image, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2); });
        this.ship.draw();
        ctx.restore();
    },
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
    lander: null, terrain: null, particles: [], stars: [],
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
        if (distance < 250 && this.zoomLevel === this.ZOOM_IN) return;
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
            if (this.zoomLevel === this.ZOOM_IN && (this.lander.x < zoomOutZone.left || this.lander.x > zoomOutZone.right)) this.zoomLevel = this.ZOOM_OUT;
            else if (this.zoomLevel === this.ZOOM_OUT && (this.lander.x > zoomOutZone.left && this.lander.x < zoomOutZone.right)) this.zoomLevel = this.ZOOM_IN;
        }
        this.particles.forEach((p, i) => { p.update(); if (p.lifespan <= 0) this.particles.splice(i, 1); });
    },
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        const viewWidth = canvas.width / this.zoomLevel; const viewHeight = canvas.height / this.zoomLevel;
        const minCameraX = viewWidth / 2; const maxCameraX = this.WORLD_WIDTH - viewWidth / 2;
        const minCameraY = viewHeight / 2; const maxCameraY = this.WORLD_HEIGHT - viewHeight / 2;
        let cameraX = Math.max(minCameraX, Math.min(this.lander.x, maxCameraX));
        let cameraY = Math.max(minCameraY, Math.min(this.lander.y, maxCameraY));
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.translate(-cameraX, -cameraY);
        this.drawWorld();
        this.lander.draw();
        this.particles.forEach(p => p.draw());
        ctx.restore();
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
        this.particles = [];
        this.zoomLevel = this.ZOOM_IN;
        this.gameState = 'playing';
        shipSelectionMenu.style.display = 'none';
        canvas.style.display = 'block';
        if (backgroundMusic.isLoaded) { backgroundMusic.currentTime = 0; backgroundMusic.play().catch(e => console.error("Music play failed:", e)); }
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
    planetImages[0].src = ASSET_BASE_URL + 'images/planet1.png';
    planetImages[1].src = ASSET_BASE_URL + 'images/planet2.png';
    planetImages[2].src = ASSET_BASE_URL + 'images/planet3.png';
    Object.values(shipTypes).forEach(ship => {
        ship.img.src = ASSET_BASE_URL + ship.src;
    });
    
    landerScene.createStars();
    
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
            if (backgroundMusic.isLoaded) backgroundMusic.pause();
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
