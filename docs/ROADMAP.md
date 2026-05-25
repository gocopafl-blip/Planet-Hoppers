# Planet Hoppers — Roadmap

**Who this is for:** Primarily **you** — what to build next and what’s already done.  
**For AI:** Point the agent at this file (or a section) at the start of a session so it doesn’t re-plan settled decisions.

**Branch:** `fleet_manager_update` (economy, lander v1, tow, save migration as of `e1394d3`)

---

## Completed (recent)

- **Economy A** — Transaction ledger, `credit` / `spend`, mission/trade/fleet purchases
- **Economy B** — Consumables burn in space, Titan Supply (docked refills)
- **Consumables HUD** — Lower-left fuel / O₂ / power gauges
- **Request Tow** — ¢1,000, dock at Alpha, auto-open Titan when fuel = 0
- **Lander v1** — Planet-driven terrain, wind, gas cloud pads, orbit launch/return fix
- **Fleet stability** — Background sim, orbit saves, stale planet warnings fixed, save migration on load

---

## Economy (next)

| Phase | Scope |
|-------|--------|
| **C — Repair** | Damage sources; **Apex Outfitting & Repair** UI (`shipRepairCostPerHealth`) |
| **D — Banking** | **Aegis Banking Systems** scene; balance, statements, loans + autopay (15 min playtime slider) |

**Locked rules**

- Mission pay: **instant on completion** (remote commander at station)
- Stations: Titan = consumables, Apex = repair, Trade = ships, Orbital = missions, Fleet = dispatch only

**Tuning**

- Adjust consumable burn rates in `ship_catalogue.js` (use space HUD while flying)

**Later**

- Cargo ship delivers consumables to stranded fleet (instead of tow only)

Details: [ECONOMY.md](ECONOMY.md)

---

## Lander (next)

| Item | Notes |
|------|--------|
| **Failure flow** | Crash → return to **orbiting mothership** (not dock); lose drop ship + replacement cost; mission cargo penalty |
| **Designated pads** | Missions require specific pad id (ids exist in v1; any pad wins today) |
| **Post-landing scene** | Surface dock / interactions after safe landing |
| **Drop ship variety** | Multiple equipped drop ships with different stats |
| **Hostile landing** | Incoming fire / dodge while descending |
| **Polish** | Volcanic seismic jitter; stronger wind by `dangerLevel` |

Details: [LANDER.md](LANDER.md)

---

## Fleet, dock UI, start screen

See [FLEET_AND_ORBIT.md](FLEET_AND_ORBIT.md) (open items) and [FLEET_BACKGROUND_SIMULATION.md](FLEET_BACKGROUND_SIMULATION.md) (tactical map + validation).

Highlights:

- **6.2** — Visual indicators when multiple ships share a sector
- **8.2–8.4** — Fleet Manager tactical holo-map; persistence/perf validation
- **9.0** — Shared dock holo UI (ESC, universal close) — partial via Titan/Trade patterns
- **10.0** — Start screen: Load Game vs Start New Game + confirm reset
- **7.10.8–9** — Re-verify orbit radius / fleet nav transfer bugs; close or reopen

---

## How to work with the agent

- Planning: **1–2 questions at a time** (not long lists)
- Playtest: **Go Live** (`http://127.0.0.1:5500`) for reliable saves — see [PLAYTESTING.md](PLAYTESTING.md)
- After schema changes: saves auto-migrate on load; old broken saves heal without manual delete
