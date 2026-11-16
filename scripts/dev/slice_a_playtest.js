// scripts/dev/slice_a_playtest.js — Headless Slice A playtest harness (jsdom).
// Boots the real index.html over a local static server.
// Run from the repo root: npm install --no-save jsdom && node scripts/dev/slice_a_playtest.js
// Boots the real index.html over a
// local static server with canvas/audio/image stubs, then drives the new
// story systems directly. Exits non-zero on any failure.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = 'path.resolve(__dirname, "..", "..")';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.json': 'application/json' };

function startServer() {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            const urlPath = decodeURIComponent(req.url.split('?')[0]);
            const filePath = path.join(REPO, urlPath === '/' ? 'index.html' : urlPath);
            fs.readFile(filePath, (err, data) => {
                if (err) { res.writeHead(404); res.end('nf'); return; }
                res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
                res.end(data);
            });
        });
        server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    });
}

function waitFor(fn, timeoutMs, label) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tick = () => {
            let ok = false;
            try { ok = !!fn(); } catch (e) { /* keep waiting */ }
            if (ok) return resolve(true);
            if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for: ${label}`));
            setTimeout(tick, 50);
        };
        tick();
    });
}

async function boot(port, seedSave) {
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', e => {
        const msg = String(e.detail?.message || e.message || e);
        // Ignore remote font/stylesheet fetch noise; everything else counts.
        if (/fonts\.g|gstatic|Could not load link/i.test(msg)) return;
        errors.push('jsdomError: ' + msg);
    });
    virtualConsole.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));

    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
    const dom = new JSDOM(html, {
        url: `http://127.0.0.1:${port}/`,
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            if (seedSave) window.localStorage.setItem('planetHoppersSaveData', JSON.stringify(seedSave));
            window.Image = class {
                constructor() { this.complete = false; this.onload = null; this.onerror = null; this._src = ''; }
                set src(v) { this._src = v; this.complete = true; setTimeout(() => { if (this.onload) this.onload(); }, 0); }
                get src() { return this._src; }
            };
            window.Audio = class {
                constructor() { this._listeners = {}; this.preload = ''; this._src = ''; this.volume = 1; this.currentTime = 0; this.loop = false; this.paused = true; }
                addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
                removeEventListener() {}
                _fire(t) { (this._listeners[t] || []).forEach(fn => { try { fn(); } catch (e) {} }); }
                set src(v) { this._src = v; }
                get src() { return this._src; }
                load() { setTimeout(() => { this._fire('loadeddata'); this._fire('canplaythrough'); }, 0); }
                play() { this.paused = false; return Promise.resolve(); }
                pause() { this.paused = true; }
                cloneNode() { return new window.Audio(); }
            };
            window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
            window.HTMLMediaElement.prototype.pause = function () {};
            window.HTMLCanvasElement.prototype.getContext = function (kind) {
                if (kind !== '2d') return null;
                if (!this._ctxStub) {
                    const gradient = { addColorStop() {} };
                    this._ctxStub = {
                        canvas: this, fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '',
                        globalAlpha: 1, lineWidth: 1, shadowBlur: 0, shadowColor: '',
                        save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {}, resetTransform() {},
                        clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
                        arc() {}, arcTo() {}, ellipse() {}, rect() {}, fill() {}, stroke() {}, clip() {}, fillText() {}, strokeText() {},
                        drawImage() {}, putImageData() {}, createLinearGradient() { return gradient; }, createRadialGradient() { return gradient; },
                        createPattern() { return {}; }, measureText() { return { width: 10 }; }, getImageData() { return { data: [] }; }
                    };
                }
                return this._ctxStub;
            };
        }
    });
    await waitFor(() => dom.window.document.getElementById('start-screen')?.style.display === 'block', 20000, 'start screen');
    return { dom, errors };
}

let failures = 0;
function check(name, cond, extra = '') {
    if (cond) { console.log(`  PASS ${name}`); }
    else { failures++; console.log(`  FAIL ${name} ${extra}`); }
}

