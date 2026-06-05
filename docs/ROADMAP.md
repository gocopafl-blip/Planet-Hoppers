# Planet Hoppers — Roadmap

**Who this is for:** **You** — pick up after weeks away, or point the AI here at session start.  
**Branch:** `fleet_manager_update` (latest push: remote commander sim + lander/planet expansion, commit `e4376da`)

---

## Pick up here (30-second orientation)

1. **Game type:** Progression cargo explorer — start small, grow ships & gear, discover worlds, unlock routes & surprises, eventually chart the whole sector (including alien trade).
2. **First “wow” we’re building toward:** **Discovery** — find something weird (new planet, wreck, alien signal), unlock new work, not just “hard landing.”
3. **Playtest:** Go Live → `http://127.0.0.1:5500` — see [PLAYTESTING.md](PLAYTESTING.md).
4. **Next recommended build slice:** **Phase 1 — Discovery loop** (below). Fleet autopilot (old “Phase 2”) is **paused** until core gameplay loop feels fun.
5. **Key code areas:** missions → `mission_manager.js`, `mission_catalogue.js` · planets → `planet_catalogue.js`, `planet_manager.js` · lander → `lander_scene.js` · dock/money → `player_data_manager.js`, station scenes · fleet → `fleet_manager_scene.js`, `fleet_manager.js` · notifications → `notification_manager.js`.

---

## Game vision (north star)

**One sentence:** You’re a hauler who expands reach — better ships, new worlds, new customers — until the sector’s secrets (including alien trade) are yours.

### Pillars

- **Start small** — one ship, local dock contracts, tight consumables.
- **Grow** — buy ships, modules, fleet; bigger cargo, longer routes.
- **Discover** — survey the map, find anomalies, first visits matter.
- **Unlock** — new destinations, mission tiers, trade routes, certifications.
- **Surprises** — derelicts, events, alien worlds & ships (`assets/ships/alienships` — planned asset path).
- **Endgame** — codex completion: planets, routes, ships, anomalies; “I’ve seen what this universe has.”

### Progression eras (player feel, not strict gates)

| Era | Player feel | Examples |
|-----|-------------|----------|
| **1 — Local contractor** | “I’m making rent.” | Dock deliveries, learn orbit/land/refuel, maybe 2nd ship |
| **2 — System opens** | “I’m mapping the neighborhood.” | Survey missions, planet-specific cargo, locked vs unlocked job board |
| **3 — Fleet operator** | “I run a small company.” | Multi-ship contracts, relay pickups, repair/bank pressure |
| **4 — First contact** | “Something is out here.” | Alien port, derelict, new trade route, exotic hull/module |
| **Endgame — Charted sector** | “I’ve discovered it all.” | Codex filled, prestige routes, optional megaproject |

---

## Shipped foundation (don’t rebuild)

Use this as “already done” when planning.

### Core loop

- [x] Space flight, orbit mechanics, nav screen & waypoints per ship
- [x] Lander v1 — planet-driven terrain (terran, water, ice, city, volcanic, gas)
- [x] Mission types: deliver to dock, orbit planet, land on planet, pick up cargo (multi-stage)
- [x] Dock hub: missions, trade (buy/sell ships), Titan refuel, Fleet Manager

### Economy

- [x] Transaction ledger, `credit()` / `spend()`
- [x] Consumables burn (per-second, FPS-independent), HUD gauges
- [x] Titan Supply (docked refills), Request Tow (¢1,000)

### Fleet / remote commander

- [x] Fleet list, Dispatch, Jump To, Terminate Remote Command
- [x] Per-ship state: location, orbit, consumables, navigation, missions
- [x] Background sim when off space scene (correct coast speed after terminate)
- [x] Fleet Manager live coordinate refresh (~2s)
- [x] Nav screen closes when leaving space scene
- [x] Save migration on load

### Content

- [x] Planet catalogue: water, ice, city worlds + sprite mapping
- [x] Planet layout persisted in `worldState.planets`

**Details elsewhere:** [ECONOMY.md](ECONOMY.md) · [LANDER.md](LANDER.md) · [FLEET_AND_ORBIT.md](FLEET_AND_ORBIT.md) · [FLEET_BACKGROUND_SIMULATION.md](FLEET_BACKGROUND_SIMULATION.md)

