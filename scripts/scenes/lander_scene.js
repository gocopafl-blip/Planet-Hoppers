// --- Lander Scene ---
const landerScene = {
    name: 'lander', // Give the scene a name for the MusicManager
    isReady: false,
    backgroundImage: null,
    lander: null, terrain: null, particles: [], stars: [], camera: null,
    planet: null, planetSettings: null, windPhase: 0,
    windStreaks: [], windSignHistory: [],
    windDisplay: { label: 'Calm', kts: 0, direction: 1 },
    seismicOffsetX: 0, seismicOffsetY: 0,
    baseGravity: 0, selectedShip: null,
    WIND_KTS_SCALE: 3.5,
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
            landerScene.applyWindForce(this);
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

    WindStreak: class {
        constructor(x, y, direction, speed, length) {
            this.x = x;
            this.y = y;
            this.direction = direction;
            this.speed = speed;
            this.length = length;
            this.lifespan = 35 + Math.floor(Math.random() * 25);
            this.alpha = 0.2 + Math.random() * 0.35;
        }
        update() {
            this.x += this.direction * this.speed;
            this.lifespan--;
        }
        draw() {
            const a = this.alpha * (this.lifespan / 60);
            ctx.save();
            ctx.strokeStyle = `rgba(210, 230, 255, ${Math.min(1, a)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.direction * this.length, this.y + this.length * 0.08);
            ctx.stroke();
            ctx.restore();
        }
    },

    updateWindState() {
        const ps = this.planetSettings;
        if (!ps || ps.windMax <= 0) {
            this.windDisplay = { label: 'Calm', kts: 0, direction: 1 };
            this.currentWindAccel = 0;
            return;
        }

        this.windPhase += 0.018;
        const t = (Math.sin(this.windPhase) + 1) * 0.5;
        const strength = LanderWorldGenerator.lerp(ps.windMin, ps.windMax, t);
        const gustSign = Math.sin(this.windPhase * 2.7) >= 0 ? 1 : -1;

        this.windSignHistory.push(gustSign);
        if (this.windSignHistory.length > 40) this.windSignHistory.shift();

        let signChanges = 0;
        for (let i = 1; i < this.windSignHistory.length; i++) {
            if (this.windSignHistory[i] !== this.windSignHistory[i - 1]) signChanges++;
        }

        const kts = Math.max(1, Math.round(strength * this.WIND_KTS_SCALE));
        const variable = ps.windGusty && (signChanges >= 7 || strength > ps.windMin + (ps.windMax - ps.windMin) * 0.65);

        if (variable) {
            this.windDisplay = { label: 'Variable & Gusty', kts, direction: gustSign };
        } else if (gustSign > 0) {
            this.windDisplay = { label: `East at ${kts} Kts`, kts, direction: 1 };
        } else {
            this.windDisplay = { label: `West at ${kts} Kts`, kts, direction: -1 };
        }

        this.currentWindAccel = gustSign * strength * 0.0018;
    },

    applyWindForce(lander) {
        this.updateWindState();
        if (this.currentWindAccel) lander.velX += this.currentWindAccel;
    },

    updateSeismicShake() {
        const intensity = this.planetSettings?.seismicIntensity || 0;
        if (intensity <= 0) {
            this.seismicOffsetX = 0;
            this.seismicOffsetY = 0;
            return;
        }
        if (Math.random() < 0.14 + intensity * 0.06) {
            this.seismicOffsetX = (Math.random() - 0.5) * intensity * 10;
            this.seismicOffsetY = (Math.random() - 0.5) * intensity * 5;
        } else {
            this.seismicOffsetX *= 0.82;
            this.seismicOffsetY *= 0.82;
        }
    },

    _withSeismicOffset(drawFn) {
        ctx.save();
        ctx.translate(this.seismicOffsetX, this.seismicOffsetY);
        drawFn();
        ctx.restore();
    },

    updateWindStreaks() {
        const wd = this.windDisplay;
        if (!wd || wd.kts < 4 || this.gameState !== 'playing') return;

        const spawnRate = Math.min(0.35, 0.08 + wd.kts * 0.008);
        if (Math.random() > spawnRate) return;

        const dir = wd.direction || 1;
        const zoom = this.camera?.zoomLevel || 1;
        const viewW = canvas.width / zoom;
        const viewH = canvas.height / zoom;
        const spawnX = this.lander.x + (dir > 0 ? -viewW * 0.55 : viewW * 0.55) + (Math.random() - 0.5) * 80;
        const spawnY = this.lander.y + (Math.random() - 0.5) * viewH * 0.9;

        this.windStreaks.push(new this.WindStreak(
            spawnX,
            spawnY,
            dir,
            2.5 + wd.kts * 0.12,
            40 + wd.kts * 2
        ));
    },

    initWorld() {
        this.planetSettings = LanderWorldGenerator.buildPlanetSettings(this.planet);
        this.terrain = LanderWorldGenerator.buildWorld(
            this.planet,
            this.WORLD_WIDTH,
            this.WORLD_HEIGHT,
            this.planetSettings
        );
        this.baseGravity = this.planetSettings.gravity;
        console.log('Lander world:', this.terrain.mode, 'pads:', this.terrain.pads.length, this.planetSettings);
    },

    updateFloatingPads() {
        if (!this.terrain?.floatingPads) return;
        const pads = this.terrain.floatingPads;
        for (const pad of pads) {
            pad.phase += 0.014;
            pad.x += pad.velX + Math.sin(pad.phase) * 0.12;
            pad.y += pad.velY + Math.cos(pad.phase * 0.65) * 0.08;
            if (pad.x < 40) { pad.x = 40; pad.velX = Math.abs(pad.velX); }
            if (pad.x + pad.width > this.WORLD_WIDTH - 40) {
                pad.x = this.WORLD_WIDTH - 40 - pad.width;
                pad.velX = -Math.abs(pad.velX);
            }
            if (pad.y < this.WORLD_HEIGHT * 0.32) { pad.y = this.WORLD_HEIGHT * 0.32; pad.velY = Math.abs(pad.velY); }
            if (pad.y > this.WORLD_HEIGHT * 0.72) { pad.y = this.WORLD_HEIGHT * 0.72; pad.velY = -Math.abs(pad.velY); }
        }
        this.terrain.pads = pads.map(p => ({
            id: p.id,
            padStart: p.x,
            padEnd: p.x + p.width,
            y: p.y
        }));
    },

    getNearestPad() {
        if (!this.terrain?.pads?.length || !this.lander) return null;
        let best = this.terrain.pads[0];
        let bestDist = Infinity;
        for (const pad of this.terrain.pads) {
            const cx = (pad.padStart + pad.padEnd) / 2;
            const d = Math.hypot(cx - this.lander.x, pad.y - this.lander.y);
            if (d < bestDist) { bestDist = d; best = pad; }
        }
        return best;
    },

    isOnAnyPad() {
        if (!this.lander || !this.terrain?.pads) return false;
        const bottom = this.lander.y + this.lander.height / 2;
        if (this.terrain.mode === 'gas') {
            return this.terrain.floatingPads.some(pad =>
                this.lander.x >= pad.x && this.lander.x <= pad.x + pad.width &&
                bottom >= pad.y - 4 && bottom <= pad.y + pad.height + 10
            );
        }
        return this.terrain.pads.some(pad =>
            this.lander.x > pad.padStart && this.lander.x < pad.padEnd
        );
    },
    triggerCrash() {
        if (!this.lander.crashed) {
            this.gameState = 'crashed';
            if (typeof thrusterSound !== 'undefined' && thrusterSound && thrusterSound.isLoaded) thrusterSound.pause();
            if (typeof explosionSound !== 'undefined' && explosionSound && explosionSound.isLoaded) { 
                explosionSound.currentTime = 0; 
                explosionSound.play().catch(e => console.error("Explosion sound failed:", e)); 
            }
            for (let i = 0; i < 50; i++) this.particles.push(new this.Particle(this.lander.x, this.lander.y, false));
            this.lander.crashed = true;
        }
    },
    drawWorld() {
        this._withSeismicOffset(() => this._drawWorldContent());
    },

    _drawWorldContent() {
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
        if (this.terrain.mode === 'gas') {
            this._drawGasPads(ctx);
            return;
        }

        const style = this.terrain.style || {};
        if (this.terrain.waterRects?.length) {
            ctx.fillStyle = 'rgba(30, 80, 140, 0.75)';
            for (const w of this.terrain.waterRects) {
                ctx.fillRect(w.x, w.y, w.width, w.height);
            }
        }

        ctx.strokeStyle = style.stroke || '#444';
        ctx.fillStyle = style.fill || '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.terrain.points[0].x, this.terrain.points[0].y);
        this.terrain.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(this.WORLD_WIDTH, this.WORLD_HEIGHT + 50);
        ctx.lineTo(0, this.WORLD_HEIGHT + 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (const pad of this.terrain.pads) {
            const padY = pad.y ?? this.terrain.points.find(p => p.x >= pad.padStart)?.y;
            if (padY == null) continue;
            if (style.padFill) {
                ctx.fillStyle = style.padFill;
                ctx.fillRect(pad.padStart, padY - 6, pad.padEnd - pad.padStart, 10);
            }
            ctx.strokeStyle = style.padStroke || '#0f0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pad.padStart, padY);
            ctx.lineTo(pad.padEnd, padY);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '14px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`PAD ${pad.id}`, (pad.padStart + pad.padEnd) / 2, padY - 14);
        }
    },

    _drawGasPads(ctx) {
        const style = this.terrain.style || {};
        for (const pad of this.terrain.floatingPads) {
            ctx.fillStyle = style.padGlow || 'rgba(100, 150, 255, 0.2)';
            ctx.fillRect(pad.x - 8, pad.y - 8, pad.width + 16, pad.height + 20);
            ctx.fillStyle = style.padFill || 'rgba(180, 200, 255, 0.4)';
            ctx.strokeStyle = style.padStroke || '#9cf';
            ctx.lineWidth = 3;
            ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
            ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
            ctx.fillStyle = '#eef';
            ctx.font = '14px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`CLOUD ${pad.id}`, pad.x + pad.width / 2, pad.y - 10);
        }
    },
    drawUI() {
        ctx.fillStyle = '#fff'; ctx.font = '18px "Consolas", "Courier New", "Monaco", monospace'; ctx.textAlign = 'left';
        const typeLabel = this.planetSettings?.planetTypeId || 'unknown';
        ctx.fillText(`WORLD: ${typeLabel.replace('_', ' ')}`, 20, 30);
        ctx.fillText(`FUEL: ${Math.floor(this.lander.fuel)}`, 20, 55);
        ctx.fillText(`ALTITUDE: ${Math.floor(this.getAltitude())}m`, 20, 85);
        const gravG = this.planetSettings?.gravityG?.toFixed(2) || '?';
        ctx.fillText(`GRAVITY: ${gravG} G`, 20, 115);
        const windLabel = this.windDisplay?.label || 'Calm';
        ctx.fillText(`WIND: ${windLabel}`, 20, 145);
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
        if (!this.terrain || !this.lander) return this.WORLD_HEIGHT;
        const bottom = this.lander.y + this.lander.height / 2;

        if (this.terrain.mode === 'gas') {
            let best = Infinity;
            for (const pad of this.terrain.floatingPads) {
                if (this.lander.x < pad.x || this.lander.x > pad.x + pad.width) continue;
                best = Math.min(best, pad.y - bottom);
            }
            return Math.floor(best === Infinity ? this.WORLD_HEIGHT * 0.4 : best);
        }

        let groundY = this.WORLD_HEIGHT;
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            if (this.lander.x >= this.terrain.points[i].x && this.lander.x < this.terrain.points[i + 1].x) {
                groundY = this.terrain.points[i].y;
                break;
            }
        }
        return Math.floor(groundY - bottom);
    },

    drawCompass() {
        if (this.gameState !== 'playing' || !this.terrain) return;
        const pad = this.getNearestPad();
        if (!pad) return;
        const padCenter = {
            x: (pad.padStart + pad.padEnd) / 2,
            y: pad.y ?? this.terrain.points?.find(p => p.x >= pad.padStart)?.y
        };
        if (padCenter.y == null) return;
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
            if (this.terrain.mode === 'gas') this.updateFloatingPads();
            this.lander.update();
            this.updateSeismicShake();
            this.camera.update();
            this.updateWindStreaks();
            this.lander.emitThrusterParticles();
            if (this.lander.x < 0 || this.lander.x > this.WORLD_WIDTH || this.lander.y < 0) this.triggerCrash();
            if (this.terrain.mode === 'gas' && this.lander.y > this.WORLD_HEIGHT * 0.88) {
                this.triggerCrash();
            } else if (this.getAltitude() <= 0) {
                const onPad = this.isOnAnyPad();
                const safe = this.planetSettings.safeSpeed;
                const safeSpeed = this.lander.velY < safe && Math.abs(this.lander.velX) < safe;
                const upright = Math.abs(this.lander.angle - (-Math.PI / 2)) < 0.2;
                if (onPad && safeSpeed && upright) {
                    this.gameState = 'landed';
                    if (typeof thrusterSound !== 'undefined' && thrusterSound && thrusterSound.isLoaded) thrusterSound.pause();
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
        this.windStreaks = this.windStreaks.filter(s => {
            s.update();
            return s.lifespan > 0;
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
        this._withSeismicOffset(() => {
            this.windStreaks.forEach(s => s.draw());
        });
        this.lander.draw();
        this.particles.forEach(p => p.draw());

        this.camera.end(ctx);

        this.drawCompass();
        this.drawUI();
    },
    start(settings) {
        console.log("Starting Lander Scene...");
        this.isReady = false;
        
        // Validate and set selectedShip, default to classic if not provided
        if (!settings.selectedShip || !settings.selectedShip.width || !settings.selectedShip.img) {
            console.warn('Invalid or missing selectedShip in settings, defaulting to classic');
            // Use shipTypes if available, otherwise create a minimal fallback
            if (typeof shipTypes !== 'undefined' && shipTypes.classic) {
                this.selectedShip = shipTypes.classic;
            } else {
                // Minimal fallback if shipTypes isn't available (shouldn't happen in normal flow)
                this.selectedShip = { width: 80, height: 80, img: new Image(), thrusterOffset: 40 };
            }
        } else {
            this.selectedShip = settings.selectedShip;
        }
        
        this.planet = settings.planet || null;
        this.windPhase = Math.random() * Math.PI * 2;
        this.windStreaks = [];
        this.windSignHistory = [];
        this.windDisplay = { label: 'Calm', kts: 0, direction: 1 };
        this.currentWindAccel = 0;
        this.seismicOffsetX = 0;
        this.seismicOffsetY = 0;
        console.log('Lander scene settings:', settings);
        console.log('Planet data:', this.planet);

        // --- IMAGE LOADING LOGIC ---
        const dna = LanderWorldGenerator.resolvePlanetDNA(this.planet);
        const backgrounds = (this.planet && this.planet.backgroundOptions) ||
            dna.landerBackgrounds ||
            ['earth_planet_a'];
        if (backgrounds && backgrounds.length) {
            console.log('Background options found:', backgrounds);
            const bgRng = LanderWorldGenerator.createRng(
                LanderWorldGenerator.hashSeed((this.planet?.id || this.planet?.name || 'default') + '-bg')
            );
            const randomIndex = Math.floor(bgRng() * backgrounds.length);
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
        this.initWorld();
        this.lander = new this.Lander(this.WORLD_WIDTH / 2, 150, this.planetSettings.fuel, this.selectedShip);
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
        if (typeof thrusterSound !== 'undefined' && thrusterSound && thrusterSound.isLoaded) {
            if (newThrusting && !oldThrusting) { thrusterSound.currentTime = 0; thrusterSound.play().catch(e => console.error("Thruster sound play failed:", e)); }
            else if (!newThrusting && oldThrusting) { thrusterSound.pause(); }
        }
    },
    stop() {
        console.log("Stopping Lander Scene...");
    }
};