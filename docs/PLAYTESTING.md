# Playtesting & saves

**Who this is for:** **You** — how to run the game and avoid false “bugs.”  
**For AI:** Reference when debugging save/planet/fleet issues (not a feature spec).

---

## Run the game locally

Use **Cursor Go Live** (or any local HTTP server), not `file://` on `index.html`.

- Saves use `localStorage` key `planetHoppersSaveData`
- `file://` often blocks or isolates storage → lost progress, odd errors

---

## Localhost vs GitHub Pages

| Origin | Saves |
|--------|--------|
| `http://127.0.0.1:5500` (Go Live) | One save slot |
| `https://<user>.github.io/...` (Pages) | **Separate** save slot |

Same code, different browser storage. A full fleet on localhost does **not** appear on GitHub until you play there (or add export/import later).

---

## After pulling new code

1. Hard refresh (Ctrl+F5)
2. Open DevTools → Console once
3. If you see `Player save migrated to current schema.` — an older save was repaired (expected)
4. If things are still broken: Application → Local Storage → delete `planetHoppersSaveData` → refresh (fresh new game)

---

## Quick smoke test

1. Fleet Manager → Dispatch or Jump To → space scene loads, ship controllable  
2. NAV screen opens; planets visible on radar  
3. Orbit a planet → Launch Drop Ship → land → return to orbit (not dock)  
4. Titan Supply refills a **docked** ship; balance drops; ledger updates  
5. Run out of fuel → **Request Tow** → Titan opens; refill works  

Background fleet sim: [FLEET_BACKGROUND_SIMULATION.md#manual-test-checklist](FLEET_BACKGROUND_SIMULATION.md#manual-test-checklist)
