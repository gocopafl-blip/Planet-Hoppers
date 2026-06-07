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
| **Aegis Banking Systems** | Loan broker terminal — statements, credit rating, lender market, routing |
| Fleet Management Services | Fleet status, dispatch, Jump To |

Background asset: `assets/images/dock_backgrounds/Aegis Banking Systems.png` (wired in 3.2a)

**Vessel prefix:** `playerData.vesselPrefix` (default `USV`) — formal callsign on fleet UI, e.g. **USV Christina, Stardust Drifter**.

---

## Ledger

- Categories: `mission`, `ship`, `consumables`, `repair`, `tow`, `loan`, `debug`, `other`
- Stored in `playerData.transactionLedger` (newest first, cap 250)
- Use `playerDataManager.credit()` / `spend()` for all money movement
- Mission payouts should record **gross**, per-lien deductions, and **net** when banking is active

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

## Phase D — Aegis loan market (design locked)

**Aegis is not the lender** — it is the station’s **loan desk / broker** with terminals to third-party lenders (and StarHopper’s pre-assigned advance).

### StarHopper opening advance (lender #0)

- New contractors start with **¢2,500** in `playerBankBalance` — this is a **draw against debt**, not a gift.
- **Principal owed:** ¢2,500 to StarHopper Cargo.
- **Repayment:** On each **gross contract payout** `G`, until principal is ¢0:
  - **18% of G** → interest (gone)
  - **12% of G** → principal (reduces balance)
  - **Total skim: 30% of G** (not 30% + extra fees)
- When principal reaches ¢0, the StarHopper lien **ends** (no further 30% skim).

**Example:** Mission pays ¢1,000 gross → ¢180 interest, ¢120 principal, **¢700** remaining before other liens.

**Reveal:** First mission completion — player expects full reward; notification explains skim + “Visit Aegis Banking for your contractor lien statement.”

### Payout deduction order (locked)

1. **StarHopper** — contract-fixed split (while principal > 0)
2. **Per-job flat fees** — e.g. ¢100/job from active market loans
3. **Market loan auto-skim** — each loan’s **fixed** % of gross (principal/interest split in fine print)
4. **Net** → `playerBankBalance` via `credit()`

### Market loans (lender catalogue)

- Player browses **loan market** grid/list: lenders × loan products (¢500 bridge, ¢1,500 gap, etc.).
- **Unlimited concurrent loans** in principle; **lender offers** gated by qualifiers (see credit rating).
- **Terms are fixed at signing** — advertised headline rate (e.g. “14% of future income”) hides the **fine print** split (e.g. 11% interest / 3% principal) plus fees. Player does **not** choose principal vs interest allocation.
- **Repayment paths:**
  - **Automatic** — skim on each contract payout per signed terms
  - **Make Payment** — manual paydown from balance at Aegis (diligent players save on drag); some lenders charge **early payoff fee**
- **Weird hooks** (data-driven per lender/product in `lender_catalogue.js`):
  - Total % of gross + internal interest/principal split
  - Flat fee per mission completion
  - Origination fee at draw
  - Early payoff fee
  - Ship collateral lien
  - Compound after N missions unpaid

### Tuning & code layout

- All rates, splits, and caps live in **`finance_constants.js`** + **`lender_catalogue.js`** — no magic numbers in UI scenes.
- Payout logic centralized in **`banking_manager.js`** (single `applyContractPayoutDeductions(gross)` entry for 3.2b).
- UI reads snapshots via `bankingManager.getDashboardSnapshot()` only.

### Contractor credit rating

- Single computed score (e.g. **K-14 Trust Index** 300–850 or letter grade) — easier than bespoke checks per lender.
- **Inputs:** total debt vs lifetime mission earnings, active loan count, delinquency/compound events, manual payment history.
- **Outputs:** which lenders/products appear in market; worse credit = fewer cells / worse rates.
- Display on Aegis dashboard — feedback loop for financial decisions.

### Aegis UI (reference)

- **Dashboard cards:** balance, total liabilities, income committed %, credit rating, lifetime earnings
- **Active liens tab:** each loan + progress bar + **Make Payment** + expand for fine-print terms
- **Loan market tab:** grid default / list toggle — shop lenders
- **Statement tab:** ledger with gross/deductions/net lines

### Unlock

- StarHopper lien: day one (hidden until first payout)
- Market lenders: after **¢X lifetime mission earnings** (tune in constants); later + reputation tier

### Implementation slices

| Slice | Content |
|-------|---------|
| **3.2a** | Aegis scene, background, dashboard shell, statement list |
| **3.2b** | StarHopper lien + payout hook + first-job reveal |
| **3.2c** | Credit rating + lender catalogue + loan market grid (6–8 lenders) |
| **3.2d** | Make Payment, early payoff fees, auto-skim from signed terms, collateral/compound hooks |

Ledger category: `loan` (meta: `lenderId`, `principal`, `interest`, `grossPayout`).
