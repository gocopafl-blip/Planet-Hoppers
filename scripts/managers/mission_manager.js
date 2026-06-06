// scripts/managers/mission_manager.js

class MissionManager {
    constructor() {
        // This will hold the list of missions currently available to the player.
        this.availableMissions = [];
    }

    // Lists every catalogue mission with locked/unlocked state (Phase 1.4).
    generateAvailableMissions() {
        this.availableMissions = Object.keys(missionCatalogue)
            .filter(missionId => {
                const missionData = missionCatalogue[missionId];
                if (missionData.oneTime && playerDataManager.hasCompletedMission(missionId)) {
                    return false;
                }
                return true;
            })
            .map(missionId => {
            const missionData = missionCatalogue[missionId];
            const mission = { id: missionId, ...missionData };
            const unlock = this.getMissionUnlockStatus(mission);
            return {
                ...mission,
                unlocked: unlock.unlocked,
                unlockHint: unlock.hint
            };
        }).sort((a, b) => {
            if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
            const orderA = a.sortOrder ?? a.reward ?? 0;
            const orderB = b.sortOrder ?? b.reward ?? 0;
            return orderA - orderB;
        });

        console.log("Generated available missions:", this.availableMissions);
        return this.availableMissions;
    }

    formatPlanetType(planetTypeId) {
        return PLANET_TYPE_LABELS[planetTypeId]
            || String(planetTypeId || 'Unknown').replace(/_/g, ' ');
    }

    /** Returns { unlocked, hint } for mission board display and accept guards. */
    getMissionUnlockStatus(mission) {
        const req = mission?.requires;
        if (!req) return { unlocked: true, hint: '' };

        const missing = [];

        if (Array.isArray(req.completedMissions) && req.completedMissions.length > 0) {
            const incomplete = req.completedMissions.filter(id => !playerDataManager.hasCompletedMission(id));
            if (incomplete.length > 0) {
                const labels = incomplete
                    .map(id => missionCatalogue[id]?.title || id)
                    .join(', ');
                missing.push(`Complete first: ${labels}`);
            }
        }

        if (req.minSurveyedWorlds != null) {
            const count = playerDataManager.getSurveyedWorldCount();
            if (count < req.minSurveyedWorlds) {
                missing.push(
                    `Survey ${req.minSurveyedWorlds} worlds (${count}/${req.minSurveyedWorlds} catalogued)`
                );
            }
        }

        if (Array.isArray(req.surveyedPlanetTypes) && req.surveyedPlanetTypes.length > 0) {
            const surveyedTypes = playerDataManager.getSurveyedPlanetTypeIds();
            const hasMatch = req.surveyedPlanetTypes.some(typeId => surveyedTypes.has(typeId));
            if (!hasMatch) {
                const labels = req.surveyedPlanetTypes.map(t => this.formatPlanetType(t));
                const typeList = labels.length <= 2
                    ? labels.join(' or ')
                    : `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`;
                missing.push(`Survey a solid-surface world (${typeList})`);
            }
        }

        return {
            unlocked: missing.length === 0,
            hint: missing.join(' · ')
        };
    }

    getCelestialBodies() {
        if (typeof celestialBodies !== 'undefined' && Array.isArray(celestialBodies) && celestialBodies.length > 0) {
            return celestialBodies;
        }
        if (typeof planetManager !== 'undefined' && planetManager.celestialBodies?.length) {
            return planetManager.celestialBodies;
        }
        return [];
    }

    getHubPosition() {
        return playerDataManager.data?.worldState?.hubPosition || null;
    }

    getPlanetsSortedByHubDistance() {
        const bodies = this.getCelestialBodies();
        const hub = this.getHubPosition();
        if (!hub || !bodies.length) return [];
        return [...bodies].sort((a, b) => {
            const da = Math.hypot(a.x - hub.x, a.y - hub.y);
            const db = Math.hypot(b.x - hub.x, b.y - hub.y);
            return da - db;
        });
    }

