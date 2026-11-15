# Ship tier ladder — Phase 3.0 design review

**Status:** Design review only. No code changes in this slice.
**Reviewed:** 2026-11-15 · **Branch:** `testing/phase-3.0-ship-hierarchy`
**Basis (read from the repo at main):** `scripts/core/ship_catalogue.js`,
`mission_catalogue.js`, `consumables_catalogue.js`, `managers/consumables_manager.js`,
`game_objects/ship.js`, `managers/rescue_manager.js`, `ECONOMY.md`, `ROADMAP.md`.

Section 2 is the one-page tier table the roadmap asks for. Sections 1, 4, and 5 are
the audit and math behind it. Proposed stats are targets for 3.3 — nothing here
is implemented yet. Mission gating proposals need new `requires` fields (3.3/3.4).

---

## 1. Audit findings (verified from code)

1. **Prices are flat.** Buy ¢4,000–¢5,500, sell ¢3,500–¢4,500 across all 8 hulls.
   The 16-cargo Big Boy costs the same ¢5,500 as the 2-cargo Echo Pacer. Once the
   player can afford one mid hull, they can afford them all — there is no savings
   ladder.
2. **Three hulls are identical.** Zenith Runner, Apex Arrow, and Star Surfer share
   price (¢5,500), cargo (4), thrust (0.14), size, zoom, thruster layout, and
   description. Only art and name differ.
3. **Thrust ordering contradicts the fiction.** The "nimble interceptor" Apex Dart
   (0.12) and the Echo Pacer (0.14) both accelerate slower than the starter
   Stardust Drifter (template 0.15). The two heavy haulers (0.04) accelerate at
   ~27% of the starter's rate.
4. **Everything else is inherited.** Max speed 20.0, max health 100, repair
   ¢2/health, burn 2.5 fuel/s, and 100-unit tanks all come from `baseShipTemplate`;
   no hull overrides them (the haulers only add rotation 0.002). There is no
   durability, efficiency, or speed ladder at all.
5. **No mission asks for a stat.** No mission gates on cargo, thrust, speed,
   health, or hull — `requires` only covers completed missions, surveyed-world
   counts, and surveyed planet types. No trade gating exists either: every hull is
   buyable on day one with credits. Buying a bigger ship is never necessary.
6. **Fuel is the only consumable with teeth.** Fuel ≤ 0 disables thrust and enables
   the ¢1,000 tow (`rescue_manager.js`). No handling was found for oxygen or
   electricity reaching 0 — they drain but nothing happens. The economy findings
   in §5 assume that stays true until a later slice decides otherwise.
7. **Pacing is good and worth preserving.** Start: ¢2,500 balance (StarHopper
   advance) + repo Stardust Drifter. The Tier 0 chain grosses ¢2,050 and Tier 1
   grosses ¢2,100 (incl. discovery bonuses); after the 30% StarHopper skim, the
   first purchasable hull lands right around Tier 2 unlock. Keep that rhythm when
   prices move: the first upgrade should arrive as Tier 2 opens, the first hauler
   as Era 2 opens, the heavy haulers deep into Era 2.

## 2. Proposed tier table (targets for 3.3)

| Hull | Tier | Buy | Sell | Cargo | Thrust | Max speed | Health | Burn/s | Repair ¢/hp | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| Stardust Drifter | 0 Starter | 4,000 | 3,500 | 1 | 0.15 | 20.0 | 100 | 2.5 | 2 | Generalist starter (unchanged) |
| Apex Dart | 1 Courier | 5,000 | 4,000 | 2 | 0.20 | 24.0 | 80 | 2.5 | 2 | Timed contracts, scan runs; fragile |
| Echo Pacer | 1 Explorer | 5,500 | 4,500 | 2 | 0.14 | 20.0 | 100 | 2.0 | 2 | Long survey loops; efficient |
| Zenith Runner | 2 Fast hauler | 7,500 | 6,000 | 4 | 0.17 | 22.0 | 100 | 2.5 | 2 | Timed mid-tier fetches |
| Apex Arrow | 2 Efficient hauler | 7,500 | 6,000 | 4 | 0.14 | 20.0 | 100 | 1.8 | 2 | Rim routes, fuel-margin bonus |
| Star Surfer | 2 Rugged hauler | 7,500 | 6,000 | 4 | 0.12 | 20.0 | 140 | 2.5 | 3 | Volcanic/hostile pads; survives hits |
| Black Falcon | 3 Heavy hauler | 11,000 | 8,500 | 12 | 0.06 | 18.0 | 160 | 3.0 | 3 | Bulk haul; slow, thirsty, tough |
| Big Boy | 3 Max hauler | 14,000 | 11,000 | 16 | 0.04 | 16.0 | 180 | 3.5 | 4 | Biggest bulk jobs; slowest, thirstiest |

