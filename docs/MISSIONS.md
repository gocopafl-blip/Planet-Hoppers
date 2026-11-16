# Planet Hoppers — Mission & Story Design

**Status:** Approved outline (Nov 15, 2026). Read first, build in slices — see §13.
**Branch:** `testing/phase-2-missions-story` (from `main` @ c97a603). `main` untouched.
**Companions:** [ROADMAP.md](ROADMAP.md) (Phase 2) · [ECONOMY.md](ECONOMY.md) ·
`SHIPS.md` (on `testing/phase-3.0-ship-hierarchy` — ship tiers/pricing this doc depends on for numbers).

---

## 1. The promise

A cargo game that becomes a mystery that becomes a rescue. The player starts as a
broke repo-salvage hauler in under-charted sector K-14, struggles for real, and
becomes endeared to the people on the station — then discovers a black hole that
doesn't just teleport, it *keeps* things: every wreck, every write-off, every
failed attempt, including theirs. Nobody has ever flown back out. The player is
the first. And for the player who falls, the road home runs through the deep —
where the rift keeps what it took, including the people.

One sentence: **you haul to survive, you explore to understand, and you go back
in to bring them home.**

---

## 2. Design laws

1. **Act 1 is a normal cargo game.** No weirdness the player can name until the
   triangulation mission (§6, Act 2). The genre changes so slowly the player
   doesn't notice until the derelict. The movie is a drama until it isn't.
2. **Sixth Sense breadcrumb rule.** Every breadcrumb must read as innocent the
   first time and damning the second. No breadcrumb may spoil on first contact.
   The full map is §7.
3. **Relationships are the stakes.** Money and ships are the early pressure;
   people are the real cost. The rift takes relationships, not just progress.
4. **Dark survival, fair odds.** Failure is real and costly. But ruin always
   needs 2–3 bad decisions, never one mistake; every lethal risk is telegraphed
   before the player takes it; and the design intent is that a prepared player
   WINS the first crossing. The stakes are absolute; the odds favor preparation.
5. **The pilot can't die outside the rift — and can inside it.** In normal
   space, every failure is survivable (eject, tow, insurance); only things are
   lost. In the rift there is no rescue. This single distinction is the whole
   mechanism (§3). The game must say it out loud, early, in crash/tow copy.
6. **Restart is canon.** A ruined run is another loop. A new game after ruin is
   another attempt the realm remembers (see `loopsCompleted`, §12).
7. **Completion lines open, never close.** Every chain mission ends with a
   question, a new contact, or a new unknown — never a tidy full stop.
8. **Spoiler protection is a system, not a hope.** The black hole does not exist
   in the world until the story spawns it (§3, rule R6). No mission, codex
   entry, or NAV trace may name it before then. Alien-ship assets stay out of
   the asset catalogue until Phase 5 work begins.

---

## 3. Cosmology — the rules

### The rift

- **R1 — Time dilation.** Inside the rift, time runs exponentially faster than
  in normal space.
- **R2 — The bookmark.** The entrance holds a bookmark to the pilot's departure
  moment. Flying back out through the rift returns the pilot to ~the moment
  they left.
- **R3 — Death breaks the bookmark.** Any other way home — death, stranding,
  recovery — loses the bookmark. A century passes in normal space. Everyone the
  pilot knew is gone. (See era shift, §10.)
- **R4 — No one has ever flown out.** Unprecedented in the fiction. The
  player's first return is the first, ever. That is the win.
- **R5 — The custodians.** The alien "teleporter" ships are custodians, not
  invaders: indifferent, not hostile — until the pilot takes the wrong thing or
  goes somewhere they guard. Indifference is scarier than hostility.
- **R6 — Gated spawning.** The black hole does not spawn until the
  triangulation mission completes. Before that, its coordinates hold empty
  space. It cannot be stumbled upon. Entry is a deliberate, confirmed choice
  (warning + confirm modal, point of no return stated).

### Rescue, salvage, and the write-off slip

- **R7 — Rescue is for crew; salvage is for hulls.** Rescue (beacon, pickup,
  med bay) is cheap, fast, and moral. Salvage (recovery rig, surface
  expedition, dead-hull tow) is expensive, slow, and priced against the hull.
  Broke haulers write off; rich operators recover. The player is broke.
- **R8 — Written-off things slip to the rift.** When the station ledger
  declares a hull or cargo abandoned, it drifts rimward over time and never
  comes back. Nobody in-fiction fully understands why (the GSO scientist says
  so). The write-off ledger and the missing-ship registry match one for one.
  The realm is centuries of write-offs — mostly other pilots' — plus the
  player's own, findable by manifest.
- **R9 — Empty wrecks vs. remains.** A wreck from a write-off is EMPTY: the
  pilot survived (eject/tow). Remains on a wreck mean exactly one thing: the
  pilot died IN the rift, where there is no rescue. The player learns the
  stakes by observation before anyone explains them.
- **R10 — The realm is the write-off ledger made physical.** The fourth wall,
  stated plainly: every time the game handed the player a replacement
  (¢750 drop ship, new hull, voided contract), the fiction buried the
  original. The player thought the game was resetting them. The game was
  burying them.

