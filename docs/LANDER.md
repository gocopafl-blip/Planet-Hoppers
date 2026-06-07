# Lander design notes

**Who this is for:** **You** — creative direction and v1 scope.  
**For AI:** Planet-driven lander rules when touching `lander_scene.js` / `planet_catalogue.js`.

---

## v1 (shipped)

- **Difficulty:** Planet-driven only (not global easy/medium/hard)
- **Ship:** Single fixed lander type; drop-ship variety later
- **Terrain:** Terran (rolling, islands sometimes), volcanic (shelf pad), gas giant (drifting cloud pads)
- **Pads:** Any pad counts; pad ids shown for future missions
- **Success:** Land on pad → cargo delivered (instant)
- **Return:** Successful landing → restore space scene orbit state (see lander return fix in git history)

Key files: `scripts/scenes/lander_scene.js`, `scripts/lander/lander_world_generator.js`, `scripts/core/planet_catalogue.js`

---

## Failure (planned)

On crash (not safe landing):

1. Lose drop ship (pay to replace)
2. Lose mission cargo / income for that job
3. Return player to **orbiting mothership** in space scene — **not** space dock

---

## Later

- Designated pad missions (“Cloud Port 2 only”)
- Post-landing surface scene (dock UI, interactions)
- Multiple drop ship types with different stats
- Hostile worlds (weapons / dodge fire while descending)
- Volcanic seismic jitter; wind scaled by `dangerLevel`

---

## Planning preference

When expanding lander: **1–2 design questions at a time**, not long questionnaires.
