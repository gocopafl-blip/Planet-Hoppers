// --- Lander Scene ---
const landerScene = {
    name: 'lander', // Give the scene a name for the MusicManager
    isReady: false,
    backgroundImage: null,
    lander: null, terrain: null, particles: [], stars: [], camera: null,
    baseGravity: 0, difficultySettings: null, selectedShip: null,
    gameState: 'playing', zoomLevel: 1.5,
    defaultZoom: 0.5,
    ZOOM_IN: 1.5,
    ZOOM_OUT: 0.75,
    minZoom: 0.5,
    maxZoom: 2.0,
    WORLD_WIDTH: canvas.width * 3,
    WORLD_HEIGHT: canvas.height * 3,
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
        if (this.backgroundImage && this.backgroundImage.complete) {
            // Calculate 16:9 aspect ratio dimensions that fit the world
            const aspectRatio = 16 / 9;
            const worldAspectRatio = this.WORLD_WIDTH / this.WORLD_HEIGHT;

            let bgWidth, bgHeight, bgX, bgY;

            if (worldAspectRatio > aspectRatio) {
                // World is wider than 16:9, fit to width
                bgWidth = this.WORLD_WIDTH;
                bgHeight = bgWidth / aspectRatio;
                bgX = 0;
                bgY = (this.WORLD_HEIGHT - bgHeight) / 2;
            } else {
                // World is taller than 16:9, fit to height
                bgHeight = this.WORLD_HEIGHT;
                bgWidth = bgHeight * aspectRatio;
                bgX = (this.WORLD_WIDTH - bgWidth) / 2;
                bgY = 0;
            }

            ctx.drawImage(this.backgroundImage, bgX, bgY, bgWidth, bgHeight);
        } else {
            // Only draw stars if there's no background image
            ctx.fillStyle = 'white';
            this.stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); });
        }
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
            ctx.fillText('SUCCESS!', canvas.width / 2, canvas.height / 2);
        } else if (this.gameState === 'crashed') {
            ctx.textAlign = 'center'; ctx.font = '50px "Consolas", "Courier New", "Monaco", monospace'; ctx.fillStyle = '#f00';
            ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2);
        }
        if (this.gameState === 'landed' || this.gameState === 'crashed') {
            ctx.font = '20px "Consolas", "Courier New", "Monaco", monospace';
            ctx.fillStyle = '#fff';
            const returnText = this.gameState === 'landed' ? 'Click to return to ship' : 'Click to return to menu';
            ctx.fillText(returnText, canvas.width / 2, canvas.height / 2 + 40);
        }
    },
    getAltitude() {
        if (!this.terrain) return this.WORLD_HEIGHT;
        let groundY = this.WORLD_HEIGHT;
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            if (this.lander.x >= this.terrain.points[i].x && this.lander.x < this.terrain.points[i + 1].x) {
                groundY = this.terrain.points[i].y;
                break;
            }
        }
        return Math.floor(groundY - this.lander.y - this.lander.height / 2);
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
        // If the gate is closed, do nothing.
        if (!this.isReady) return;
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
            /*const zoomOutZone = { left: this.terrain.padStart - canvas.width * 0.2, right: this.terrain.padEnd + canvas.width * 0.2 };
            if (this.camera.targetZoom === this.ZOOM_IN && (this.lander.x < zoomOutZone.left || this.lander.x > zoomOutZone.right)) {
                this.camera.targetZoom = this.ZOOM_OUT;
            } else if (this.camera.targetZoom === this.ZOOM_OUT && (this.lander.x > zoomOutZone.left && this.lander.x < zoomOutZone.right)) {
                this.camera.targetZoom = this.ZOOM_IN;
            }*/
        }
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifespan > 0;
        });
        missionManager.completeMission(this);
    },
    draw() {
        if (!this.isReady) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Optional: You could draw "Loading..." text here
            ctx.fillStyle = 'white';
            ctx.font = '20px "Consolas"';
            ctx.textAlign = 'center';
            ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2);
            return;
        }
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
        this.isReady = false;
        this.selectedShip = settings.selectedShip;
        const difficulty = settings.difficulty;
        switch (difficulty) {
            case 'easy': this.difficultySettings = { gravity: 0.008, fuel: 1000, safeSpeed: 1.5, padWidth: 140 }; break;
            case 'medium': this.difficultySettings = { gravity: 0.01, fuel: 700, safeSpeed: 1.0, padWidth: 100 }; break;
            case 'hard': this.difficultySettings = { gravity: 0.012, fuel: 500, safeSpeed: 0.7, padWidth: 60 }; break;
        }
        console.log('Lander scene settings:', settings);
        console.log('Planet data:', settings.planet);

        // --- IMAGE LOADING LOGIC ---
        if (settings.planet && settings.planet.backgroundOptions) {
            console.log('Background options found:', settings.planet.backgroundOptions);
            const backgrounds = settings.planet.backgroundOptions;
            const randomIndex = Math.floor(Math.random() * backgrounds.length);
            const randomBackgroundKey = backgrounds[randomIndex];
            console.log('Selecting background key:', randomBackgroundKey);

            // Try to get a preloaded image from the AssetManager
            const preloadedBg = assetManager.getImage(randomBackgroundKey);
            if (preloadedBg) {
                this.backgroundImage = preloadedBg;
                console.log('Using preloaded background image.');
                this.isReady = true;
            } else {
                console.warn(`Background image for key '${randomBackgroundKey}' was not preloaded. Falling back to lazy load.`);
                const randomBackgroundSrc = assetCatalogue.images[randomBackgroundKey];
                if (randomBackgroundSrc) {
                    this.backgroundImage = new Image();
                    this.backgroundImage.src = randomBackgroundSrc;
                    this.backgroundImage.onload = () => {
                        console.log(`Lander background (lazy) loaded successfully.`);
                        this.isReady = true;
                    };
                    this.backgroundImage.onerror = () => {
                        console.error(`Failed to load lander background (lazy): ${randomBackgroundSrc}`);
                        this.backgroundImage = null;
                        this.isReady = true;
                    };
                } else {
                    console.error(`No asset path found for background key: ${randomBackgroundKey}`);
                    this.backgroundImage = null;
                    this.isReady = true;
                }
            }
        } else {
            console.log('No background options found, using starry background');
            this.backgroundImage = null; // No background if no planet data is provided
            this.isReady = true; // Open the gate immediately if there's nothing to load.
        }
        this.baseGravity = this.difficultySettings.gravity;
        this.generateTerrain();
        this.lander = new this.Lander(this.WORLD_WIDTH / 2, 150, this.difficultySettings.fuel, this.selectedShip);
        this.camera = new Camera(this.lander, this.WORLD_WIDTH, this.WORLD_HEIGHT, {
            followSmoothing: 0.08, // A slightly slower, smoother follow for the lander
            zoomSmoothing: 0.04    // A custom zoom speed for the lander scene
        });
        this.camera.targetZoom = this.defaultZoom;
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