Every column maps to an existing catalogue field (`shipBuyValue`, `shipSellValue`,
`shipCargoCapacity`, `shipThrustPower`, `shipMaxSpeed`, `shipMaxHealth`,
`shipThrusterBurnRate`, `shipRepairCostPerHealth`). 3.3 also adds a `shipTier`
field per hull for gating (§4). Tank sizes stay 100 for all hulls in this pass —
tank upgrades belong to 3.5 modules, not the base ladder.

## 3. Role notes (why each tier exists)

- **Tier 0 — Starter.** The repo Drifter does everything badly and nothing
  terribly. It must stay viable through Tier 1 so the first purchase feels like
  a choice, not a rescue.
- **Tier 1 — Speed vs efficiency.** The Dart is the fastest hull in the game and
  the most fragile; the Pacer is unremarkable except it sips fuel. Same cargo,
  opposite answers to "what kind of pilot are you?" Neither is strictly better
  than the starter — both trade something for their edge.
- **Tier 2 — The working fleet.** Cargo 4 doubles Tier 1 and unlocks the first
  gated jobs (§4). Runner/Arrow/Surfer split on the three levers: speed,
  efficiency, toughness. Same price on purpose — the choice is strategic, not
  financial.
- **Tier 3 — Bulk.** Cargo 12/16 exists for one reason: bulk jobs no other hull
  can take. The price is speed, fuel, and credits. A Tier 3 hull should feel like
  operating heavy equipment, not like a bigger Tier 2.

## 4. Mission gating proposals (need 3.3/3.4 fields)

No mission gates on hull stats today. These proposals create the necessity curve
— each gate is the moment a tier becomes *required*, not just nice:

| Mission (reward) | Proposed requirement | Why |
|---|---|---|
| `PICK_UP_CARGO_01` (¢2,700) | `minCargoCapacity: 2` | First "need a bigger ship" moment; starter cargo 1 cannot take it |
| `ERA2_ICE_COOLANT_01` (¢2,800) | `minCargoCapacity: 2` | Coolant pallet is a 2-unit load |
| `ERA2_WATER_SAMPLE_01` (¢3,200) | `minCargoCapacity: 2` | Tray + kit; keeps Tier 1 relevant into Era 2 |
| `ERA2_VOLCANIC_LOGGER_01` (¢3,400) | `minHullTier: 2` | Danger-8 world; starter/courier hulls excluded |
| `ERA2_CITY_MANIFEST_01` (¢3,100) | `minCargoCapacity: 4` | Bonded freight is multi-crate; first Tier 2 cargo gate |
| Future 3.4 bulk missions | `minCargoCapacity: 12 / 16` | Falcon / Big Boy only — the reason Tier 3 exists |
| All Tier 0–1, scan, and pad-skill missions | No gate | Starter-sufficient by design; speed/efficiency are soft advantages, not requirements |

New fields: `requires.minCargoCapacity` and `requires.minHullTier`, evaluated by
the mission board in 3.3/3.4. The board should show the requirement on the card
(the same way it already shows planet-type and pad tags) so a locked job reads as
"get a bigger ship," not as a mystery.

## 5. Break-even fuel math

### The model (exact, from code)