### Bookmarks, the Source, and the deep return

- **R11 — The rift holds every bookmark.** Every crossing-in leaves one.
- **R12 — A normal exit uses the latest bookmark** (the departure moment).
- **R13 — The Source can re-tune an exit to ANY held bookmark**, including
  older ones. This is the only time travel in the game: one mechanism, one
  direction (back to the pilot's own moments), one cost (the journey). No
  paradoxes, no branching timelines to track.
- **R14 — The deep return is rumor until proven.** The game NEVER confirms it
  works until the player does it. Rumor → glimpses → faith → the door home.
- **R15 — The uncanny thread: the dog (DECIDED Nov 16).** The Act 1 trinket
  (§6, TRINKET_RUN_01) is a PET: a cute dog the player delivers home to the
  kid. The dog is in the kid's portrait in every home message, all game
  long — a constant, never remarked on. After the Source return, the reunion
  plays straight: the kid is there, alive and young, and a little confused
  by the player's emotion — from the kid's perspective the player left
  recently; the century happened to the player, not to them. Then the dog
  comes into the room — and it is OBVIOUSLY A DIFFERENT BREED. That is the
  cutscene moment that ends the game story. The return is real and the joy
  is fully honored; the breed swap is the one small, quirky, slightly-off
  note that asks *"the end?"* The game NEVER explains it (bookmark
  imprecision? a near-timeline? the rift substituting something?). The
  ambiguity is the twist. Breeds A and B must be visually unmistakable at
  a glance.

### Knowledge rules (who knows what)

- **K1 — The dead zone is public knowledge; the rift is not.** Old charts mark
  the coordinates as a hazard. Ships have vanished there for decades. The
  official line: "navigational hazard, don't go there."
- **K2 — Returners are a rumor.** People who died in the rift and woke up a
  century later exist — as cranks. The mad old hauler who claims he flew K-14
  a hundred years ago. Nobody believes him. After their own crossing, the
  player understands him. If the player dies in the rift, they BECOME him to
  the new cast.
- **K3 — Nobody knows about realm deaths.** If the pilot dies in the rift and
  wakes up a century later, the world just moved on. No one marked them dead
  in the rift, because no one saw it.
- **K4 — The debt is structural, not conspiratorial.** StarHopper does not know
  about the loop. Every run starts in debt because that is the deal for every
  contractor, every time. The debt is how the loop hides: every attempt looks
  like just another broke hauler.
- **K5 — Survivors' silence.** Those who came back (via death, into a future
  era) don't talk: what they saw makes no sense, and talking earns a psych
  eval, not belief. One survivor talks to the player — after the player's own
  crossing, the one conversation in the sector that can finally happen.

---

## 4. Cast

Names **DECIDED Nov 16** (Charles delegated the picks; he renames freely —
mission text in §6 uses role labels so renaming is trivial). Every Gen-1 character needs a Gen-2 successor
for the era shift (§10); successors are different people (family resemblance
only where noted).