---

## Build roadmap (point by point)

Work **top to bottom** within each phase unless you deliberately skip ahead. Check boxes as you ship.

### Phase 1 — Discovery loop ⭐ **START HERE**

*Goal: first session “wow” = find something new and unlock new work.*

- [x] **1.1 Survey state** — Persist per-planet flags: `undiscovered` → `surveyed` → `active_destination` in `worldState.planets` + live `celestialBodies`. API: `playerDataManager.getPlanetDiscoveryStatus(id)`, `markPlanetSurveyed(id)`, `markPlanetActiveDestination(id)`, `getPlanetsByDiscoveryStatus(status)`.
- [x] **1.2 Scan mission payout** — `ORBIT_PLANET` missions complete on orbit lock at the target world; first survey pays `discoveryBonus` + marks planet `surveyed`. Helpers: `missionManager.onOrbitLocked`, `applySurveyDiscovery`.
- [x] **1.3 Fog / visibility** — Unknown worlds hidden on NAV/radar until an accepted scan mission (`Unknown Signal N` blip, alternates with `?`) or orbit discovery (green dot + name). Two starter worlds near station are pre-surveyed. Fixed-size map blips (no giant rings).
- [x] **1.3b Organic discovery notification** — Orbit-lock on an unknown world (no scan mission) shows a **click-to-dismiss** discovery banner (`notification_manager.js`). Teaser stats + satirical flavor; foundation for full planet dossier pop-up later.
- [ ] **1.4 Unlock missions** — Mission board shows **locked** vs **unlocked** jobs; tier-2 jobs require “surveyed [planet type]” or “visited N worlds.”
- [ ] **1.5 First anomaly (MVP)** — One scripted ping: distant NAV blip → fly there → trigger journal/codex entry + unlock one new contract type (e.g. ice sample run).
- [ ] **1.6 Discovery journal (light)** — Dock or Fleet UI panel: list discovered planets/anomalies (text list OK for v1).

**Playtest win:** New player completes scan → sees something new on the board → takes a job they couldn’t before.

---

### Phase 2 — Missions & lander stakes

*Goal: deliveries matter; planet types feel different.*

- [ ] **2.1 Designated pad missions** — Mission requires specific pad id (ids exist in lander v1); any pad no longer auto-wins.
- [ ] **2.2 Planet-type cargo** — Jobs tied to `water_world`, `ice_world`, `volcanic_world`, etc. (survey gear, ore, ice sample).
- [ ] **2.3 Lander failure flow** — Crash → return to **orbiting mothership** (not dock); lose drop ship replacement cost + mission cargo penalty. See [LANDER.md](LANDER.md).
- [ ] **2.4 Mission board UX** — Show payout, planet type, pad requirement, danger hint on each card.
- [ ] **2.5 Multi-leg contracts (optional)** — Pick up at A → deliver to dock B; bonus for fuel remaining.

**Playtest win:** Choosing *which* job and *which* planet feels like a decision, not a menu click.

---

### Phase 3 — Economy & growth pressure

*Goal: “start small → bigger” has teeth.*

- [ ] **3.1 Apex repair (Economy C)** — Damage sources (bad landing, hull events); **Apex Outfitting & Repair** UI; `shipRepairCostPerHealth`.
- [ ] **3.2 Aegis banking (Economy D)** — Balance, statements, loans + autopay; wire background asset.
- [ ] **3.3 Ship tiers** — Gate tier-2/3 ships behind credits + optional certification from Phase 1.
- [ ] **3.4 Cargo capacity** — Missions that need hauler-class ship (`cargoCapacity` in fleet data).
- [ ] **3.5 Modules (later slice)** — Extra fuel tank, cargo pod, better lander — installed at Apex/Titan.

**Locked rules:** Mission pay = **instant on completion**. Stations: Orbital = missions, Trade = ships, Titan = consumables, Apex = repair, Aegis = bank, Fleet = dispatch only.

---

### Phase 4 — Fleet as operator tool

*Goal: multi-ship company without full AI autopilot.*