async function main() {
    const { server, port } = await startServer();
    try {
        // ── T1: fresh boot ──────────────────────────────────────────────
        console.log('T1 fresh boot');
        const b1 = await boot(port, null);
        const w = b1.dom.window;
        const G = w.eval('({ playerDataManager, missionManager, missionCatalogue, introScreen, missionBoardScene, contactsUI, aegisBankingScene, DROP_SHIP_REPLACEMENT_COST })');
        check('no console/jsdom errors on boot', b1.errors.length === 0, b1.errors.slice(0, 3).join(' | '));
        check('story schema present', !!G.playerDataManager.data.story);
        check('flags empty', Object.keys(G.playerDataManager.data.story.flags).length === 0);
        check('write-off log empty', G.playerDataManager.data.story.writeOffLog.length === 0);
        check('journal empty', G.playerDataManager.data.story.journal.length === 0);

        // ── T2: legacy-save migration (separate boot) ───────────────────
        console.log('T2 legacy migration');
        const legacy = JSON.parse(JSON.stringify(G.playerDataManager.data));
        delete legacy.story;
        const b2 = await boot(port, legacy);
        const w2 = b2.dom.window;
        const G2 = w2.eval('({ playerDataManager })');
        check('migration adds story', !!G2.playerDataManager.data.story);
        check('migration keeps balance', G2.playerDataManager.data.playerBankBalance === legacy.playerBankBalance);
        check('migration flags object', typeof G2.playerDataManager.data.story.flags === 'object');
        b2.dom.window.close();

        // ── T3: story gates ─────────────────────────────────────────────
        console.log('T3 story gates');
        const mm = G.missionManager;
        const lockedFlag = mm.getMissionUnlockStatus({ requires: { storyFlags: ['nope_flag'] } });
        check('storyFlags gate locks', lockedFlag.unlocked === false);
        G.playerDataManager.setStoryFlag('nope_flag');
        const unlockedFlag = mm.getMissionUnlockStatus({ requires: { storyFlags: ['nope_flag'] } });
        check('storyFlags gate unlocks', unlockedFlag.unlocked === true);
        const lockedCounter = mm.getMissionUnlockStatus({ requires: { storyCounters: { fragments: 2 } } });
        check('storyCounters gate locks', lockedCounter.unlocked === false);
        G.playerDataManager.incrementStoryCounter('fragments', 2);
        const unlockedCounter = mm.getMissionUnlockStatus({ requires: { storyCounters: { fragments: 2 } } });
        check('storyCounters gate unlocks', unlockedCounter.unlocked === true);

        // ── T4: catalogue ───────────────────────────────────────────────
        console.log('T4 catalogue');
        const cat = G.missionCatalogue;
        check('17 missions', Object.keys(cat).length === 17, `got ${Object.keys(cat).length}`);
        check('TRINKET type', cat.TRINKET_RUN_01?.type === 'FETCH_AND_DELIVER');
        check('TRINKET no timer', cat.TRINKET_RUN_01?.timeLimitSec == null);
        check('MAD_HAULER type', cat.MAD_HAULER_01?.type === 'DOCK_ENCOUNTER');
        check('RIVAL race flag', cat.RIVAL_RACE_01?.rivalRace === true && cat.RIVAL_RACE_01?.timeLimitSec === 900);
        check('B1 buoy fuzz', /fuzzing out/i.test(cat.FETCH_ORBIT_01.briefing));
        check('B2 pattern line', /pattern/i.test(cat.FETCH_ORBIT_02.completionLine));
        check('Pip anchor', /Pip/i.test(cat.FETCH_LAND_02.briefing));
        check('Mara voice', /Mara/i.test(cat.TUTORIAL_DOCK_01.briefing));

        // ── T5: intro ───────────────────────────────────────────────────
        console.log('T5 intro');
        const introHtml = G.introScreen.buildBodyHtml();
        check('intro has Pip', introHtml.includes('Pip'));
        check('intro keeps repo salvage (B8)', introHtml.includes('repo salvage'));

        // ── T14: board render (fresh state, before completions) ─────────
        console.log('T14 board render');
        G.missionBoardScene.showMissionBoard();
        const cards = w.document.querySelectorAll('#mission-list .mission-item');
        check('17 cards rendered', cards.length === 17, `got ${cards.length}`);
        const talkBtn = w.document.querySelector('[data-mission-id="MAD_HAULER_01"]');
        check('encounter button says Locked while gated', talkBtn?.textContent === 'Locked', `got "${talkBtn?.textContent}"`);
        const trinketBtn = w.document.querySelector('[data-mission-id="TRINKET_RUN_01"]');
        check('TRINKET locked pre-FETCH_LAND_02', trinketBtn?.disabled === true);
        // Unlock the encounter's gate, then the button must read Talk.
        G.playerDataManager.markMissionCompleted('TUTORIAL_DOCK_01');
        G.missionBoardScene.showMissionBoard();
        const talkBtnUnlocked = w.document.querySelector('[data-mission-id="MAD_HAULER_01"]');
        check('encounter button says Talk when unlocked', talkBtnUnlocked?.textContent === 'Talk', `got "${talkBtnUnlocked?.textContent}"`);

        // ── Shared fixtures: fake planets + hub ─────────────────────────
        w.eval(`celestialBodies = [
            { id: 'p1', index: 0, x: 100, y: 0, name: 'Test One', planetTypeId: 'terran_world', discoveryStatus: 'surveyed' },
            { id: 'p2', index: 1, x: 500, y: 0, name: 'Test Two', planetTypeId: 'ice_world', discoveryStatus: 'surveyed' }
        ];`);
        G.playerDataManager.data.worldState.hubPosition = { x: 0, y: 0 };
        const ship = G.playerDataManager.getActiveShip();
        const fakeLanderScene = { name: 'lander', gameState: 'landed', planet: { id: 'p1', index: 0, planetTypeId: 'terran_world' }, landedPadId: 1 };
        const fakeSpaceDocked = { name: 'space', ship: { isDocked: true, isOrbitLocked: false, orbitingPlanet: null } };

        // ── T6: TRINKET flow ────────────────────────────────────────────
        console.log('T6 TRINKET_RUN_01 flow');
        G.playerDataManager.assignMissionToShip(ship.id, 'TRINKET_RUN_01', {});
        mm.completeMission(fakeLanderScene);
        check('pickup registered', ship.missionState?.hasPickedUpCargo === true);
        const balBefore = G.playerDataManager.getBalance();
        mm.completeMission(fakeSpaceDocked);
        check('mission cleared', ship.assignedMissionId === null);
        check('kid_drawing flag', G.playerDataManager.hasStoryFlag('kid_drawing'));
        check('dog_home flag', G.playerDataManager.hasStoryFlag('dog_home'));
        check('journal has drawing', G.playerDataManager.getJournalEntries().some(e => e.id === 'pip_drawing'));
        check('payout landed', G.playerDataManager.getBalance() > balBefore);
        check('pip message queued/active', G.contactsUI.active?.lines?.length === 3 || G.contactsUI.queue.length > 0);
        // drain the contact overlay so later tests start clean
        w.__CONTACTS_INSTANT__ = true;
        while (G.contactsUI.active || G.contactsUI.queue.length) {
            if (!G.contactsUI.active) break;
            G.contactsUI._advance();
            if (G.contactsUI.queue.length === 0 && !G.contactsUI.active) break;
        }
        check('contact overlay closed after advance', !G.contactsUI.active);

        // ── T7: MAD_HAULER encounter ────────────────────────────────────
        console.log('T7 MAD_HAULER_01 encounter');
        G.playerDataManager.markMissionCompleted('TUTORIAL_DOCK_01');
        let encounterDone = false;
        G.contactsUI.showEncounter('mad_hauler_first', () => {
            encounterDone = true;
            mm.completeDockEncounter('MAD_HAULER_01');
        });
        check('encounter active', G.contactsUI.active !== null);
        check('encounter is Old Tam', w.document.querySelector('.contact-name')?.textContent === 'Old Tam');
        let guard = 0;
        while (G.contactsUI.active && guard++ < 10) G.contactsUI._advance();
        check('encounter onDone ran', encounterDone === true);
        check('met_mad_hauler flag', G.playerDataManager.hasStoryFlag('met_mad_hauler'));
        check('encounter marked complete', G.playerDataManager.hasCompletedMission('MAD_HAULER_01'));
        check('encounter cannot re-complete', mm.completeDockEncounter('MAD_HAULER_01') === false);

        // ── T8: RIVAL win ───────────────────────────────────────────────
        console.log('T8 RIVAL_RACE_01 win path');
        G.playerDataManager.assignMissionToShip(ship.id, 'RIVAL_RACE_01', {});
        ship.missionState.hasPickedUpCargo = true;
        mm.completeMission(fakeSpaceDocked);
        check('met_rival flag', G.playerDataManager.hasStoryFlag('met_rival'));
        check('rival-win message queued', G.contactsUI.active !== null || G.contactsUI.queue.length > 0);
        guard = 0;
        while (G.contactsUI.active && guard++ < 10) G.contactsUI._advance();

        // ── T9: RIVAL loss (expiry) ─────────────────────────────────────
        console.log('T9 RIVAL_RACE_01 loss path');
        const balLossBefore = G.playerDataManager.getBalance();
        G.playerDataManager.assignMissionToShip(ship.id, 'RIVAL_RACE_01', {});
        ship.missionState.acceptedAt = Date.now() - 1000 * 1000;
        mm.updateMissionTimer({ name: 'space' });
        check('expired mission cleared', ship.assignedMissionId === null);
        check('no pay on loss', G.playerDataManager.getBalance() === balLossBefore);
        check('rival-loss message queued', G.contactsUI.active !== null || G.contactsUI.queue.length > 0);
        guard = 0;
        while (G.contactsUI.active && guard++ < 10) G.contactsUI._advance();

        // ── T10: crash → write-off log ──────────────────────────────────
        console.log('T10 lander crash');
        G.playerDataManager.assignMissionToShip(ship.id, 'FETCH_LAND_01', {});
        const balCrashBefore = G.playerDataManager.getBalance();
        const logBefore = G.playerDataManager.getWriteOffLog().length;
        mm.handleLanderCrash({ name: 'lander' });
        check('write-off logged', G.playerDataManager.getWriteOffLog().length === logBefore + 1);
        check('write-off kind', G.playerDataManager.getWriteOffLog().slice(-1)[0].kind === 'write_off');
        check('mission voided', ship.assignedMissionId === null);
        check('replacement billed', G.playerDataManager.getBalance() === balCrashBefore - G.DROP_SHIP_REPLACEMENT_COST);

        // ── T11: contacts UI edge cases ─────────────────────────────────
        console.log('T11 contacts edge cases');
        check('unknown message rejected', G.contactsUI.queueMessage('nope_nope') === false);
        check('unknown encounter rejected', G.contactsUI.showEncounter('nope_nope') === false);
        G.contactsUI.queueMessage('kess_race_won');
        check('fallback badge for Kess (no portrait)', !!w.document.querySelector('.contact-portrait-fallback'));
        guard = 0;
        while (G.contactsUI.active && guard++ < 10) G.contactsUI._advance();
        check('queue drains clean', G.contactsUI.queue.length === 0 && !G.contactsUI.active);

        // ── T12: B9 admin line ──────────────────────────────────────────
        console.log('T12 B9 admin line');
        G.aegisBankingScene.renderStatement();
        const adminLine = w.document.querySelector('.aegis-admin-line')?.textContent || '';
        check('admin line present', adminLine.includes('Recoveries on file: 0'));
        G.playerDataManager.addWriteOffEntry({ kind: 'recovery', what: 'test tow' });
        G.aegisBankingScene.renderStatement();
        check('admin line counts recoveries', (w.document.querySelector('.aegis-admin-line')?.textContent || '').includes('Recoveries on file: 1'));

        // ── T16: emergency tow → recovery log ─────────────────────────
        console.log('T16 emergency tow');
        const G16 = w.eval('({ rescueManager, uiPrompt, gameManager, TOW_COST, SHIP_DOCKED_OFFSET })');
        const logTowBefore = G.playerDataManager.getWriteOffLog().length;
        const balTowBefore = G.playerDataManager.getBalance();
        const realConfirm = G16.uiPrompt.confirm;
        G16.uiPrompt.confirm = () => Promise.resolve(true);
        const fakeTowScene = {
            name: 'space',
            ship: { fuel: 0, oxygen: 100, electricity: 100, x: 50, y: 50, velX: 0, velY: 0, angle: 0, isDocked: false, isOrbitLocked: false, orbitingPlanet: null },
            spaceDocks: [{ x: 0, y: 0 }]
        };
        const towResult = await G16.rescueManager.requestTow(fakeTowScene);
        G16.uiPrompt.confirm = realConfirm;
        check('tow succeeds', towResult?.ok === true);
        check('tow billed', G.playerDataManager.getBalance() === balTowBefore - G16.TOW_COST);
        check('recovery logged', G.playerDataManager.getWriteOffLog().length === logTowBefore + 1);
        check('recovery kind', G.playerDataManager.getWriteOffLog().slice(-1)[0].kind === 'recovery');
        check('ship docked by tow', fakeTowScene.ship.isDocked === true);
        await new Promise(r => setTimeout(r, 700)); // let deferred Titan switch run

        // ── T13: save/reload persistence ────────────────────────────────
        console.log('T13 save/reload');
        G.playerDataManager.setStoryFlag('persist_probe');
        G.playerDataManager.saveData();
        G.playerDataManager.loadData();
        check('flag persists', G.playerDataManager.hasStoryFlag('persist_probe'));
        check('log persists', G.playerDataManager.getWriteOffLog().length > 0);
        check('journal persists', G.playerDataManager.getJournalEntries().some(e => e.id === 'pip_drawing'));

        // ── Final: console errors across the whole run ──────────────────
        console.log('T15 error sweep');
        check('zero console/jsdom errors overall', b1.errors.length === 0, b1.errors.slice(0, 5).join(' | '));

        b1.dom.window.close();
    } finally {
        server.close();
    }
    console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => { console.error('HARNESS ERROR:', err); process.exit(2); });
