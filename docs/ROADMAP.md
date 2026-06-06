# Planet Hoppers — Roadmap

**Who this is for:** **You** — pick up after weeks away, or point the AI here at session start.  
**Branch:** `fleet_manager_update` (latest push: Phase 1.2–1.4 discovery loop + unlock missions)

---

## Pick up here (30-second orientation)

1. **Game type:** Progression cargo explorer — start small, grow ships & gear, discover worlds, unlock routes & surprises, eventually chart the whole sector (including alien trade).
2. **First “wow” we’re building toward:** **Discovery** — find something weird (new planet, wreck, alien signal), unlock new work, not just “hard landing.”
3. **Playtest:** Go Live → `http://127.0.0.1:5500` — see [PLAYTESTING.md](PLAYTESTING.md).
4. **Next recommended build slice:** **Phase 3.1** — Apex repair UI, or expand **Phase 2.6** Era 2 chains as players survey more worlds.
5. **Key code areas:** missions → `mission_manager.js`, `mission_catalogue.js` · planets → `planet_catalogue.js`, `planet_manager.js` · lander → `lander_scene.js` · dock/money → `player_data_manager.js`, station scenes · fleet → `fleet_manager_scene.js`, `fleet_manager.js` · notifications → `notification_manager.js` · onboarding → `index.html`, `main.js`, start/menu scenes.

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

Each era should have **missions that pay the bills and feel purposeful** — mini-stories with an issuer, a reason, and a consequence. Test missions (`DELIVERY_ALPHA_01`, etc.) are placeholders; replace with era-themed content as we build.

| Era | Player feel | Mission tone | Examples |
|-----|-------------|--------------|----------|
| **1 — Local contractor** | “I’m making rent.” | Scrappy dock work; someone needs this crate *today* | Station maintenance runs, med supply, first paid survey contract |
| **2 — System opens** | “I’m mapping the neighborhood.” | Science & logistics; each job expands the map | Planet-type deliveries, pad-specific landings, sample runs |
| **3 — Fleet operator** | “I run a small company.” | Multi-ship coordination; margins matter | Relay orbits, timed pickups, fuel-margin bonuses |
| **4 — First contact** | “Something is out here.” | One-off anomalies unlock unique chains | Derelict salvage, exotic signal, alien mothership ping |
| **Endgame — Charted sector** | “I’ve discovered it all.” | Prestige contracts; completionist payoffs | Codex milestones, megaproject delivery |

**Design rule:** Even Era 1 jobs need a *who* and a *why* (e.g. “Titan Supply needs O₂ filters before the night shift” — not “deliver crate”).

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

### Phase 1 — Discovery loop ✅ **MECHANICS SHIPPED**

*Goal: first session “wow” = find something new and unlock new work.*

- [x] **1.1 Survey state** — Persist per-planet flags: `undiscovered` → `surveyed` → `active_destination` in `worldState.planets` + live `celestialBodies`. API: `playerDataManager.getPlanetDiscoveryStatus(id)`, `markPlanetSurveyed(id)`, `markPlanetActiveDestination(id)`, `getPlanetsByDiscoveryStatus(status)`.
- [x] **1.2 Scan mission payout** — `ORBIT_PLANET` missions complete on orbit lock at the target world; first survey pays `discoveryBonus` + marks planet `surveyed`. Helpers: `missionManager.onOrbitLocked`, `applySurveyDiscovery`.
- [x] **1.3 Fog / visibility** — Unknown worlds hidden on NAV/radar until an accepted scan mission (`Unknown Signal N` blip, alternates with `?`) or orbit discovery (green dot + name). Two starter worlds near station are pre-surveyed. Fixed-size map blips (no giant rings).
- [x] **1.3b Organic discovery notification** — Orbit-lock on an unknown world (no scan mission) shows a **click-to-dismiss** discovery banner (`notification_manager.js`). Teaser stats + satirical flavor; foundation for full planet dossier pop-up later.
- [x] **1.4 Unlock missions** — Mission board lists all contracts with **locked** vs **unlocked** state. Tier-2+ jobs require `minSurveyedWorlds` and/or `surveyedPlanetTypes` in `mission_catalogue.js`; hints show progress (e.g. 2/3 catalogued).
- [ ] **1.5 First anomaly** — **DEFERRED** (see Phase 5.2+). Not a generic ping — each anomaly should be memorable: derelict wreck, exotic planet, black hole hazard zone, massive alien mothership, etc. Each unlocks a **special mission chain**, not just one contract type.
- [ ] **1.6 Discovery journal (light)** — **DEFERRED** until narrative slice; dock or Fleet UI panel listing discovered worlds. Can merge with codex (6.1).

