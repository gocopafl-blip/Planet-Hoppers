# Fleet Manager, orbit & dock UI

**Who this is for:** **You** — big fleet/orbit feature status.  
**For AI:** Context for fleet_manager, space_scene, orbit tasks; check **Open** before starting work.

---

## Vision (summary)

Remote commander: Fleet Manager lists all ships; **Jump To** / **Dispatch**; **Terminate Remote Command** returns to fleet; missions assigned per ship; non-active ships persist location, orbit, consumables.

Dock stays the hub for services; space scene is for piloting the active ship.

---

## Done

- Fleet list, glam shots, status, Jump To / Dispatch, Terminate Remote Command
- Per-ship state in `playerDataManager` (location, consumables, health, navigation, missions)
- Multi-ship rendering in space; click to switch active ship
- Simplified orbit (no gravity wells): enter at speed band, thrust changes radius, exit at max speed
- Orbital ring + departure line HUD
- Background fleet physics at ~12 fps off space scene; 60 fps in space (`BackgroundFleetSimulator`)
- Planet layout persisted in `worldState.planets`

**Code touchpoints:** `fleet_manager_scene.js`, `fleet_manager.js`, `space_scene.js`, `game_manager.js`, `player_data_manager.js`

---

## Open

### Fleet visualization

- **6.2** — Visual indicators when multiple ships are in the same sector

### Orbit / nav (verify & close)

- **7.10.8** — Orbit radius edge cases (re-test; may be fixed)
- **7.10.9** — Fleet transfer click not copying nav data (re-test)

### Fleet Manager tactical map (8.2–8.4)

- Holo-map in Fleet Manager: all ships, routes, tooltips
- Confirm background sim writes positions; refresh restores correctly
- Perf test with 3–5+ ships

See [FLEET_BACKGROUND_SIMULATION.md](FLEET_BACKGROUND_SIMULATION.md)

### Universal dock UI (9.0)

- Shared `.holo-interface` styles, universal close, ESC across dock sub-scenes
- Titan / Trade already use slide-in panels — align patterns

### Start screen (10.0)

- **Load Game** vs **Start New Game** (clear `localStorage` + confirm)

---

## Doc drift (harmless)

PRD originally renamed dock button to “Fleet Terminal Access”; menu may still say **Fleet Management Services**. Same feature.