    getStarterPlanetByRank(rank) {
        const sorted = this.getPlanetsSortedByHubDistance();
        return sorted[rank] || null;
    }

    getUndiscoveredPlanets() {
        return this.getCelestialBodies().filter(p => p?.id && !playerDataManager.isPlanetDiscovered(p.id));
    }

    getUndiscoveredPlanetByRank(rank) {
        const undiscovered = this.getUndiscoveredPlanets();
        return undiscovered[rank] || null;
    }

    getMissionTargetPlanet(missionData) {
        if (!missionData) return null;
        const bodies = this.getCelestialBodies();

        if (missionData.hubPlanetRank != null) {
            return this.getStarterPlanetByRank(missionData.hubPlanetRank);
        }
        if (missionData.firstUndiscoveredRank != null) {
            return this.getUndiscoveredPlanetByRank(missionData.firstUndiscoveredRank);
        }
        if (missionData.destinationPlanetId) {
            return bodies.find(p => p && p.id === missionData.destinationPlanetId) || null;
        }
        if (missionData.destinationPlanetIndex != null) {
            return bodies.find(p => p && p.index === missionData.destinationPlanetIndex)
                || bodies[missionData.destinationPlanetIndex]
                || null;
        }
        return null;
    }

    planetMatchesMissionTarget(planet, missionData) {
        if (!planet || !missionData) return false;
        const target = this.getMissionTargetPlanet(missionData);
        if (!target) return false;
        return planet.id === target.id || planet.index === target.index;
    }

    formatMissionDescription(mission) {
        if (!mission) return '';

        const parts = [mission.briefing || mission.description || ''];

        if (mission.type === 'ORBIT_PLANET' || mission.type === 'FETCH_AND_DELIVER') {
            const target = this.getMissionTargetPlanet(mission);
            if (target) {
                const targetLabel = playerDataManager.isPlanetDiscovered(target.id)
                    ? target.name
                    : playerDataManager.getUnknownSignalLabel(target);
                const verb = mission.type === 'FETCH_AND_DELIVER'
                    ? (mission.pickupAt === 'land' ? 'Land at' : 'Orbit')
                    : 'Chart target';
                parts.push(`${verb}: ${targetLabel}.`);
            }
        }

        if (mission.type === 'ORBIT_PLANET') {
            const bonus = mission.discoveryBonus ?? DISCOVERY_FIRST_SURVEY_BONUS;
            parts.push(`First-survey bonus: ¢${bonus.toLocaleString()}.`);
        }

        if (mission.type === 'FETCH_AND_DELIVER') {
            parts.push('Return to the station dock to deliver.');
        }

        if (mission.timeLimitSec) {
            const mins = Math.round(mission.timeLimitSec / 60);
            parts.push(`Time limit: ${mins} min from accept.`);
        }

        return parts.filter(Boolean).join(' ');
    }