- Fuel: 2.5 u/s under main thrust, 0.875 u/s under RCS only, 0 while coasting or
  docked. Tank 100 u → 40 s of full thrust per tank. Price ¢8/u → ¢800/tank.
- Oxygen: 0.1 u/s while undocked. Tank 100 u → 1,000 s. Price ¢5/u → ¢500/tank.
- Electricity: 0.4 u/s idle, 0.56 u/s while thrusting/RCS. Tank 100 u → 178–250 s.
  Price ¢6/u → ¢600/tank.
- Full resupply from empty: **¢1,900**. Emergency tow: **¢1,000**.
- Acceleration is proportional to thrust: a 0.04 hull accelerates at ~27% of a
  0.15 hull's rate, so it spends ~3.75× the thrust-seconds reaching cruise speed
  and burns ~3.75× the fuel for the accel phase. (Ratio is exact; absolute
  seconds depend on the update rate.)

### Worked examples (design estimates — sortie profiles assumed; validate with playtest telemetry before tuning)

All payouts shown net of the 30% StarHopper skim (lien active).

| Route | Profile | Resupply cost | Net payout | Read |
|---|---|---|---|---|
| A. Starter-world round trip (`FETCH_ORBIT_01` class, ¢400 gross) | 10 s thrust, 60 s undocked | ~¢385 (fuel ¢200, O₂ ¢30, elec ~¢155) | ¢280 | Net-negative on full resupply; positive on fuel-only (¢200). Early game assumes partial refills + coast-efficient flying. |
| B. Scan run (`SCAN_PLANET_01`, ¢1,000 gross incl. bonus) | 20 s thrust, 120 s undocked | ~¢770 (fuel ¢400, O₂ ¢60, elec ~¢310) | ¢700 | Roughly break-even on full resupply; comfortable on fuel-only. Efficiency hulls widen the margin — the Pacer/Arrow edge in action. |
| C. Era 2 type route (`ERA2_VOLCANIC_LOGGER_01`, ¢3,400 gross) | Full tank of fuel + full O₂/elec | ¢1,900 | ¢2,380 | Margin even at maximum burn. Era 2 pays; Era 1 is scrappy by design ("I'm making rent"). The shape is right. |

### Findings for 3.3 tuning (no number changes in this slice)

1. A full resupply (¢1,900) exceeds the net payout of every Tier 0–1 mission while
   the lien is active. The economy only works because O₂/electricity depletion
   has no consequence today — if consequences are ever added, retune first.
2. On fuel alone, missions break even only on short, efficient burns. The tutorial
   should teach coast-efficient flying, or 3.3 adjusts fuel price/burn — decide
   with real thrust-seconds telemetry, not guesses.
3. The haulers' fuel penalty is already real physics (see accel ratio above) —
   3.3 should not add a second penalty on top. The burn-rate column in §2 is the
   only additional lever, and it is small on purpose.

## 6. What 3.0 does not change / follow-ups

- **3.1 Apex repair:** use the Repair ¢/hp column — rugged/heavy hulls cost more
  per point to fix. Damage sources will decide whether the health ladder matters.
- **3.3 Ship tiers:** implement the §2 curves + `shipTier` field + trade gating
  (credits + optional certification); evaluate the §4 `requires` fields on the
  mission board.
- **3.4 Cargo missions:** bulk contracts requiring 12/16 cargo — the Tier 3
  reason to exist.
- **3.5 Modules:** fuel tank, cargo pod, shields, engine swaps. The speed /
  efficiency / toughness levers in §2 become module trade-offs; do not let modules
  erase the hull ladder.
- **4.2 Resupply tanker:** planned specialist hull (ion/electric-efficient). Not
  statted here — but its efficiency must beat the Arrow's 1.8 burn/s to justify
  existing, and it stays weak on cargo and combat per the roadmap.
- **Open:** O₂/electricity depletion consequences (TBD, later slice). Lander fuel
  (550–950 by terrain) is a separate system and out of scope here.
- **Roadmap bookkeeping:** check the 3.0 box and link this doc in the ROADMAP.md
  doc index at merge time. Left untouched in this branch so the diff is exactly
  this file.