**Playtest win (achieved):** Scan or fly → catalogue world → locked job unlocks on board.

---

### Phase 1B — Story, missions & game feel ✅ **COMPLETE**

*Goal: the game feels continuous — player knows *why* they’re here, UI supports exploration without hand-holding, and missions read like real work.*

Build in this order (each slice is playable before the next):

#### 1B.1 Narrative frame (intro & continuity)

- [x] **Intro / backstory screen** — Holo contractor briefing before first dock: hauler in under-charted K-14, repo **Stardust Drifter**, **StarHopper Cargo** fronted costs, survey to unlock board work. `intro_screen.js` + click-to-continue.
- [x] **Load Game vs New Game** — Start screen: **Continue Contract** / **New Contract** (confirm + save wipe) for returning players; **Begin Contract** + intro for first session.
- [x] **Issuer voice on missions** — Catalogue fields: `issuer`, `briefing`, `flavorTag`, `completionLine`. Mission board shows issuer, type tag, and briefing.
- [x] **Tier 0 — Tutorial chain** — One-time cert + fetch missions: `DOCK_CERT` (launch & re-dock), `FETCH_AND_DELIVER` (orbit/land at **starter worlds** → return to station). Timed contracts with HUD countdown; `completedMissionIds` + mission chain unlocks.
- [x] **Tier 1 — Discovery** — Scan **unknown signals** via `firstUndiscoveredRank`; gated after tutorial chain.
- [x] **Tier 2 — Locked** — GSO lander drop + core sample; copy explains insurance / catalog requirements.
- [x] **Catalogue schema** — `era`, `tier`, `sortOrder`, `issuer`, `briefing`, `flavorTag`, `completionLine`; grouped in `mission_catalogue.js`.

#### 1B.3 Mechanics that make missions matter (Phase 2 core)

*Pull forward from Phase 2 — this is what makes Era 1 missions feel like a game, not a menu.*

- [x] **2.1 Designated pad missions** — `requiredPadId` on land contracts; wrong pad = safe landing but no payout + mismatch banner.
- [x] **2.2 Planet-type cargo** — `requiredPlanetTypeId` / `requires.surveyedPlanetTypes` gate sample and land missions by world type.
- [x] **2.3 Lander failure flow** — Crash → return to **orbiting mothership** (not dock); `DROP_SHIP_REPLACEMENT_COST` + contract failed.
- [x] **2.3b Crash contract rules** — Only lander-relevant contracts void on crash; cargo loss copy when cargo was aboard; scan/orbit jobs survive an unrelated drop-ship crash.
- [x] **2.4 Mission board UX** — Requirement tags: planet type, hazard, pad id on mission cards.

#### 1B.4 UI coherence (light touch)

- [x] **Station purpose clarity** — Dock menu one-line subtitles per station (consumables, contracts, bank, etc.).
- [x] **No tutorial walls** — Hints via mission briefings and discovery notifications; player figures out NAV/orbit by doing.
- [x] **6.3b Mission-complete banners** — Contract payout uses notification banner (gold CONTRACT variant); crash/warning/error variants wired in `mission_manager.js`.
- [x] **6.3b Remaining alert() migration** — Fleet, trade, rescue, Titan supply, space scene errors via `ui_notify.js` + notification banners.
- [x] **Station terminal panels** — Mission board & trade hub enlarged (`station-panel` layout); fleet holo desk unchanged.

**Playtest win:** New player reads intro → accepts a job that *sounds* like a job → completes it → understands they’re charting the sector for money and unlocks.

---

### Phase 2 — Missions & lander stakes ⭐ **START HERE**

*Goal: deliveries matter; planet types feel different. **Most items moved to Phase 1B.3** — keep this section for Era 2+ expansion.*

- [ ] **2.5 Multi-leg contracts (optional)** — Pick up at A → deliver to dock B; bonus for fuel remaining.
- [x] **2.6 Era 2 mission pack (initial)** — Rim scan + planet-type fetch/sample/land chain (ice, water, volcanic, city); gated after Era 1 core sample.
- [ ] **2.6b Era 2 expansion** — Repeatable type routes, gas-giant cloud ports, certification tiers.

**Playtest win:** Choosing *which* job and *which* planet feels like a decision, not a menu click.

---

### Phase 3 — Economy & growth pressure

*Goal: “start small → bigger” has teeth.*