    formatTimeRemaining(seconds) {
        if (seconds == null || seconds < 0) return '0:00';
        const s = Math.floor(seconds);
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r.toString().padStart(2, '0')}`;
    }

    getMissionTimeRemainingSec(ship) {
        if (!ship?.assignedMissionId || !ship.missionState?.acceptedAt) return null;
        const mission = missionCatalogue[ship.assignedMissionId];
        if (!mission?.timeLimitSec) return null;
        const elapsed = (Date.now() - ship.missionState.acceptedAt) / 1000;
        return mission.timeLimitSec - elapsed;
    }

    onActiveShipEnterSpace(scene) {
        const activeShip = playerDataManager.getActiveShip?.();
        if (!activeShip?.assignedMissionId || !scene?.ship) return;

        const mission = missionCatalogue[activeShip.assignedMissionId];
        if (mission?.type !== 'DOCK_CERT') return;

        if (!scene.ship.isDocked) {
            activeShip.missionState = Object.assign(activeShip.missionState || {}, { hasLaunched: true });
            playerDataManager.saveData();
        }
    }

    /** Fail timed contracts when the clock runs out (space scene). */
    updateMissionTimer(scene) {
        if (!scene || scene.name !== 'space') return;

        const activeShip = playerDataManager.getActiveShip?.();
        if (!activeShip?.assignedMissionId) return;

        const remaining = this.getMissionTimeRemainingSec(activeShip);
        if (remaining == null) return;

        if (remaining > 0) return;

        const mission = missionCatalogue[activeShip.assignedMissionId];
        const title = mission?.title || 'Contract';
        playerDataManager.clearShipMission(activeShip.id);

        if (typeof notificationManager !== 'undefined') {
            notificationManager.show({
                title: 'Contract Expired',
                bodyHtml: `<p class="notification-planet-name">${this.escapeHtml(title)}</p><p>Deadline passed — contract void. Return to the mission board for new work.</p>`,
                variant: 'discovery',
                durationMs: 0,
                dismissible: true
            });
        } else {
            alert(`Contract expired: ${title}`);
        }
    }

    updateMissionTimerHUD() {
        const el = document.getElementById('mission-timer');
        if (!el) return;

        const activeShip = playerDataManager.getActiveShip?.();
        const remaining = activeShip ? this.getMissionTimeRemainingSec(activeShip) : null;

        if (remaining == null || !gameManager.activeScene || gameManager.activeScene.name !== 'space') {
            el.style.display = 'none';
            return;
        }

        el.style.display = 'block';
        el.textContent = `CONTRACT TIME: ${this.formatTimeRemaining(remaining)}`;
        el.classList.toggle('mission-timer-urgent', remaining <= 120);
        el.classList.toggle('mission-timer-critical', remaining <= 30);
    }

    notifyCargoAcquired(missionData) {
        const line = missionData?.pickupLine || 'Cargo loaded. Return to the station and dock to deliver.';
        if (typeof notificationManager !== 'undefined') {
            notificationManager.show({
                title: 'Cargo Aboard',
                bodyHtml: `<p>${this.escapeHtml(line)}</p>`,
                variant: 'discovery',
                durationMs: 6000,
                dismissible: true
            });
        } else {
            alert(line);
        }
    }

    onShipUndocked(scene) {
        if (!scene || scene.name !== 'space' || !scene.ship) return;

        const activeShip = playerDataManager.getActiveShip?.();
        if (!activeShip?.assignedMissionId) return;

        const missionData = missionCatalogue[activeShip.assignedMissionId];
        if (missionData?.type !== 'DOCK_CERT') return;

        activeShip.missionState = Object.assign(activeShip.missionState || {}, { hasLaunched: true });
        playerDataManager.saveData();
        console.log('[MissionManager] Dock cert: ship launched clear of station.');
    }

    tryOrbitFetchPickup(scene, planet) {
        const activeShip = playerDataManager.getActiveShip?.();
        if (!activeShip?.assignedMissionId) return;

        const missionData = missionCatalogue[activeShip.assignedMissionId];
        if (missionData?.type !== 'FETCH_AND_DELIVER' || missionData.pickupAt !== 'orbit') return;
        if (!this.planetMatchesMissionTarget(planet, missionData)) return;

        const state = activeShip.missionState || {};
        if (state.hasPickedUpCargo) return;

        activeShip.missionState = { ...state, hasPickedUpCargo: true };
        playerDataManager.saveData();
        this.notifyCargoAcquired(missionData);
    }

    getMissionTypeLabel(mission) {
        if (!mission?.type) return '';
        const labels = {
            DELIVER_TO_DOCK: 'Dock delivery',
            DOCK_CERT: 'Certification',
            FETCH_AND_DELIVER: 'Fetch & deliver',
            ORBIT_PLANET: 'Orbital survey',
            LAND_ON_PLANET: 'Surface drop',
            PICK_UP_CARGO: 'Sample run'
        };
        return labels[mission.type] || mission.type.replace(/_/g, ' ').toLowerCase();
    }

    getMissionIssuer(mission) {
        return mission?.issuer || 'Orbital Cargo Solutions';
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** First survey of a world during a scan mission — marks surveyed and pays bonus once. */
    applySurveyDiscovery(planet, missionData) {
        if (!planet?.id) return 0;

        const wasUndiscovered = playerDataManager.getPlanetDiscoveryStatus(planet.id)
            === PLANET_DISCOVERY_STATUS.UNDISCOVERED;
        playerDataManager.markPlanetSurveyed(planet.id);

        if (!wasUndiscovered) return 0;

        const bonus = missionData?.discoveryBonus ?? DISCOVERY_FIRST_SURVEY_BONUS;
        if (bonus <= 0) return 0;

        playerDataManager.credit(
            bonus,
            FINANCE_CATEGORIES.MISSION,
            `Discovery bonus: ${planet.name}`,
            { planetId: planet.id, discovery: true, missionId: missionData?.title }
        );
        return bonus;
    }

    /** Called when the active ship locks orbit — completes scan missions or catalogues a new world. */
    onOrbitLocked(scene, planet) {
        if (!scene || scene.name !== 'space' || !scene.ship?.isOrbitLocked || !planet) return;

        const activeShip = typeof playerDataManager.getActiveShip === 'function'
            ? playerDataManager.getActiveShip()
            : null;
        const missionId = activeShip?.assignedMissionId;
        const missionData = missionId ? missionCatalogue[missionId] : null;
        const isScanMission = missionData?.type === 'ORBIT_PLANET'
            && this.planetMatchesMissionTarget(planet, missionData);

        if (isScanMission) {
            this.completeMission(scene);
        } else {
            this.tryOrbitFetchPickup(scene, planet);
            if (!playerDataManager.isPlanetDiscovered(planet.id)) {
                if (playerDataManager.markPlanetSurveyed(planet.id)) {
                    console.log(`World catalogued from orbit: ${planet.name}`);
                    if (typeof notificationManager !== 'undefined') {
                        notificationManager.showPlanetDiscovery(planet);
                    }
                }
            }
        }
    }

    acceptMission(missionId, shipId = null) {
        const catalogueEntry = missionCatalogue[missionId];
        if (!catalogueEntry) {
            console.error(`Attempted to accept unknown mission: ${missionId}`);
            return;
        }

        const unlock = this.getMissionUnlockStatus({ id: missionId, ...catalogueEntry });
        if (!unlock.unlocked) {
            console.warn(`Cannot accept locked mission: ${missionId} — ${unlock.hint}`);
            return;
        }

        // Check if the mission we're trying to accept is actually available.
        const missionExists = this.availableMissions.some(m => m.id === missionId);
        if (!missionExists) {
            console.error(`Attempted to accept a mission that is not available: ${missionId}`);
            return;
        }

        // Per-ship assignment path (preferred for new flow)
        if (shipId !== null && shipId !== undefined && typeof playerDataManager.getShipById === 'function') {
            const ship = playerDataManager.getShipById(shipId);
            if (!ship) {
                console.error(`acceptMission: Ship ${shipId} not found in player fleet.`);
                return;
            }
            if (ship.assignedMissionId) {
                console.warn(`Ship ${shipId} already has an assigned mission.`);
                return;
            }
            if (typeof playerDataManager.assignMissionToShip === 'function') {
                playerDataManager.assignMissionToShip(shipId, missionId, {});
                return;
            }
        }

        // Fallback to legacy single active mission if present
        if (playerDataManager.getActiveMissionId()) {
            console.warn("Cannot accept new mission, player already has an active mission.");
            return;
        }
        playerDataManager.setActiveMissionId(missionId);
        playerDataManager.updateActiveMissionState({});
    }
    // Checks for and completes the player's active mission.
    completeMission(scene) {
        // --- Diagnostic Safeguard ---
        if (!scene) {
            console.warn("completeMission was called without a valid scene. Ignoring.");
            return;
        }

        // Diagnostic: Print full fleet and their mission assignments
        if (typeof playerDataManager.getFleet === 'function') {
            const fleet = playerDataManager.getFleet();
            if (Array.isArray(fleet)) {
                console.log('[MissionManager] Fleet mission assignments:', fleet.map(ship => ({
                    id: ship.id,
                    name: ship.name,
                    assignedMissionId: ship.assignedMissionId,
                    missionState: ship.missionState
                })));
            }
        }

        // Prefer per-ship assigned mission (new flow). Fallback to legacy active mission.
        const activeShip = typeof playerDataManager.getActiveShip === 'function' ? playerDataManager.getActiveShip() : null;
        const shipMissionId = activeShip && activeShip.assignedMissionId ? activeShip.assignedMissionId : null;
        const usingPerShip = !!shipMissionId;
        const activeMissionId = shipMissionId || playerDataManager.getActiveMissionId();
        // GUARD: If per-ship, and assignedMissionId is already null, do not proceed (prevents repeated completion)
        if (usingPerShip && (!activeShip || !activeShip.assignedMissionId)) {
            // Already cleared, do not repeat completion
            return;
        }
        if (!activeMissionId) return;
        console.log('[MissionManager] completeMission start', {
            scene: scene.name,
            usingPerShip,
            activeShipId: activeShip ? activeShip.id : null,
            shipMissionId,
            globalActiveMissionId: playerDataManager.getActiveMissionId ? playerDataManager.getActiveMissionId() : null
        });

        // 2. Find the mission's data in our master catalogue.
        const missionData = missionCatalogue[activeMissionId];
        if (!missionData) {
            console.error(`Could not find mission data for ID: ${activeMissionId}`);
            return;
        }
        let isCompleted = false; // A flag to track if we met the conditions.

        // Check the mission's type to decide how to complete it.
        // Helper accessors for mission state (per-ship vs legacy)
        const getMissionState = () => {
            if (usingPerShip) return (activeShip.missionState || {});
            return playerDataManager.getActiveMissionState();
        };
        const updateMissionState = (patch) => {
            if (usingPerShip) {
                activeShip.missionState = Object.assign(activeShip.missionState || {}, patch);
                if (typeof playerDataManager.saveData === 'function') playerDataManager.saveData();
            } else {
                playerDataManager.updateActiveMissionState(patch);
            }
        };

        switch (missionData.type) {
            case 'DELIVER_TO_DOCK':
                if (scene.name === 'space' && scene.ship?.isDocked) {
                    isCompleted = true;
                }
                break;

            case 'DOCK_CERT':
                if (scene.name === 'space' && scene.ship?.isDocked && getMissionState().hasLaunched) {
                    isCompleted = true;
                }
                break;

            case 'ORBIT_PLANET':
                if (scene.name === 'space' && scene.ship?.isOrbitLocked && scene.ship.orbitingPlanet) {
                    isCompleted = this.planetMatchesMissionTarget(scene.ship.orbitingPlanet, missionData);
                }
                break;

            case 'LAND_ON_PLANET':
                if (scene.name === 'lander' && scene.gameState === 'landed') {
                    isCompleted = true;
                }
                break;

            case 'FETCH_AND_DELIVER': {
                let fetchState = getMissionState();
                if (scene.name === 'lander' && scene.gameState === 'landed'
                    && missionData.pickupAt === 'land'
                    && !fetchState.hasPickedUpCargo) {
                    const landPlanet = scene.planet;
                    if (landPlanet && this.planetMatchesMissionTarget(landPlanet, missionData)) {
                        updateMissionState({ hasPickedUpCargo: true });
                        this.notifyCargoAcquired(missionData);
                        fetchState = getMissionState();
                    }
                }
                if (scene.name === 'space' && fetchState.hasPickedUpCargo && scene.ship?.isDocked) {
                    isCompleted = true;
                }
                break;
            }

            case 'PICK_UP_CARGO': {
                let cargoState = getMissionState();
                if (scene.name === 'lander' && scene.gameState === 'landed' && !cargoState.hasPickedUpCargo) {
                    updateMissionState({ hasPickedUpCargo: true });
                    this.notifyCargoAcquired({
                        pickupLine: 'Survey sample secured. Return to the station and dock to collect payout.'
                    });
                    cargoState = getMissionState();
                }
                if (scene.name === 'space' && cargoState.hasPickedUpCargo && scene.ship?.isDocked) {
                    isCompleted = true;
                }
                break;
            }

        }

        // If any of the conditions above were met, finalize the mission.
        if (isCompleted) {
            let discoveryBonusPaid = 0;
            if (missionData.type === 'ORBIT_PLANET' && scene.ship?.orbitingPlanet) {
                discoveryBonusPaid = this.applySurveyDiscovery(scene.ship.orbitingPlanet, missionData);
            }

            playerDataManager.credit(
                missionData.reward,
                FINANCE_CATEGORIES.MISSION,
                `Mission complete: ${missionData.title}`,
                {
                    missionId: activeMissionId,
                    shipId: activeShip?.id ?? null
                }
            );
            if (usingPerShip && activeShip) {
                if (typeof playerDataManager.clearShipMission === 'function') {
                    console.log('[MissionManager] Clearing per-ship mission', { shipId: activeShip.id, missionId: activeShip.assignedMissionId });
                    playerDataManager.clearShipMission(activeShip.id);
                    const postClearShip = typeof playerDataManager.getShipById === 'function' ? playerDataManager.getShipById(activeShip.id) : null;
                    if (postClearShip) {
                        console.log('[MissionManager] Post-clear ship state', { assignedMissionId: postClearShip.assignedMissionId });
                        if (!postClearShip.assignedMissionId) {
                            console.log('[MissionManager] Mission successfully cleared for ship', postClearShip.id);
                        } else {
                            console.warn('[MissionManager] Mission NOT cleared for ship', postClearShip.id, postClearShip.assignedMissionId);
                        }
                    }
                } else {
                    // Fallback if helper isn't present
                    activeShip.assignedMissionId = null;
                    activeShip.missionState = null;
                    if (typeof playerDataManager.saveData === 'function') playerDataManager.saveData();
                }
            } else {
                console.log('[MissionManager] Clearing legacy global active mission');
                playerDataManager.setActiveMissionId(null);
            }
            console.log(`Mission "${missionData.title}" completed! Player earned ${missionData.reward} credits.`);

            if (missionData.oneTime) {
                playerDataManager.markMissionCompleted(activeMissionId);
            }

            let alertMessage = missionData.completionLine
                ? `${missionData.completionLine}\n\nContract reward: ¢ ${missionData.reward.toLocaleString()}`
                : `Mission Complete: ${missionData.title}\n\nContract reward: ¢ ${missionData.reward.toLocaleString()}`;
            if (discoveryBonusPaid > 0) {
                alertMessage += `\nDiscovery bonus: ¢ ${discoveryBonusPaid.toLocaleString()}`;
                const planetName = scene.ship?.orbitingPlanet?.name || 'Unknown world';
                alertMessage += `\n\n${planetName} is now surveyed.`;
            }
            alert(alertMessage);
        }

        // In the future, you could add checks here, like:
        // if (missionData.type === 'DELIVER_TO_PLANET' && player.location === missionData.destination)

        // You could also add a system for failed missions, time limits, etc.
    }
}
// --- Future Functions ---
// We will build these out in later steps.
//
// getActiveMission() { ... }
