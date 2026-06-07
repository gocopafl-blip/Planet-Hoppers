// scripts/lander/lander_world_generator.js
// Seeded lander terrain / pad generation from planet type + instance id.

// 1.0 G in physics units. Max 2.5G keeps descent controllable with standard lander thrust (~0.035).
const LANDER_STANDARD_G = 0.01;
const LANDER_GRAVITY_G_MIN = 0.5;
const LANDER_GRAVITY_G_MAX = 2.5;

const LanderWorldGenerator = {
    hashSeed(str) {
        let h = 2166136261;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    },

    createRng(seed) {
        let a = seed >>> 0;
        return function random() {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    lerp(min, max, t) {
        return min + (max - min) * t;
    },

    pickRange(rng, range) {
        return this.lerp(range.min, range.max, rng());
    },

    clampG(g) {
        return Math.max(LANDER_GRAVITY_G_MIN, Math.min(LANDER_GRAVITY_G_MAX, g));
    },

    gToAccel(gravityG) {
        return this.clampG(gravityG) * LANDER_STANDARD_G;
    },

    /** Pick terrain segment index for pad center (not always world center). */
    pickPadSegmentIndex(rng, worldWidth, padWidth, step) {
        const margin = padWidth + 280;
        const minCenter = margin;
        const maxCenter = worldWidth - margin;
        const padCenterX = this.lerp(minCenter, maxCenter, rng());
        const maxIndex = Math.floor(worldWidth / step);
        return Math.max(2, Math.min(maxIndex - 2, Math.floor(padCenterX / step)));
    },

    resolvePlanetDNA(planet) {
        const typeId = planet?.planetTypeId || 'terran_world';
        return planetCatalogue[typeId] || planetCatalogue.terran_world;
    },

    buildPlanetSettings(planet) {
        const dna = this.resolvePlanetDNA(planet);
        const terrainCfg = dna.landerTerrain || planetCatalogue.terran_world.landerTerrain;
        const seedKey = planet?.id || planet?.name || dna.planetTypeId || 'default';
        const rng = this.createRng(this.hashSeed(seedKey));

        const danger = dna.dangerLevel ?? 1;
        const safeSpeedScale = 1 - Math.min(danger, 10) * 0.03;
        const gravityGRange = dna.gravityG || { min: 0.9, max: 1.2 };
        const gravityG = this.clampG(this.pickRange(rng, gravityGRange));
        const windMin = dna.wind?.min ?? 0;
        const windMax = dna.wind?.max ?? 0;
        const seismicStability = dna.seismicStability ?? 1;
        const seismicIntensity = terrainCfg.mode === 'volcanic'
            ? (1 - seismicStability) * 2.8
            : 0;

        return {
            planetTypeId: dna.planetTypeId,
            terrainMode: terrainCfg.mode === 'gas' ? 'gas' : terrainCfg.mode,
            gravityG,
            gravity: this.gToAccel(gravityG),
            windMin,
            windMax,
            windGusty: (windMax - windMin) >= 6,
            fuel: Math.round(this.pickRange(rng, terrainCfg.fuel)),
            safeSpeed: this.pickRange(rng, terrainCfg.safeSpeed) * safeSpeedScale,
            islandChance: terrainCfg.islandChance ?? 0,
            padDrift: terrainCfg.padDrift
                ? this.pickRange(rng, terrainCfg.padDrift)
                : 0.25,
            seismicIntensity,
            rng,
            seedKey
        };
    },

    buildWorld(planet, worldWidth, worldHeight, planetSettings) {
        const dna = this.resolvePlanetDNA(planet);
        const terrainCfg = dna.landerTerrain || planetCatalogue.terran_world.landerTerrain;
        const rng = planetSettings.rng || this.createRng(this.hashSeed(planetSettings.seedKey));

        if (terrainCfg.mode === 'gas') {
            return this._buildGasWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings);
        }
        if (terrainCfg.mode === 'volcanic') {
            return this._buildVolcanicWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings);
        }
        const useIsland = rng() < (terrainCfg.islandChance ?? 0);
        return this._buildTerranWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings, useIsland);
    },

    _makePadId(index) {
        return index + 1;
    },

    _buildGasWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings) {
        const padCount = Math.floor(this.lerp(
            terrainCfg.padCount.min,
            terrainCfg.padCount.max + 0.999,
            rng()
        ));
        const padWidth = this.pickRange(rng, terrainCfg.padWidth);
        const padHeight = 24;
        const baseY = worldHeight * 0.55;
        const slots = padCount === 1
            ? [0.22 + rng() * 0.56]
            : [0.18 + rng() * 0.22, 0.58 + rng() * 0.22];

        const floatingPads = slots.map((frac, i) => {
            const x = worldWidth * frac - padWidth / 2;
            const y = baseY + (rng() - 0.5) * 80;
            const drift = planetSettings.padDrift;
            return {
                id: this._makePadId(i),
                x,
                y,
                width: padWidth,
                height: padHeight,
                velX: (rng() - 0.5) * drift,
                velY: (rng() - 0.5) * drift * 0.4,
                phase: rng() * Math.PI * 2
            };
        });

        return {
            mode: 'gas',
            points: null,
            pads: floatingPads.map(p => ({
                id: p.id,
                padStart: p.x,
                padEnd: p.x + p.width,
                y: p.y
            })),
            floatingPads,
            style: {
                sky: true,
                padFill: 'rgba(200, 220, 255, 0.35)',
                padStroke: '#aaf',
                padGlow: 'rgba(120, 180, 255, 0.25)'
            },
            waterRects: []
        };
    },

    _buildTerranWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings, useIsland) {
        const step = 20;
        const padWidth = Math.round(this.pickRange(rng, terrainCfg.padWidth));
        const padIndex = this.pickPadSegmentIndex(rng, worldWidth, padWidth, step);
        const baseGround = worldHeight - rng() * 120 - 80;

        const points = [];
        let y = baseGround;
        const rollAmp = useIsland ? 18 : 28;
        const rollFreq = 0.004 + rng() * 0.003;

        for (let x = 0; x <= worldWidth; x += step) {
            y += Math.sin(x * rollFreq) * rollAmp * 0.15 + (rng() - 0.5) * (useIsland ? 8 : 14);
            y = Math.max(worldHeight - 320, Math.min(worldHeight - 45, y));
            points.push({ x, y });
        }

        const padY = points[padIndex].y;
        const halfSegments = Math.ceil(padWidth / step / 2);
        for (let i = -halfSegments; i <= halfSegments; i++) {
            const idx = padIndex + i;
            if (points[idx]) points[idx].y = padY;
        }

        const waterRects = [];
        const waterLevel = worldHeight - 40;

        if (useIsland) {
            const islandHalfWidth = padWidth * 1.8 + rng() * 120;
            const padCenterX = points[padIndex].x + padWidth / 2;
            for (let p of points) {
                const dist = Math.abs(p.x - padCenterX);
                if (dist > islandHalfWidth) {
                    p.y = Math.max(p.y, waterLevel - 20 + rng() * 15);
                }
            }
            waterRects.push({
                x: 0,
                y: waterLevel,
                width: padCenterX - islandHalfWidth,
                height: worldHeight - waterLevel + 60
            });
            waterRects.push({
                x: padCenterX + islandHalfWidth,
                y: waterLevel,
                width: worldWidth - (padCenterX + islandHalfWidth),
                height: worldHeight - waterLevel + 60
            });
        } else {
            const lakeX = rng() * worldWidth * 0.4;
            const lakeW = 80 + rng() * 200;
            if (lakeX < points[padIndex].x - padWidth || lakeX > points[padIndex].x + padWidth * 2) {
                waterRects.push({
                    x: lakeX,
                    y: waterLevel + 30,
                    width: lakeW,
                    height: worldHeight - waterLevel
                });
            }
        }

        const padStart = points[padIndex].x;
        const padEnd = padStart + padWidth;

        return {
            mode: 'terran',
            points,
            pads: [{ id: 1, padStart, padEnd, y: padY }],
            floatingPads: null,
            style: {
                fill: '#3d5c3a',
                fillHighlight: '#5a8f52',
                stroke: '#2a4028',
                padStroke: '#3f7',
                padFill: 'rgba(60, 90, 50, 0.5)'
            },
            waterRects
        };
    },

    _buildVolcanicWorld(worldWidth, worldHeight, terrainCfg, rng, planetSettings) {
        const step = 20;
        const padWidth = Math.round(this.pickRange(rng, terrainCfg.padWidth));
        const padIndex = this.pickPadSegmentIndex(rng, worldWidth, padWidth, step);
        const points = [];
        let y = worldHeight - rng() * 100 - 90;

        for (let x = 0; x <= worldWidth; x += step) {
            y += (rng() - 0.5) * 38;
            y = Math.max(worldHeight - 340, Math.min(worldHeight - 55, y));
            points.push({ x, y });
        }

        const shelfY = points[padIndex].y;
        const halfSegments = Math.ceil(padWidth / step / 2);
        for (let i = -halfSegments - 1; i <= halfSegments + 1; i++) {
            const idx = padIndex + i;
            if (!points[idx]) continue;
            const t = 1 - Math.abs(i) / (halfSegments + 2);
            points[idx].y = shelfY + (1 - t) * (rng() * 8 + 12);
        }
        for (let i = -halfSegments; i <= halfSegments; i++) {
            const idx = padIndex + i;
            if (points[idx]) points[idx].y = shelfY;
        }

        const numCraters = 18 + Math.floor(rng() * 12);
        for (let c = 0; c < numCraters; c++) {
            const craterX = rng() * worldWidth;
            const craterRadius = rng() * 70 + 35;
            if (craterX > points[padIndex].x - craterRadius - padWidth &&
                craterX < points[padIndex].x + padWidth + craterRadius) continue;
            for (const p of points) {
                const dist = Math.abs(p.x - craterX);
                if (dist < craterRadius) {
                    p.y += Math.sqrt(craterRadius * craterRadius - dist * dist) * 0.45;
                }
            }
        }

        const padStart = points[padIndex].x;
        const padEnd = padStart + padWidth;

        return {
            mode: 'volcanic',
            points,
            pads: [{ id: 1, padStart, padEnd, y: shelfY }],
            floatingPads: null,
            style: {
                fill: '#2a1810',
                fillHighlight: '#5c2818',
                stroke: '#1a0f08',
                padStroke: '#f84',
                padFill: 'rgba(80, 30, 10, 0.55)',
                glow: 'rgba(255, 90, 20, 0.15)'
            },
            waterRects: []
        };
    }
};
