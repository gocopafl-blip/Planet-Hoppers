# Fleet background simulation

**Who this is for:** **You** when validating fleet behavior off the space scene.  
**For AI:** Requirements for 8.2+ and physics fidelity notes (8.1 is done).

---

## Goal

Fleet ships keep moving (space drift, orbit) while you are in Fleet Manager, Titan, missions, etc.

**Implemented (8.1):** `BackgroundFleetSimulator` in `game_manager.js`; physics in `fleet_manager.updateFleetPhysics()`; ~12 fps background, 60 fps in space scene. Background drift uses `deltaSec × SPACE_PHYSICS_FPS` (same units as `ship.js` per-frame integration).

**Not implemented:** Fleet Manager tactical holo-map (8.2), full 8.3–8.4 validation checklist as product work.

---

## Behavior (current)

- Docked ships: no background physics
- Active ship in **space scene**: piloted in `space_scene` (background sim skips it)
- Active ship **after Terminate Remote Command** (Fleet Manager, etc.): background sim includes it — coasts on saved velocity
- Other ships: orbit or free-flight per saved `location`
- Hidden browser tab: game loop uses `setInterval` (~1s) so sim still advances; no draw while hidden
- Fleet Manager list refreshes coordinates every ~2s while open
- Positions live in `playerDataManager.data.fleet`; checkpoints on scene change / unload

**Note:** Early PRD mentioned gravity wells; game uses **simplified orbit** (Task 7.x), not gravity assist.

---

## Open work

| Task | Description |
|------|-------------|
| 8.2 | Tactical holo-map in Fleet Manager (NavScreen-style, all ships + routes) |
| 8.3 | Document/verify persistence with background ticks |
| 8.4 | Multi-ship perf and scene-transition sync tests |

---

## Manual test checklist

Use Go Live; DevTools console open.

1. **Init** — After load: `gameManager.backgroundFleetSimulator.isActive === true`
2. **Background tick** — Fleet Manager only; deep-space ship `x,y` change over ~5s
3. **Rate 12 → 60** — Enter space: log ~60 fps rate
4. **Rate 60 → 12** — Terminate Remote Command: back to ~12 fps
5. **Orbit** — Ship in orbit; leave Fleet Manager 10s; Jump To: still orbiting, angle advanced
6. **Mixed fleet** — Docked idle; one in space; one in orbit — only movers update
7. **Refresh** — Positions sane after F5 (planet save + fleet location)

**Console helpers**

```javascript
gameManager.backgroundFleetSimulator.updateRate
playerDataManager.data.fleet.forEach(s => console.log(s.name, s.location?.type, s.location?.x, s.location?.y))
```

---

## Future (out of scope for 8.1)

- Remote commands from Fleet Manager
- Autopilot / AI captains
- Alerts for low fuel / emergencies
- Fuel burn on background ships (mothership burn is in active space scene today)