- [ ] **3.0 Ship hierarchy design review** — **Before** adding more hulls or Apex modules: audit the full ladder (starter → hauler → specialist → late game). Each tier must *do* something the previous tier cannot — speed, cargo, efficiency, or role (see **Ship progression design** below). Tie missions, fuel cost, and payouts to that ladder so upgrades feel necessary, not cosmetic.
- [ ] **3.1 Apex repair (Economy C)** — Damage sources (bad landing, hull events); **Apex Outfitting & Repair** UI; `shipRepairCostPerHealth`.
- [ ] **3.2 Aegis banking (Economy D)** — Balance, statements, loans + autopay; wire background asset.
- [ ] **3.3 Ship tiers** — Gate tier-2/3 ships behind credits + optional certification; implement reviewed stat curves from 3.0.
- [ ] **3.4 Cargo capacity missions** — Contracts that **require** minimum `cargoCapacity` (bulk haul, multi-crate) so buying a hauler is a real unlock, not optional.
- [ ] **3.5 Modules (Apex / Star-Propulsion)** — Fuel tank, cargo pod, shields, engine swaps — trade-offs and discovery (see **Ship progression design**). Installed at Apex/Titan/R&D when wired.

**Locked rules:** Mission pay = **instant on completion**. Stations: Orbital = missions, Trade = ships, Titan = consumables, Apex = repair, Aegis = bank, Fleet = dispatch only.

#### Ship progression design (north-star tension)

*Capture from playtest/design — keep upgrades and hull choices feeling like discovery + hustle, not a spreadsheet.*

**Why upgrade?** Every ship tier or module should answer at least one of:

| Lever | Player feel | Mission / economy hook |
|-------|-------------|-------------------------|
| **Speed / thrust** | “I can make timed contracts.” | Tier 2+ time limits, relay windows, hostile escape |
| **Cargo capacity** | “I can take the big job.” | Bulk delivery, multi-leg loads, fleet cargo missions |
| **Fuel efficiency** | “I can reach the rim without tow.” | Long routes, low margins, Era 3 “fuel remaining” bonus |
| **Role hull** | “I have the *right tool*.” | Resupply tanker, survey scout, combat escort — see below |
| **Modules (Apex/R&D)** | “I found the obvious fix.” | Shields for hostile landing, ion drive for tanker, extra tank for explorers |

**Balance guardrails (avoid boredom or despair):**

- **Missions must ask for the stat** — If no job needs cargo space, nobody buys haulers. If fuel is cheap and pay is high, efficiency never matters. Review pay vs consumable burn per route when adding Era 2+ jobs.
- **Timed contracts** should reward faster hulls without making starter ship impossible (generous first windows, tighter later).
- **Discovery of gear** — New engine types (chemical → ion → plasma → nuclear → exotic), shield families, etc. should appear as **unlock + purchase** (certification, anomaly chain, or Apex tier), not all in the shop on day one.
- **Trade-offs, not strict upgrades** — Ion-efficient tanker may be slow; fast courier may have tiny cargo; combat-ready may burn fuel. Player chooses strategy.
- **Necessity curve** — Early game: survive on starter. Mid: first “I need X” moment (capacity or range). Late: hostiles, anomalies, or margin pressure make Apex modules obvious.

**Specialist hull — resupply / tanker (planned):**

- Purchasable **resupply ship** — flies efficiently on **ions / electricity** (low fuel burn), weak combat/cargo.
- Gameplay: dispatch tanker to a **stranded** fleet mate (out of fuel, far from station) and transfer fuel **in the field** — alternative to ¢1,000 emergency tow back to Alpha.
- Unlocks Era 3 fleet-operator fantasy with 4.2; pairs with relay / multi-ship play (Phase 4).

**Design review deliverable (3.0):** One-page tier table in `ECONOMY.md` or new `SHIPS.md` — hull stats, intended role, which mission IDs require it, break-even fuel math for sample routes.

---

### Phase 4 — Fleet as operator tool

*Goal: multi-ship company without full AI autopilot.*

- [ ] **4.1 Relay missions** — Ship A must hold orbit at X while player lands with Ship B (or timed pickup).
- [ ] **4.2 Stranded / rescue fantasy** — **Resupply tanker hull** (ion/electricity-efficient, buy at Trade Hub): fly to out-of-fuel ship and transfer fuel in deep space — avoids tow when you planned ahead. Keep **Request Tow** (¢1,000) as panic button. Expanded relay / fuel-delivery missions later.
- [ ] **4.3 Fleet Manager status** — Speed, “en route to…”, low fuel warnings; **Distance to Target** for ships with an active contract (e.g. `Distance to target: 124,500` — mission planet, unknown signal, or return dock). Raw X/Y coords alone don’t tell the player how far the job is; pairs with mission briefings until holo-map (4.4) ships.
- [ ] **4.4 Tactical holo-map (8.2)** — NavScreen-style map in Fleet Manager: all ships, routes, mission targets, tooltips.
- [ ] **4.5 Sector overlap indicator (6.2)** — Visual when multiple ships share a region.