| Role | Name | Function | Gen-2 successor |
|------|---------------|----------|-----------------|
| **Dispatcher** | Mara Voss | The voice of the game. Warm, wry, seen-it-all. Banter, warnings, the quiet at the coordinates, the "twenty minutes" line. Portrait approved (concept, Nov 15). | A successor dispatcher who never knew the player. |
| **The Kid** | Pip, 8 | The PLAYER'S child. Messages from home with a portrait (kid + dog, always), a drawing taped in the cockpit, the reason for hauling. The face of what a century costs. | Gone. One missable archive beat: the old message/drawing (mentions the dog). |
| **The Dog** | Comet — breed A: scruffy tan terrier-mix; breed B: sleek black whippet | The kid's companion, delivered in TRINKET_RUN_01. In every home portrait. The uncanny tell: after the Source return, the dog is a different breed (R15). The cutscene's final image. | Gone with the century. The archive beat mentions it. |
| **Rival Captain** | Kess Alden (goes by Kess) | Races the player from Act 1, too good, too fast, knows too much. Builds a rift drive too. Enters first. Found as skeletons. Their half-built drive saves the player. | — (dead; their outfit may persist as background) |
| **GSO Scientist** | Dr. Ilya Sorren | Alloy analysis, the pattern, the triangulation. Curious, then afraid, then an ally. Delivers R8 ("we don't know why") and the write-off ledger line. | A successor scientist with the same files. |
| **StarHopper Collector** | Mr. Harlan (first name never given) | The lien's voice. Lien milestones, the payoff choice, the one bailout. Professional, not villainous. | The debt's heir — or the folded company's successor firm. |
| **Mad Hauler** | Old Tam | Dock-9 crank. Claims he flew K-14 a century ago. Dismissed in Act 1; recontextualized after the crossing. Seeds the deep-return rumor. | — (the player may become this figure) |
| **The Voice in the Static** | — (the player's own voice) | Dispatcher contact degrades in the realm; the static talks back in the player's voice. Never explained, only experienced. | — |
| **The Survivor** | TBD | One returner who talks — only after the player's crossing. Act 5 beat. | — |

**Asset plan (portraits):** ~6 final images per character (3 expressions × 2
generations) for 4–5 characters ≈ 30 images. Generate options in passes,
Charles picks winners. Dispatcher expressions first (she is the anchor).
Plus: the kid+dog portrait, and the ending-cutscene images (the reunion,
the dog's entrance).
Production portraits are CLEAN (no baked-in UI text — the game draws its own
holo-call frame). Animation: expression swap + CSS holo flicker + typewriter
text. Voice: generated audio for signature lines and key beats only;
text-first everywhere else.

---

## 5. Act structure

### Act 1 — Making Rent (the cargo game; endearment engine)

*Feel:* scrappy, warm, tight. *Systems:* flight, orbit, lander, board, lien,
contacts v1 (messages), kid anchor, mad-hauler breadcrumb, rival introduction.
*Law:* §2.1 — no nameable weirdness. *Exit:* tutorial chain + first scans done;
player is endeared and slightly suspicious of nothing in particular.

### Act 2 — The Map Fights Back (breadcrumbs; the race)

*Feel:* the map opens, the pattern forms, the rival sharpens. *Systems:* type
routes, fragment recovery, GSO analysis, race missions, lien fork, pirate
pressure (early). *Exit:* all four fragments + analysis → triangulation.
The dispatcher goes quiet at the coordinates.

### Act 3 — The Door (the drive; the race; the crossing)

*Feel:* urgency, rivalry, the point of no return. *Systems:* rift-drive
assembly, install race, rift spawn + gating, crossing confirm. *Exit:* rushed
install complete; the rival enters first and goes silent; the player crosses.

### Act 4 — The Realm (reveal; survival; escape)

*Feel:* horror-lite — isolation, the drone, the graveyard of yourself.
*Systems:* realm scene variant, wreck docking/scavenge, custodians, glimpses
(late), drive completion, exit. *Exit:* drive completed; the player flies out
(the first, ever) — or dies, and the century passes (§10).

### Act 5 — What You Brought Back (return; forks; the deep)

*Feel:* changed world, changed pilot, the itch. *Systems:* tell/don't-tell
fork, expeditions (repeatable, depth tiers), fortification economy, the
Source, the return run, endgame/codex. *Exit:* the deep, the truth, and —
for the player who fell — the door home.

### Endgame (ongoing)

Expeditions, realm re-entry for salvage, alien trade (loud path) or quiet
tech (quiet path), codex completion, megaproject delivery (ROADMAP §6).
The rift stays open and stays dangerous: every entry risks everything.

---

## 6. Mission catalogue plan

`EXISTING` = in `mission_catalogue.js` today (copy refresh only, unless noted).
`NEW` = to be written. Types in CAPS exist today; types marked † are new and
need engine work (§12). Gates use existing requirement kinds unless marked †
(new gate kinds: `storyFlags`, `storyCounters`, `driveTier`, `riftState`,
`minCargoCapacity` — the last already planned as ROADMAP 3.4).

### Act 1 — Making Rent

| ID | Status | Type | Issuer / contact | Gate | Purpose / beat | Flags set |
|----|--------|------|------------------|------|----------------|-----------|
| TUTORIAL_DOCK_01 | EXISTING | DOCK_CERT | Station Ops / Dispatcher | — (first job) | Cert flight. Copy refresh: dispatcher voice, kid's drawing mentioned in completion. | `met_dispatcher` |
| FETCH_ORBIT_01 | EXISTING | FETCH_AND_DELIVER (orbit) | Orbital Cargo / Dispatcher | TUTORIAL_DOCK_01 | Trauma kits. Copy: buoy fuzz mentioned as a nuisance (breadcrumb B1). | — |
| FETCH_ORBIT_02 | EXISTING | FETCH_AND_DELIVER (orbit) | Station Ops / Dispatcher | FETCH_ORBIT_01 | Fuse bank. Copy: the interference "has a pattern" — dispatcher laughs it off (B2). | `heard_pattern` |
| FETCH_LAND_01 | EXISTING | FETCH_AND_DELIVER (land) | Titan Supply / Dispatcher | FETCH_ORBIT_02 | Scrubber couplers. Copy: night-shift banter; endearment. | — |
| FETCH_LAND_02 | EXISTING | FETCH_AND_DELIVER (land) | Station Ops / Dispatcher | FETCH_LAND_01 | Protein blocks. Copy: the kid's favorite food joke; light, warm (B: kid anchor). | `kid_anchor` |
| TRINKET_RUN_01 | NEW | FETCH_AND_DELIVER (land, no timer) | Dispatcher (personal) | FETCH_LAND_02 | Bring home a PUPPY — live cargo from a surface-outpost litter — for the kid. The kid names it Comet. Reward: a drawing (journal entry) + the dog joins the kid's portrait from here on. Pure endearment; the uncanny thread starts here (R15). | `kid_drawing`, `dog_home` |
| MAD_HAULER_01 | NEW | DOCK_ENCOUNTER † | Mad Hauler (Dock 9) | TUTORIAL_DOCK_01 | Dialogue-only. He claims he flew K-14 a century ago. Player dismisses him. (B: crank rumor.) | `met_mad_hauler` |
| RIVAL_RACE_01 | NEW | FETCH_AND_DELIVER (orbit, timed) | Orbital Cargo / Rival | FETCH_ORBIT_02 | Race the rival to a pickup. If slow, rival wins the contract (reduced/no pay + taunt). Soft fail only — no punishment beyond pay. Rival introduced as part of the cargo game. | `met_rival` |

### Act 2 — The Map Fights Back

| ID | Status | Type | Issuer / contact | Gate | Purpose / beat | Flags set |
|----|--------|------|------------------|------|----------------|-----------|
| SCAN_PLANET_01 | EXISTING | ORBIT_PLANET | Orbital Cargo / Dispatcher | FETCH_LAND_02 | First unknown scan. Copy: dispatcher déjà vu beat (B3). | — |
| SCAN_PLANET_02 | EXISTING | ORBIT_PLANET | Orbital Cargo / Scientist | minSurveyedWorlds 3 | Second scan. Scientist introduced via completion line. | `met_scientist` |
| LAND_ON_PLANET_01 | EXISTING | LAND_ON_PLANET (Pad 1) | GSO / Scientist | minSurveyedWorlds 3 | Survey gear drop. Copy: insurance language (write-off seed, B4). | — |
| PICK_UP_CARGO_01 | EXISTING | PICK_UP_CARGO | GSO / Scientist | minSurveyedWorlds 4 + types | Core sample. Copy: first fragment recovered (B5) — "same alloy as— never mind." | `fragment_1` |
| SCAN_PLANET_03 | EXISTING | ORBIT_PLANET | Orbital Cargo / Dispatcher | SCAN_PLANET_02 + surveyed 5 | Rim scan. Copy: the pattern again, stronger rimward. | — |
| ERA2_ICE_COOLANT_01 | EXISTING | FETCH_AND_DELIVER (orbit, ice) | Station Ops / Scientist | PICK_UP_CARGO_01 + ice surveyed | Ice route. Fragment 2 recovered on the pallet. | `fragment_2` |
| ERA2_WATER_SAMPLE_01 | EXISTING | PICK_UP_CARGO (water, Pad 1) | K-14 Hydro / Scientist | surveyed 5 + water surveyed | Water route. Fragment 3 in the tray. Scientist starts asking off-books questions. | `fragment_3` |
| ERA2_VOLCANIC_LOGGER_01 | EXISTING | LAND_ON_PLANET (volcanic, Pad 2) | GSO / Scientist | surveyed 5 + volcanic surveyed | Volcanic route. Fragment 4 at the vent. "This matches your hull plating." (B6) | `fragment_4` |
| ERA2_CITY_MANIFEST_01 | EXISTING | FETCH_AND_DELIVER (land, city) | Orbital Cargo / Dispatcher | city surveyed + ICE done | City route. Copy: rival seen leaving the same pad — they're collecting too (B7). | `rival_collecting` |
| FRAGMENT_ANALYSIS_01 | NEW | DOCK_ENCOUNTER † | Scientist (GSO lab) | `fragment_1..4` (counter †) | Analyze the four fragments. The pattern resolves: same alloy, same marking, same signal. Scientist becomes an ally. | `pattern_known` |
| RIVAL_RACE_02 | NEW | FETCH_AND_DELIVER (land, timed) | Orbital Cargo / Rival | FRAGMENT_ANALYSIS_01 | The rim run. Rival is racing the same work and knows too much. Rival-win = pay cut + story beat only. | — |
| LIEN_CHOICE_01 | NEW | DECISION † | Collector (Aegis) | lien ≤ 50% paid † | FORK F1 (§8): clear the lien (freedom, slower growth) vs. bigger advance (hauler now, deeper leash). | `lien_cleared` OR `lien_deepened` |
| TRIANGULATION_01 | NEW | STORY_EVENT † | Scientist + Dispatcher | `pattern_known` | Four points, one door. Coordinates resolve. The black hole SPAWNS (R6). The dispatcher goes quiet. | `rift_spawned`, `rift_known` |

### Act 3 — The Door

| ID | Status | Type | Issuer / contact | Gate | Purpose / beat | Flags set |
|----|--------|------|------------------|------|----------------|-----------|
| DRIVE_RESEARCH_01 | NEW | DOCK_ENCOUNTER † | Scientist | `rift_known` | The fragments ARE the key: drive schematics from the alloy's properties. | `drive_schematics` |
| DRIVE_PARTS_01 | NEW | FETCH_AND_DELIVER (orbit) | Scientist / Titan | `drive_schematics` | Fetch drive components (linked pair; avoid new multi-leg type — two sequential fetches). | `drive_parts_1` |
| DRIVE_PARTS_02 | NEW | FETCH_AND_DELIVER (land) | Scientist / Titan | `drive_parts_1` | Second component run. Rival interference (pirate pressure beat). | `drive_parts_2` |
| DRIVE_RACE_01 | NEW | STORY_EVENT † + timed flight | Dispatcher / Rival | `drive_parts_2` | The install race. Rival enters first; beacon goes silent. Player RUSHES the install to follow. Rushed install = drive gets you IN, not OUT. | `drive_rushed`, `rival_gone` |
| CROSSING_01 | NEW | RIFT_CROSSING † | Dispatcher | `drive_rushed` | Fly to the coordinates. Warning + confirm modal, point of no return. Cross over. Scene/audio shift. | `crossed_once` |

### Act 4 — The Realm

All NEW. Realm scene variant + wreck docking/scavenge (§9, §12). No timers
except consumables pressure (the realm's clock is salvage).

| ID | Type | Gate | Purpose / beat | Flags set |
|----|------|------|----------------|-----------|
| REALM_DERELICT_01 | REALM_DOCK † | `crossed_once` | Dock the derelict. Play the black box. **THE REVEAL: it's you.** Hull registry matches. Log in the player's voice. | `reveal_seen` |
| REALM_RIVAL_01 | REALM_DOCK † | `reveal_seen` | The rival's wreck. Skeletons. Logs: the rules (no eject, no tow, no rescue) + the stakes (decades-old timestamps). Recover the rival's half-built drive component. | `rules_known`, `component_rival` |
| REALM_GUARDED_01 | REALM_DOCK † | `rules_known` | A custodian-guarded wreck. Take the third component — and learn what the custodians guard, and what happens when you take it. | `component_guarded` |
| REALM_SCAVENGE_R | REALM_DOCK † (repeatable) | `crossed_once` | Salvage loop: dock wrecks (player write-offs + seeded centuries) for fuel/O2/parts. The realm's economy. | — |
| REALM_ESCAPE_01 | STORY_EVENT † | all 3 components | Complete the drive. Exit choice: GO HOME (first return — the win) or GO DEEPER (locked until drive tier 2 + first return; see §8 F3). | `flew_out` OR `rift_death` (§10) |

### Act 5 — What You Brought Back

| ID | Status | Type | Gate | Purpose / beat |
|----|--------|------|------|----------------|
| RETURN_01 | NEW | STORY_EVENT † | `flew_out` | "Twenty minutes." Dispatcher reunion. Kid beat. World changed, pilot changed. Leads to the tell fork. |
| TELL_CHOICE_01 | NEW | DECISION † | RETURN_01 | FORK F4 (§8): TELL NO ONE (monopoly, quiet tech, strained secret) vs. TELL EVERYONE (commerce, rivalry, war thread). |
| TELL_QUIET_01..03 | NEW | Mixed (sketched) | `tell_quiet` | Quiet pack: solo expeditions, alien modules installed quietly, the dispatcher's gentle questions. |
| TELL_LOUD_01..03 | NEW | Mixed (sketched) | `tell_loud` | Loud pack: salvage rights, science escorts, claim jumpers, faction war over the entrance. Rivals' failures populate the realm. |
| EXPEDITION_R | NEW | RIFT_CROSSING † (repeatable) | `flew_out` + drive tier † | Repeatable expeditions, depth tiers (§9). Every entry risks everything. Fortification is the progression. |
| DEEP_SOURCE_01 | NEW | REALM_DOCK † | max drive tier † + depth 3 | The Source. The final reveal (what the rift is, who built it). Unlocks the return run for mourners. |
| RETURN_RUN_01 | NEW | REALM_DOCK † + RIFT_CROSSING † | DEEP_SOURCE_01 + old bookmark + max fortification | The door home. Hardest expedition in the game. Return to the original moment. ENDING CUTSCENE: reunion, the kid's confusion, the dog enters — a different breed (R15). The story ends on that image; free play continues after. |
| CODEX / MEGAPROJECT | Roadmap §6 | — | Completionist endgame (existing plan; codex + megaproject delivery). |

**Count:** 8 (Act 1) + 13 (Act 2) + 5 (Act 3) + 5 (Act 4) + 8+ (Act 5, incl.
fork packs & repeatables) ≈ 35 missions. Existing 14 are all retained, with
copy refreshes. Fork packs and the war thread are sketched, not fully
specified — they are specified when their slice is built (§13).

---

## 7. Breadcrumb map

| # | Breadcrumb | Planted | Innocent read | Post-reveal read |
|---|------------|---------|---------------|------------------|
| B1 | Buoy fuzz | FETCH_ORBIT_01 briefing | Nuisance static | The loop counter, already running |
| B2 | "It has a pattern" | FETCH_ORBIT_02 completion | Dispatcher joke | She has heard it before — every loop |
| B3 | Dispatcher déjà vu | SCAN_PLANET_01 + messages | Warmth, familiarity | Recognition |
| B4 | Insurance / write-off language | LAND_ON_PLANET_01, Titan copy | Bureaucracy | The mechanism that feeds the realm (R8) |
| B5 | First alloy fragment | PICK_UP_CARGO_01 | A weird sample | The key, from the start |
| B6 | "Matches your hull plating" | ERA2_VOLCANIC_LOGGER_01 | Throwaway lab note | The fragments ARE the Drifter |
| B7 | Rival collecting too | ERA2_CITY_MANIFEST_01 | Competition | The rival knows — and is racing the same door |
| B8 | "Repo salvage, but she flies" | Intro briefing | Color | Repossessed from WHOM? (From you. From the last attempt.) |
| B9 | "Recoveries on file: N" | Aegis admin line | Insurance paperwork | A count of the branches you pruned |
| B10 | Mad hauler's claim | MAD_HAULER_01 | A crank | A returner, telling the truth |
| B11 | Dispatcher goes quiet | TRIANGULATION_01 | She knows the coordinates cost people | She has lost people to the door |
| B12 | The kid's drawing + the dog | TRINKET_RUN_01 / cockpit / every home portrait | Sweet | What a century takes — and the tell, at the end |
| B15 | The dog's breed | Every home portrait, all game | A constant; never remarked on | The swap is the final image (R15) |
| B13 | Temporal glimpses | Realm mid-depth zones | "Did I imagine that?" | The rift holding your moments (R11) |
| B14 | NAV credits: "Charted by you, 100 years ago" | Post-century NAV | — | You are your own historical figure |

---

## 8. Forks

### F1 — The lien (Act 2, LIEN_CHOICE_01)

Clear it (freedom, slower growth, collector respects you) vs. bigger advance
(a hauler now, deeper leash, collector owns more of you). Effects: resources
for Act 3–4, collector dialogue, and the Act 5 debt state. Never blocks the
story either way.

### F2 — The fragments (Act 2, implicit in FRAGMENT_ANALYSIS_01)

Sell the fragment data to GSO for a pile of credits (they sit on it; the
player reaches the door late, through the rival's trail) vs. keep it (stay
poor, arrive first, scientist as ally). Delays, never blocks. Implement as a
DECISION inside FRAGMENT_ANALYSIS_01; the "sold" path adds one rival-trail
mission beat before TRIANGULATION_01.

### F3 — Go home or go deeper (Act 4 exit, then standing)

First exit: GO HOME is the win (the first return). GO DEEPER unlocks after the
first return + drive tier 2, and becomes the standing risk loop of the
endgame: each expedition, push deeper or bank salvage and go home. Depth is
literal (§9). The fork is a gameplay loop, not a story branch.

### F4 — Tell or don't tell (Act 5, TELL_CHOICE_01)

- **Tell no one (quiet):** monopoly on fragments + refined drive tech. Solo
  expeditions, quiet alien modules, the secret straining the dispatcher's
  trust. Lonely, rich, haunted.
- **Tell everyone (loud):** rift commerce opens — salvage rights, science
  escorts, claim jumpers. Rivals pour in; their failures populate the realm.
  Factions fight over the entrance; the war thread becomes the endgame
  crisis, and the player is the only one who understands the door.
- One flag, two mission packs, dialogue variants. Both paths converge on the
  deep and the Source.

### Consequence branch — the century (not a choice)

Die in the realm → era shift (§10). Permanent per run; can happen more than
once (era N+1, N+2...). The game continues. The people don't. This is a
consequence, never a choice the player is offered.

---

## 9. The realm

**Zones / depth tiers** (drive tier gates depth; drive knowledge comes from
the rift itself — exploration IS the upgrade path):

| Depth | Name | Contents | Gate |
|-------|------|----------|------|
| 0 | The Shallows | Wrecks (player write-offs + seeded centuries), salvage, the derelict, the rival's wreck. Custodians distant. | Crossing |
| 1 | The Middle | Alien structures, temporal glimpses (B13), guarded wrecks, first custodian encounters. | Drive tier 2 |
| 2 | The Deep | Alien worlds, the Source's approaches, heavy hazards, the final reveal's approaches. | Drive tier 3 |
| 3 | The Source | The mechanism. The truth. The return run's door. | Max fortification |

**Scavenge loop:** dock a wreck → strip fuel / O2 / electricity / parts.
No Titan, no tow. Consumables are the clock. Seeded wrecks guarantee a floor
for careful players; the player's own write-offs are the emotional payload.

**Custodians:** indifferent patrols. Taking a guarded component, or entering
a guarded zone, provokes a response (escalation TBD with weapons/shields
work — §12). Never random aggression: the realm is fair.

**Glimpses:** text/audio overlays at trigger points in mid-depth zones —
the player's own ship crossing in, the dispatcher's voice on a dead channel,
the kid's message on a frequency that doesn't exist. Ambiguous first,
undeniable later. Never a promise, always evidence.

**The exit:** complete the drive (3 components: own derelict, rival's
half-built drive, guarded wreck) → fly out through the rift → return to the
departure moment. The rushed install is WHY the drive needs completing:
it got the player in, not out.

**The Source:** the alien mechanism the custodians maintain. Re-tunes an exit
to any held bookmark (R13). For explorers: the truth. For mourners: the door
home. The return run (RETURN_RUN_01) is the hardest expedition in the game.

---

## 10. Era shift spec (rift death)

**Trigger:** pilot death/stranding in the realm (ship destroyed or
unrecoverable with no salvage path; backup drive unused or absent).

**What changes:**

| System | Effect |
|--------|--------|
| People | Everyone the player knew is gone (a century). New cast, new faces, new names. The kid and the dog are gone. One missable archive beat: the kid's old message/drawing (mentions the dog). |
| Styles | Era skin advances (see scope bound below): portraits, names, station palette, ship-roster styling. Mechanics unchanged. |
| Accounts | Frozen accounts THAW on biometric match. Bounded band: re-entry money (a decent hull or two + operating capital), NOT rift-ready money. The player must re-earn rift-readiness. Fiction: interest minus fees, bank failures, redenomination. Exact band TUNABLE against 3.3 pricing. |
| Debt | Old lien void (died with the old world). No new starter deal — the player is self-funded. Fresh New Games ALWAYS start in debt; era shifts are wealthy and debt-free. Two post-rift economies by design. |
| Ships | GONE — drifted to the rift like all write-offs, no exceptions. Findable/salvageable in the realm on later expeditions (reclaim quest moves INTO the realm). |
| Unlocks / survey data | PERSIST. NAV credits the player's survey data to a charter from a century ago — the player's own name as a historical figure (B14). |
| Rift state | The rift is still there. The player's previous attempt's wreck is now in the realm. The deep-return bait (§9, R14) becomes the rescue arc. |

**Era skin scope bound:** 3 skins in v1 (Era 0 original, Era +1 century,
Era +2 centuries). Era N>2 reuses the furthest skin with new names. Each
skin: cast portraits, names, station palette, ship-roster styling. The
`era` counter persists in the save; `loopsCompleted` tracks run-level loops
for the restart-is-canon line (§2.6).

---

## 11. Survival ladder & numbers

Existing costs verified against ECONOMY.md; new costs are PROPOSED and
tunable (final numbers set against the 3.3 repricing from SHIPS.md).

| Failure | Cost (now / proposed) | Fiction | What it teaches |
|---------|----------------------|---------|-----------------|
| Lander crash | ¢750 + contract voided (EXISTING) | Pilot ejects; drop ship written off → realm | Losing things, not life |
| Out of fuel | ¢1,000 tow (EXISTING) | Tow hauls pilot + hull home | Fuel is life; the tow is the panic button |
| Hull damage | Repair at Apex (3.1, TBD) | Damage costs real money; flying damaged risks catastrophe | The health ladder has teeth |
| Ship destroyed (new, with 3.1) | Hull lost; pilot ejects; replacement at full price | Write-off → realm; pilot survives (R7) | Destruction is survivable — outside the rift |
| StarHopper bailout (new) | One-time rescue; brutal new lien | The safety net that tightens | Debt deepens the hole |
| Realm stranding/death | CENTURY (§10) | No eject, no tow, no rescue | The only death that matters |
| Backup rift drive (new) | Expensive, single-use | Emergency extraction if the primary fails — one saved death per expedition | Fortification is real |

**Balance guardrails:** ruin needs 2–3 bad decisions; every lethal risk is
telegraphed (rival's logs, drive condition, dispatcher warnings); the realm
is tuned so a prepared player wins the first crossing; the thaw band buys
re-entry, never a free re-run.

---

## 12. Systems to build

| System | What | Depends on |
|--------|------|------------|
| Story flags/counters | `storyFlags` + counters in save; new gate kinds (`storyFlags`, `storyCounters`, `driveTier`, `riftState`); flag-setting on mission completion | Mission manager gate extension |
| Write-off log | Silent `writeOffLog` in save: every crash/tow/destruction/void appends an entry (type, ship, cargo, timestamp). Feeds realm population. Invisible pre-reveal except the "Recoveries on file" admin line (B9). | Save schema; crash/tow hooks |
| Contacts UI v1 | Message/holo-call panel: portrait + name + typewriter text + expression swap + holo flicker. Dispatcher messages on mission accept/complete; kid messages (portrait + text, dog in frame); mad-hauler dialogue. | Portraits; notification manager patterns |
| Portraits + voice | §4 asset plan. Voice stingers: dispatcher greeting, accept/complete lines, black-box playback, static voice. Text-first everywhere else. | Asset catalogue additions |
| Rift gating/spawn | `rift_spawned` flag; black-hole entity spawns at triangulated coordinates; NAV marker; crossing confirm modal; scene/audio transition. | Triangulation mission; space scene |
| Realm scene variant | Space-scene variant: realm palette, drone audio, wreck entities (from write-off log + seeded list), custodian patrols, depth zones, glimpses triggers. Re-enterable post-story for salvage. | Space scene; write-off log; alien-ship assets (Phase 5.1) |
| Wreck docking / scavenge | Dock-with-wreck interaction + salvage UI (take fuel/O2/parts). SHARED with ship-boarding (§13, weapons/piracy slice) — build once, use twice. | Realm scene; consumables manager |
| Rift drive | Assembly chain (research + parts + install), drive tiers (knowledge from the rift), backup drive item (emergency extraction), rushed-install state. | Mission chain; inventory/flags |
| Era shift | `era` counter; cast/skin swap; account thaw (bounded band); debt void; NAV credit lines; archive beat; realm population update (player's wreck added). | Save schema; contacts; portraits per era |
| Weapons / shields / boarding | Combat-lite: shields absorb, weapons disable, dock-with-ship to strip cargo. Pirate encounters + rival outfit pressure. Heat/reputation consequences (backlog thread). | Apex/R&D modules (3.5); wreck-docking UI |
| Journal / codex | Discovery journal (1.6/6.1 merged): worlds, fragments, breadcrumbs, drawings, logs, the write-off ledger. The story record, not just a checklist. | Story flags; discovery state |

---

## 13. Implementation slices (in order)

Each slice is playable and playtested before the next. All work on testing
branches; `main` untouched; merges only on Charles's word.

| Slice | Contents | Files (primary) | Playtest win |
|-------|----------|-----------------|--------------|
| **A — Act 1 story pass** | Copy refresh for 5 existing Act 1 missions (dispatcher voice, breadcrumbs B1/B2/B8, kid anchor, eject/rescue fiction in crash/tow copy); `storyFlags` + gate extension; write-off log (silent); contacts UI v1 (dispatcher messages); TRINKET_RUN_01, MAD_HAULER_01, RIVAL_RACE_01; intro touch (kid + repo-salvage lines) | `mission_catalogue.js`, `mission_manager.js`, `intro_screen.js`, `lander_scene.js` (crash copy), `rescue_manager.js` (tow copy), new `contacts_ui.js`, `player_data_manager.js` (flags/log) | New player meets the dispatcher, the kid, the crank, and the rival — and the game still feels like a cargo game |
| **B — Act 2 story pass** | Copy refresh for 9 existing Act 2 missions (fragment threading B5–B7); FRAGMENT_ANALYSIS_01, RIVAL_RACE_02, LIEN_CHOICE_01, TRIANGULATION_01; scientist + collector contacts; fragment counter; rift spawn (gated, un-enterable until Act 3) | `mission_catalogue.js`, `mission_manager.js`, new rift spawn code | The pattern resolves; the door appears; the dispatcher goes quiet |
| **C — Act 3: the drive + the door** | Drive chain (research/parts/race/crossing); rift gating + crossing confirm + transition; rival-gone beat | Missions + rift code + space scene | The race, the rushed install, the crossing |
| **D — Act 4: the realm** | Realm scene variant, wreck docking/scavenge, custodians, derelict + black box, rival wreck + logs, guarded wreck, drive completion, exit; era-shift v1 (death → century) | Realm scene, scavenge UI, era-shift code | The reveal lands; the escape works; death costs the century |
| **E — Act 5: return + forks** | Return beat, tell fork + packs, expeditions + depth tiers, fortification economy, Source, return run, uncanny seasoning, epilogue | Missions + realm depth + era/tell flags | Two endgames, the deep, the door home |
| **F — Weapons / shields / boarding** | Combat-lite, pirate encounters, heat/reputation, boarding via shared docking UI | Apex/R&D modules, space scene encounters | Piracy works; the kit serves realm + normal space |
| **G — Era skins + polish** | Era skin set (3), Gen-2 portraits, journal/codex, voice stingers pass, balance pass vs. 3.3 pricing | Assets, contacts, codex | The century is visible; the game is complete |

**Names DECIDED Nov 16** (§4): Mara Voss, Pip (8), Comet, Kess Alden,
Dr. Ilya Sorren, Mr. Harlan, Old Tam. Renaming stays trivial — role labels
in code.

---

## 14. Open questions & TBDs

1. **Names — DECIDED Nov 16** (see §4). The Survivor stays unnamed until Act 5.
2. **Numbers vs. 3.3 pricing.** Thaw band, drive/backup costs, repair costs,
   and expedition economics are all tunable and must be set AFTER the SHIPS.md
   tier stats land (3.3). This doc states shapes and guardrails, not finals.
3. **Ending-cutscene portraits.** Breed B concept (sleek black whippet)
   generated Nov 16; reunion + dog B's entrance images finalized at Slice E.
4. **War-thread scope (loud path).** How far the faction war goes (mission
   pack vs. full endgame crisis) — specified at Slice E.
5. **Custodian response design.** What provocation costs, and how
   weapons/shields interact with custodians — specified with Slice F.
6. **Drive-tier count.** 3 tiers proposed (§9); confirm against realm depth
   content when Slice D is built.
7. **Rival-win outcomes.** Race missions: rival-win = pay cut + story beat
   only (no hard fail). Confirm no harder consequence is wanted.

---

## Appendix — Gate kinds

**Existing:** `completedMissions`, `minSurveyedWorlds`, `surveyedPlanetTypes`
(see `mission_manager.js`).

**New (this design):** `storyFlags` (has flag), `storyCounters` (fragment
count, recoveries count), `driveTier` (min drive tier), `riftState`
(`unspawned` / `spawned` / `crossed` / `returned` / `era_N`),
`minCargoCapacity` (ROADMAP 3.4 — already planned), `lienState` (lien
fraction paid, for LIEN_CHOICE_01).

**New mission types:** `DOCK_ENCOUNTER` (dialogue-only), `DECISION` (choice
modal with effects), `STORY_EVENT` (flag/world change, may include flight),
`RIFT_CROSSING` (fly-to + confirm + transition), `REALM_DOCK` (dock a wreck
in the realm scene; shares UI with boarding).