- [ ] **4.1 Relay missions** — Ship A must hold orbit at X while player lands with Ship B (or timed pickup).
- [ ] **4.2 Stranded / rescue fantasy** — Fuel delivery ship or expanded tow (see Economy “Later”).
- [ ] **4.3 Fleet Manager status** — Speed, “en route to…”, low fuel warnings (extends live coords from Phase 1 fleet work).
- [ ] **4.4 Tactical holo-map (8.2)** — NavScreen-style map in Fleet Manager: all ships, routes, tooltips.
- [ ] **4.5 Sector overlap indicator (6.2)** — Visual when multiple ships share a region.

**Paused (not priority):** Waypoint autopilot, background consumables burn off-scene — revisit when discovery + missions loop is fun.

---

### Phase 5 — First contact & trade routes

*Goal: alien content and long-term surprises.*

- [ ] **5.1 Alien assets** — Add `assets/ships/alienships` to `asset_catalogue.js`; glam shots / placeholders in Trade or codex.
- [ ] **5.2 Derelict / wreck event** — Discoverable location; salvage credits or blueprint.
- [ ] **5.3 Alien world or port** — Hidden until anomaly chain; unique planet type or dock scene variant.
- [ ] **5.4 Trade route unlock** — Buy cheap at A, sell at B; route appears on board after first contact.
- [ ] **5.5 Alien hull reward** — Discovery reward ship or module, not shop purchase.

---

### Phase 6 — Endgame & polish

*Goal: completionist path and session quality.*

- [ ] **6.1 Codex** — Track X/Y planets, routes, anomalies, ships; visible in dock UI.
- [ ] **6.2 Start screen (10.0)** — Load Game vs New Game + confirm reset (`localStorage` clear).
- [ ] **6.3 Universal dock UI (9.0)** — Shared holo styles, ESC close, consistent patterns.
- [ ] **6.3b Unified notification banners** — Replace all browser `alert()` calls with the discovery banner style (`notification_manager.js` + shared CSS variants: success, warning, error, mission payout). Click-to-dismiss by default; optional auto-dismiss for low-priority toasts. Migrate call sites in: `mission_manager.js`, `trade_manager.js`, `fleet_manager.js`, `fleet_manager_scene.js`, `space_scene.js`, `titan_supply_scene.js`, `rescue_manager.js`. Extend discovery card into full planet dossier modal (size, population, gravity, trade, danger, flavor).
- [ ] **6.4 Post-landing scene** — Surface beat after safe landing (scan, local contact, optional choice).
- [ ] **6.5 Planet gameplay differentiation** — Ice drift, volcanic jitter, hostile landing, etc. See [LANDER.md](LANDER.md).
- [ ] **6.6 Drop ship variety** — Multiple equipped landers with different stats.

---

## Paused / deferred

| Item | Why paused |
|------|------------|
| Fleet Phase 2 autopilot | Gameplay-first; discovery loop higher value |
| Hidden-tab sim polish (Test 4) | QoL; not core fantasy |
| 7.10.8–9 orbit/nav edge cases | Re-test when touching orbit/fleet nav |
| Background consumables off-scene | After autopilot or explicit idle-burn design |

---

## Idea backlog (good, not scheduled)

- Reputation / license tiers for mission classes
- One-off planet events (quake closes pads, storm bonus pay)
- NPC rival hauler at pad — race or intel
- Cargo ship delivers fuel to stranded fleet
- Hostile worlds — dodge fire on descent
- Prestige / megaproject final delivery

---

## How to work with the agent

- **Session start:** “Read `docs/ROADMAP.md` — continue Phase X.”
- **Planning:** 1–2 design questions at a time (not long questionnaires).
- **Playtest:** Go Live for saves; GitHub Pages uses separate `localStorage`.
- **After schema changes:** Saves auto-migrate on load; broken saves usually heal without manual delete.

---

## Doc index

| Doc | Use when |
|-----|----------|
| [PLAYTESTING.md](PLAYTESTING.md) | Testing, saves, smoke checklist |
| [ECONOMY.md](ECONOMY.md) | Money, stations, phases C/D |
| [LANDER.md](LANDER.md) | Lander scope, failure, planet terrain |
| [FLEET_AND_ORBIT.md](FLEET_AND_ORBIT.md) | Fleet/orbit feature status |
| [FLEET_BACKGROUND_SIMULATION.md](FLEET_BACKGROUND_SIMULATION.md) | Background sim tests |
| [ADDING_ASSETS.md](ADDING_ASSETS.md) | New images & sounds |