**Paused (not priority):** Waypoint autopilot, background consumables burn off-scene — revisit when discovery + missions loop is fun.

---

### Phase 5 — First contact, anomalies & trade routes

*Goal: alien content, **special discoveries**, and long-term surprises. Anomalies deferred from 1.5 land here — each is a set piece, not a generic blip.*

- [ ] **5.1 Alien assets** — Add `assets/ships/alienships` to `asset_catalogue.js`; glam shots / placeholders in Trade or codex.
- [ ] **5.2 Special anomalies (was 1.5)** — Discoverable set pieces, each with unique NAV presentation + discovery moment + mission chain:
  - Derelict wreck (salvage, black box, ghost log)
  - Exotic / anomalous planet (weird dossier, sample contract)
  - Black hole or gravity hazard (navigation challenge, science payout)
  - Alien mothership (silent ping → later first contact arc)
- [ ] **5.3 Alien world or port** — Hidden until anomaly chain; unique planet type or dock scene variant.
- [ ] **5.4 Trade route unlock** — Buy cheap at A, sell at B; route appears on board after first contact.
- [ ] **5.5 Alien hull reward** — Discovery reward ship or module, not shop purchase.

---

### Phase 6 — Endgame & polish

*Goal: completionist path and session quality.*

- [ ] **6.1 Codex** — Track X/Y planets, routes, anomalies, ships; visible in dock UI.
- [ ] **6.2 Start screen (10.0)** — Load Game vs New Game + confirm reset (`localStorage` clear).
- [ ] **6.3 Universal dock UI (9.0)** — Shared holo styles, ESC close, consistent patterns.
- [ ] **6.3b Unified notification banners** — Mostly done (1B.4); remaining: dossier modal upgrade for planet discovery. `alert()` migration complete via `ui_notify.js`.
- [ ] **6.4 Post-landing scene** — Surface beat after safe landing (scan, local contact, optional choice).
- [ ] **6.5 Planet gameplay differentiation** — Ice drift, volcanic jitter, hostile landing, etc. See [LANDER.md](LANDER.md).
- [ ] **6.6 Drop ship variety** — Multiple equipped landers with different stats.

---

## Paused / deferred

| Item | Why paused |
|------|------------|
| **1.5 generic anomaly MVP** | Wait for special set-piece anomalies (5.2) — derelict, black hole, alien mothership |
| **1.6 discovery journal** | After intro + mission voice; may merge with codex |
| Fleet Phase 2 autopilot | Gameplay-first; narrative + mission stakes higher value |
| Hidden-tab sim polish (Test 4) | QoL; not core fantasy |
| 7.10.8–9 orbit/nav edge cases | Re-test when touching orbit/fleet nav |
| Background consumables off-scene | After autopilot or explicit idle-burn design |

---

## Idea backlog (good, not scheduled)

- Mission `briefing` / `completionLine` VO or radio chatter (text first)
- Reputation / license tiers for mission classes
- One-off planet events (quake closes pads, storm bonus pay)
- NPC rival hauler at pad — race or intel
- Hostile worlds — dodge fire on descent; shields/weapons as Apex unlocks
- Prestige / megaproject final delivery
- Intro screen variant for returning players (“Resume contract” one-liner)
- Engine families as discoverable upgrades — chemical, ion, plasma, nuclear, point-to-point exotic (trade-offs, not linear power creep)
- Shield / defense modules — obvious need for hostile landing or anomaly zones
- Mission payouts tuned to fuel burn per route (margin matters on long hauls)
- “Fuel remaining” contract bonus — rewards efficient hulls on timed or long routes
- Codex entries for ship classes and modules (discovery journal overlap)

*Moved to phased roadmap:* resupply tanker hull → **4.2** · ship hierarchy review → **3.0** · fleet distance-to-target → **4.3**

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
| `SHIPS.md` *(planned, 3.0)* | Ship tier ladder, stats, mission requirements, fuel math |
| [ADDING_ASSETS.md](ADDING_ASSETS.md) | New images & sounds |
