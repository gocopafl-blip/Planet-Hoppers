# Economy design notes

**Who this is for:** **You** — decisions and station roles.  
**For AI:** Implement C/D using these rules; don’t re-ask mission pay or station mapping.

---

## Station roles (locked)

| Dock menu | Role |
|-----------|------|
| Orbital Cargo Solutions | Missions → income |
| Galactic Trade Hub | Buy / sell ships |
| **Titan Supply Services** | Refill fuel, oxygen, electricity (docked ships only) |
| **Apex Outfitting & Repair** | Hull repair (Phase C) |
| **Aegis Banking Systems** | Balance, statements, loans (Phase D) |
| Fleet Management Services | Fleet status, dispatch, Jump To |

Background asset: `assets/images/dock_backgrounds/Aegis Banking Systems.png` (wire in Phase D)

---

## Ledger

- Categories: `mission`, `ship`, `consumables`, `repair`, `tow`, `loan`, `debug`, `other`
- Stored in `playerData.transactionLedger` (newest first, cap 250)
- Use `playerDataManager.credit()` / `spend()` for all money movement

---

## Consumables (implemented)

- Prices: `scripts/core/consumables_catalogue.js`
- Burn in space: `consumables_manager.applyFlightBurn()`
- Refill: Titan Supply scene (docked ships only)
- Tow: ¢1,000 via `rescue_manager.js` when active ship fuel ≤ 0

---

## Phase C — Repair (not built)

- Damage sources TBD (collision, overspeed, combat, etc.)
- Apex UI: pay `shipRepairCostPerHealth` from catalogue to restore `currentHealth`
- Ledger category: `repair`

---

## Phase D — Banking (not built)

- Loans + slider autopay every **15 minutes playtime**
- Balance + transaction history UI (ledger already populated)
- Ledger category: `loan`
