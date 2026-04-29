## Pre-Phase 1: Recentering the Simulation from Malacca to Hormuz

### Why this must happen first

The existing simulation renders the Strait of Malacca (map center [2.5, 101.5]). The game scenario is the Strait of Hormuz. D01's sim consequence reads "Ships in Hormuz lane halt" — that effect is incoherent if ships are visually transiting Malacca. Before any game module ships, the geography must match the narrative.

This is a data swap, not a logic change. No simulation engine, financial model, hand-tracking, or analytics code changes. Only coordinates, labels, and port definitions.

### Variable name decision

`routeLayerNW` / `routeLayerSE` are defined in `map-setup.js` and referenced in `simulation.js:268-269` (route toggle button). These variable names are kept as-is — they now represent Hormuz inbound/outbound lanes internally. Renaming them would require touching `simulation.js` for zero user-visible benefit.

---

### File 1: `js/map-setup.js`

**Map center and zoom**
```js
// Before
const map = L.map('map', { center: [2.5, 101.5], zoom: 7, ... });

// After
const map = L.map('map', { center: [26.0, 57.0], zoom: 7, ... });
```

**TSS lane overlays** (variable names unchanged, coordinates replaced)
```js
// Inbound lane — Gulf of Oman → Persian Gulf (south/Oman channel)
const tssNW = [
  [22.8,60.2],[23.8,59.1],[24.6,58.1],[25.1,57.4],[25.5,57.0],
  [25.8,56.6],[26.1,56.3],[26.3,55.9],[26.4,55.4],[26.4,54.9],[26.2,54.4]
];

// Outbound lane — Persian Gulf → Gulf of Oman (north/Iran channel)
const tssSE = [
  [26.2,54.4],[26.5,54.9],[26.8,55.4],[27.0,55.9],[27.0,56.3],
  [26.8,56.7],[26.4,57.1],[25.8,57.7],[24.8,58.4],[23.8,59.3],[22.8,60.2]
];
```

**Ports** (replace all 8 Malacca ports)

| # | Name | lat | lng | Role |
|---|------|-----|-----|------|
| 1 | Jebel Ali | 25.01 | 55.06 | UAE — largest Gulf container hub |
| 2 | Bandar Abbas | 27.17 | 56.27 | Iran — sits directly on the strait |
| 3 | Abu Dhabi | 24.48 | 54.35 | UAE — oil exports, Khalifa Port |
| 4 | Khor Fakkan | 25.12 | 56.36 | UAE east coast — outside strait, transit |
| 5 | Muscat | 23.61 | 58.59 | Oman — Gulf of Oman entry |
| 6 | Ras Al Khaimah | 25.80 | 55.94 | UAE north coast |
| 7 | Sohar | 24.37 | 56.65 | Oman — industrial port, east of strait |
| 8 | Qeshm | 26.75 | 55.92 | Iran island — loading anchorage near strait |

Commodity mixes should reflect Gulf trade: crude oil and LNG dominate (Hormuz handles ~20% of world oil and ~25% of LNG trade). Replace Palm Oil entries with LNG Condensate. Keep all other cargo types — container, bulk, general cargo are globally generic.

---

### File 2: `js/config-data.js`

**Routes** (replace `generateRoutes()` entirely)
```js
function generateRoutes() {
  // Inbound: Gulf of Oman → Persian Gulf (south/Oman channel)
  const inboundBase = [
    [22.8,60.2],[23.8,59.1],[24.6,58.1],[25.1,57.4],[25.5,57.0],
    [25.8,56.6],[26.1,56.3],[26.3,55.9],[26.4,55.4],[26.4,54.9],[26.2,54.4]
  ];
  // Outbound: Persian Gulf → Gulf of Oman (north/Iran channel)
  const outboundBase = [
    [26.2,54.4],[26.5,54.9],[26.8,55.4],[27.0,55.9],[27.0,56.3],
    [26.8,56.7],[26.4,57.1],[25.8,57.7],[24.8,58.4],[23.8,59.3],[22.8,60.2]
  ];
  const routes = [];
  for (let i = 0; i < 6; i++) {
    routes.push(jitterRoute(inboundBase, 0.04));
    routes.push(jitterRoute(outboundBase, 0.04));
  }
  return routes;
}
```

**Waypoint names** (replace array)
```js
const WAYPOINT_NAMES = [
  'Gulf of Oman Approach', 'Musandam Peninsula', 'TSS South Lane',
  'Hormuz Narrows', 'TSS North Lane', 'Qeshm Channel',
  'Hormuz Island', 'Persian Gulf Entry', 'Khor Fakkan Anchorage',
  'Bandar Abbas Approach', 'Jebel Ali Approach', 'Abu Dhabi Approach',
  'Muscat Fairway Buoy'
];
```

**Origins and destinations** (replace arrays — display labels only, no routing impact)
```js
const ORIGINS = [
  'Singapore', 'Shanghai', 'Mumbai', 'Karachi', 'Colombo',
  'Rotterdam', 'Houston', 'Busan', 'Tokyo', 'Jeddah',
  'Suez Canal', 'Cape Town', 'Mombasa', 'Chennai', 'Ningbo'
];

const DESTINATIONS = [
  'Jebel Ali', 'Abu Dhabi', 'Bandar Abbas', 'Kuwait City', 'Basra',
  'Ras Tanura', 'Doha', 'Muscat', 'Khor Fakkan', 'Rotterdam',
  'Singapore', 'Shanghai', 'Mumbai', 'Houston', 'Busan'
];
```

---

### File 3: `js/filters.js`

Three string renames (no logic change):

| Before | After |
|--------|-------|
| `'malacca_vessels.json'` | `'hormuz_vessels.json'` |
| `'malacca_vessels.csv'` | `'hormuz_vessels.csv'` |
| `'malacca_sim_state'` | `'hormuz_sim_state'` |

Note: renaming the localStorage key invalidates any previously saved simulation state. That is intentional — Malacca vessel positions would be invalid Hormuz coordinates.

---

### File 4: `js/panel-db.js`

One string rename:

| Before | After |
|--------|-------|
| `'malacca_trade_db.json'` | `'hormuz_trade_db.json'` |

---

### File 5: `index.html`

Change the strait label:
```html
<!-- Before -->
<h2>MALACCA STRAIT</h2>

<!-- After -->
<h2>STRAIT OF HORMUZ</h2>
```

---

### What does NOT change

- Simulation engine (`simulation.js`) — no edits
- Financial model, emissions, IndexedDB stores
- Ship types, speeds, DWT ranges
- Hand tracking, MediaPipe, EasyHands
- Analytics, chart rendering
- All game modules (weapons, marketState, fireWeapon — not yet written)
- `jitterRoute()` function — same algorithm, different input coordinates

---

### Verify gate

After implementing:
- [ ] `http://localhost:8000` loads — map centers on Persian Gulf / Hormuz area
- [ ] Ships animate through the strait (not Malacca)
- [ ] TSS lane overlays visible in correct geographic position
- [ ] 8 port markers visible in correct Gulf locations, clickable
- [ ] Ship panel shows Gulf-appropriate waypoints and port names
- [ ] Route toggle button still works (routeLayerNW/routeLayerSE toggle)
- [ ] No console errors
- [ ] Existing simulation features (speed, trails, analytics) unaffected

This verify gate must pass before any Phase 1 game module work begins.

---

## Problem Statement

The maritime traffic simulator currently runs as a standalone visualization -- ships move through the Strait of Malacca with financial models, emissions tracking, and analytics, but there is no game mechanic that lets participants experience how prediction markets perform what they predict. The capstone thesis ("At what point does the market stop reflecting the game and start determining it?") has no live system to stage it. The audience watches but never becomes the market.

## Solution

Build a two-player asymmetric game layer on top of the existing simulator where one player (Disruptor) deploys geopolitical weapons to close the Strait of Hormuz and one player (Defender) deploys counter-weapons to keep it open. An audience bets on the outcome via mobile devices. The prediction market probability drives the simulation in real time -- ships slow, lanes close, and cargo stops as probability rises. By round three, the audience realizes their collective bets are shaping the number they were predicting. The system turns and shows itself.

Format: two-player, best-of-3 rounds, 10-minute rounds, 20-second tick rate. Venue: Columbia GSAPP Movement Lab with projection and webcam object detection.

## User Stories

1. As a **disruptor player**, I want to lift a physical object in front of the webcam and have it recognized as a specific weapon (e.g., D01 Strait Blockade), so that my geopolitical action immediately shifts the market probability.
2. As a **defender player**, I want to deploy counter-weapons (e.g., R01 Naval Escort) that directly neutralize specific disruptor actions, so that strategic counter-play determines the round outcome.
3. As a **disruptor player**, I want fast weapons (blockade, tanker seizure, drone strike, cyber attack) to apply their probability delta immediately, so that aggressive plays create instant drama.
4. As a **defender player**, I want slow weapons (diplomatic back-channel, SPR release, coalition formation) to build over time, so that patience and early deployment are rewarded.
5. As a **player**, I want to see weapon cooldowns and active effects on the in-sim MKTS panel, so that I know what weapons are available and what is currently in play.
6. As a **player**, I want the round to resolve by reading a single boolean (is hormuz_lane open or closed?), so that the winner is unambiguous.
7. As a **player**, I want roles to swap after each round (loser becomes disruptor), so that both players experience both sides of the asymmetry.
8. As an **audience member**, I want to open a URL on my phone and bet OPEN or CLOSED before weapons are played, so that I participate in the prediction market.
9. As an **audience member**, I want to see the live probability updating on my phone in real time, so that I feel the market moving as weapons fire.
10. As an **audience member**, I want to see a leaderboard after each round showing who bet correctly, so that scoring is transparent and social.
11. As an **audience member**, I want late bets to award fewer points (+5 vs +10), so that information asymmetry (early vs. late bettors) is encoded into the scoring.
12. As a **viewer** watching the wall projection, I want to see the probability number alongside the flow_ratio bar, so that the market signal and its physical consequence (ships stopping) are visible simultaneously.
13. As a **viewer**, I want dashboard color thresholds (RED >65%, AMBER 35-65%, GREEN <35%) on the wall projection, so that the state of the strait is legible at a glance.
14. As a **viewer**, I want to see the audience leaderboard and P&L on the wall projection after each round, so that the collective betting behavior is visible to everyone.
15. As a **player**, I want the ship count in the strait to follow the 7-factor multiplicative formula (N_base * speed_mult * spawn_mult * lane_open * (1 - seized_fraction) * routing_ok * fear_dampener), so that every weapon has a visible physical effect on shipping.
16. As a **player**, I want weapon interactions to override individual deltas when both sides play simultaneously (e.g., D01+R01 nets to a specific value rather than summing independently), so that strategic counter-play has precise, predictable effects.
17. As a **player**, I want a 20-second market tick that applies Brownian drift plus decay/build mechanics, so that the market moves autonomously between weapon plays and creates tension.
18. As a **game operator**, I want to calibrate N_base by running the simulation for 60 seconds with no weapons and counting equilibrium ship count, so that the formula is grounded in the actual simulation state.
19. As a **game operator**, I want the effect matrix (all 12 weapons, interactions, sim parameters) loaded from a structured config, so that weapon tuning does not require code changes.
20. As a **game operator**, I want to start, pause, and reset rounds from a control interface, so that the game can be run smoothly in a live demo.
21. As a **player**, I want the game to end when one player wins 2 rounds (best-of-3), so that the format is clear and finite.
22. As a **viewer**, I want to see which weapon was just played and its effect on probability, so that the causal chain (gesture to weapon to market to ships) is legible.
23. As an **audience member**, I want my bet to be recorded even if I lose connection briefly, so that participation is robust over venue WiFi.
24. As a **developer**, I want the marketState object to be the single source of truth that both simulation and market UI read from, so that there is no state divergence between what the market says and what the ships do.
25. As a **developer**, I want the existing 9-layer JS architecture preserved, with game modules inserted at appropriate layers, so that the codebase remains maintainable.

## Implementation Decisions

### Module Architecture

**Module 1: Game State (marketState)**
- Central state object holding: contracts array (prob, delta, cooldown per contract), activeContract index, round number, player roles, scores, roundTimer, phase (idle/playing/roundEnd/over), openingProb snapshot, actionLog array
- Single source of truth -- all other modules read from this, only designated writers mutate it
- Writers: player actions, object detection callbacks, marketTick(), round controller
- Readers: updateSim(), MKTS panel, market_screen.html, scoreRound()

**Module 2: Weapons Engine**
- Loads weapon definitions from a structured config derived from effect_matrix_v4.xlsx
- 12 weapons total: 6 disruptor (D01-D06), 6 defender (R01-R06)
- Two weapon types: fast (immediate delta, natural decay over time) and slow (onset delay before activation, then continuous build)
- Each weapon has: id, type, prob_delta, onset_ticks, decay_rate, build_rate, sim_trigger_key, countered_by list
- Weapon interaction table: when specific pairs are simultaneously active, a net_delta override replaces independent calculation
- weaponLookup(weapon_id) returns full weapon config; fireWeapon(weapon_id) applies delta to marketState

**Module 3: Market Tick Loop**
- Runs every 20 seconds (30 ticks per 10-minute round)
- Each tick: apply Brownian drift (small random walk), process decay on active fast weapons, process build on active slow weapons, check interaction overrides, decrement round timer, clamp probability to [0, 100]
- Two timescales: fast writes (player actions, immediate) and slow writes (tick-driven, autonomous)

**Module 4: Round Controller**
- startRound(): reset probability to 50%, clear active weapons, start timer, set phase to "playing"
- endRound(): read simulationState.hormuz_lane, determine winner, update scores, set phase to "roundEnd"
- swapRoles(): loser of previous round becomes disruptor
- scoreRound(): award audience points (10 for correct, 5 for late correct, 0 for wrong)
- Best-of-3: first to 2 round wins takes the game

**Module 5: Simulation Integration**
- Modify the existing simulation update loop to read `simMultipliers` from marketState
- Each weapon writes its own sim_trigger_keys directly into simMultipliers when fired. The keys are weapon-specific and come from weapons_config.json (parsed from effect_matrix_v4.xlsx). No field exists in simMultipliers until a weapon writes it.
- Probability is the market's number. simMultipliers are the simulation's physics. Both are written independently by the weapon config. Never derive one from the other.
- flow_ratio = N_current / N_base (1.0 = normal, 0.0 = strait closed)
- Probability and ship count are two views of the same event -- they converge as prob > 65%

**Simulation key activation by phase:**
- Phase 1 (D01 only): `speed_mult`, `spawn_rate_mult`, `hormuz_lane`
- Phase 3 (all 12 weapons): activates all remaining keys from xlsx:
  - D02: `speed_mult` (override to 0.6), `cargo_value_mult`, `sanctions_active`
  - D03: `remove_vessel_class`, `economic_output_mult`
  - D04: `port_node`, `spawn_blocked`
  - D05: `global_movement_mult`, `insurance_active`, `fear_signal`
  - D06: `routing_broken`, `destination_reach`
  - R01: `hormuz_lane` (open), `escort_active`, `speed_mult` (reset to 1.0)
  - R02: `restore_vessel_class`, `reflag_active`
  - R03: `cape_route`, `reroute_mult`, `alt_port`
  - R04: `sanctions_build_frozen`, `insurance_build_frozen`
  - R05: `oil_price_decoupled`, `fear_signal` (false), `spr_active`
  - R06: `disruptor_decay_mult`, `coalition_active`, `defender_amplify`
- Each key requires a corresponding reader in simulation.js that translates the key into visible ship behavior

**Module 6: Audience Server**
- Node.js + Express serving static files + WebSocket for real-time state broadcast
- REST endpoint: POST /bet with payload {playerId, prediction, timestamp}
- WebSocket: broadcasts marketState snapshot to all connected clients on every tick and on every weapon fire
- Holds shared audience state: bets array, leaderboard, round results
- Designed for venue WiFi (30-50 concurrent connections)

**Module 7: Audience Client**
- Mobile-optimized HTML page served by the audience server
- Shows: current question ("Will the Strait of Hormuz remain open?"), live probability with color-coded threshold, bet buttons (OPEN / CLOSED), leaderboard, round results
- Receives WebSocket updates for real-time probability display
- Submits bets via POST, receives confirmation

**Module 8: Market Screen Enhancement**
- Extend existing market_screen.html wall projection
- Add: flow_ratio progress bar alongside probability, audience leaderboard panel, aggregate P&L display, round/game score
- Color-coded dashboard: RED (>65%), AMBER (35-65%), GREEN (<35%)
- Updates on every tick and weapon event via shared state

**Module 9: MKTS Panel UI**
- In-sim overlay on index.html showing: active contract question, live probability percentage, current player role indicator, active weapon list with cooldown timers, recent action log
- Read-only view of marketState -- never writes back

### Architectural Decisions
- marketState is the single source of truth; the simulation never writes to it, only reads
- The effect matrix is loaded as structured JSON config, not hardcoded
- The existing 9-layer JS architecture is preserved; game modules slot into Layer 1 (config) and a new Layer between 4 and 5
- Object detection (Teachable Machine in detector.html) maps physical objects to weapon IDs and calls fireWeapon()
- The audience server is a separate Node.js process; the main simulator communicates with it via WebSocket or shared state

## Testing Decisions

Tests should verify behavior through public interfaces, not implementation details. A test should survive an internal refactor -- if you rename a function and tests break but behavior has not changed, those tests were testing implementation.

### Modules to Test

**Game State (marketState)**
- Verify state transitions: idle -> playing -> roundEnd -> idle (or playing again)
- Verify that writing a delta updates probability correctly
- Verify probability clamping to [0, 100]
- Verify action log records every mutation

**Weapons Engine**
- Verify each weapon delta is applied correctly (fast: immediate, slow: after onset)
- Verify decay reduces probability over time for fast weapons
- Verify build increases probability over time for slow weapons
- Verify weapon interaction overrides: when D01 and R01 are both active, net_delta is used instead of sum
- Verify all 3 perfect counter pairs (D02->R04, D03->R02, D05->R05) fully neutralize
- Verify cooldown prevents re-firing before expiry

**Market Tick Loop**
- Verify tick fires every 20 seconds and processes all active weapons
- Verify Brownian drift stays within expected bounds
- Verify round timer decrements correctly and triggers endRound at zero
- Verify decay and build rates match effect matrix values

**Round Controller**
- Verify round start resets probability to 50% and clears weapons
- Verify round end reads hormuz_lane correctly (open -> defender wins, closed -> disruptor wins)
- Verify role swap: loser becomes disruptor
- Verify best-of-3: game ends when one player reaches 2 wins
- Verify audience scoring: +10 correct, +5 late correct, +0 wrong

**Simulation Integration**
- Verify ship count formula produces correct N_current given known multiplier values
- Verify flow_ratio = N_current / N_base
- Verify each weapon sim_trigger_key modifies the correct multiplier
- Verify ships visibly slow/stop when probability exceeds threshold

**Audience Server**
- Verify POST /bet records bet and returns confirmation
- Verify WebSocket broadcasts state to all connected clients
- Verify leaderboard calculation after round end
- Verify server handles disconnection and reconnection gracefully

**Audience Client**
- Verify bet submission sends correct payload
- Verify live probability updates via WebSocket
- Verify leaderboard renders correctly after round end
- Verify color thresholds display correctly (RED/AMBER/GREEN)

**Market Screen**
- Verify flow_ratio bar updates in sync with probability
- Verify dashboard color changes at correct thresholds
- Verify audience leaderboard appears after round end

**MKTS Panel**
- Verify panel displays current probability from marketState
- Verify active weapons list shows correct cooldown timers
- Verify action log updates on weapon fire

### Testing Approach
- Integration-style tests exercising real code paths through public APIs
- No mocking of internal collaborators -- test the system as a user would experience it
- Use the vertical slice TDD approach: one test, one implementation, repeat
- Prior art: the codebase currently has no test infrastructure, so a lightweight test runner will be introduced

## Out of Scope

- **Physical hardware setup** -- webcam placement, projector configuration, Movement Lab logistics
- **Teachable Machine model training** -- the object detection model is pre-trained; this PRD covers wiring it to the weapons engine, not retraining it
- **Network infrastructure** -- venue WiFi setup, router configuration for audience connectivity
- **Mobile app** -- audience participates via mobile browser, not a native app
- **Persistent user accounts** -- audience members are session-based, no login required
- **Historical data analytics** -- post-game analysis dashboards are not included
- **Sound design** -- audio cues for weapon fires, round transitions, etc.
- **Internationalization** -- English only
- **Accessibility** -- screen reader support, high-contrast mode

## Further Notes

- **N_base calibration** is critical: run the simulation for 60 seconds with no weapons active, count ships at equilibrium in the Hormuz lane, and update the config before each demo session.
- **The flip moment** (usually round three) is the design climax -- when the audience realizes their collective bet is shaping the probability. The system must make this correlation visible without explaining it.
- **The effect_matrix_v4.xlsx** in Context/docs/ is the canonical source for all weapon parameters, interaction overrides, and sim parameter values. Any tuning should happen there first, then be exported to the JSON config the code consumes.
- **Two timescales** are fundamental: fast writes (player actions, immediate) and slow writes (20-second tick, autonomous). The tension between player agency and systemic drift is what makes the game feel alive.
- The project is rooted in Donald MacKenzie's performativity thesis: the market does not describe reality, it produces it. Every architectural decision should preserve this chain: gesture -> weapon -> market -> ships -> audience perception -> bet -> market.

---

## Pre-Phase 1b: Ship Routing Fix — Geographic Research Report

### Problem

Ships cross landmasses (Musandam Peninsula, Qeshm Island) because route waypoints in `generateRoutes()` pass through land. The original waypoints at `[25.8, 56.6]` and `[26.1, 56.3]` are ON the Musandam Peninsula, and the uniform ±0.04° jitter made this worse.

### Geographic Research Findings

Research into actual Strait of Hormuz geography and IMO Traffic Separation Scheme (TSS) revealed that the original routing model had a fundamental error: both the inbound and outbound lanes must pass **north** of the Musandam Peninsula, not south. The TSS sits in the channel between Musandam and Qeshm/Larak.

**Key geographic coordinates:**

| Feature | Latitude | Longitude | Notes |
|---|---|---|---|
| Ra's Musandam (peninsula tip) | 26.387 N | 56.527 E | Northernmost headland |
| Great Quoin / Jazirat al-Salamah | 26.504 N | 56.512 E | Oman's northernmost land, north of peninsula |
| Little Quoin / Didamar | 26.479 N | 56.538 E | Lighthouse island |
| Qeshm Island (west tip) | ~26.53 N | 55.27 E | Iran's largest island |
| Qeshm Island (east tip) | ~26.95 N | 56.45 E | Eastern extent |
| Larak Island | 26.853 N | 56.356 E | Iranian island, oil export |
| Hormuz Island | 27.065 N | 56.464 E | North of Qeshm, near Bandar Abbas |

**TSS lane positions at the narrows (~56.3°E):**

| Lane | Approx. Latitude | Side |
|---|---|---|
| Inbound (westbound, Oman side) | ~26.50-26.55 N | South lane, just north of Quoin Islands |
| Separation zone | ~26.55-26.60 N | Buffer |
| Outbound (eastbound, Iran side) | ~26.60-26.65 N | North lane |

**Critical insight:** Both TSS lanes are entirely within Omani territorial waters at the narrowest point. The navigable corridor is between Musandam/Quoin (south, ~26.50 N) and Qeshm/Larak (north, ~26.85 N).

### What was implemented (first attempt)

Added `SHIPPING_LANES` const to `config-data.js` with zone-aware jitter (0.04° open water, 0.02° approach, 0.008° strait). Updated `map-setup.js` TSS overlays to reference `SHIPPING_LANES`. Created `tests/pre-phase-01-routing.html` with 11 tests including Musandam/Qeshm exclusion zone checks.

### Status: NEEDS CORRECTION

The first fix routed the inbound lane south of Musandam, which is geographically incorrect -- ships cannot transit south of the peninsula (it's coastline). Both lanes must route **north** of Musandam through the actual TSS corridor at lat ~26.5-26.65. The waypoints in `SHIPPING_LANES` need to be corrected to reflect actual navigation patterns: approach from the southeast (Gulf of Oman), turn northwest through the TSS north of Musandam, then fan out into the Persian Gulf.

**Exclusion zones for validation:**
- Musandam Peninsula: lat 25.9-26.4, lng 56.15-56.55
- Qeshm Island: lat 26.5-26.9, lng 55.5-56.3

---

## Phase 1 Grill Report

Design interrogation conducted before implementation. Every question below was a branch in the decision tree that, if left unresolved, would have required rework later. Each records the question, the options considered, the decision made, and why.

### Q1: Where does marketState live?

**Options:** (a) Inside existing markets.js, (b) Inside config-data.js, (c) New file js/game-state.js at Layer 1.5
**Decision:** Option C -- new file `js/game-state.js` loaded after utils.js and before map-setup.js.
**Rationale:** marketState is mutable game state, fundamentally different from the static MARKETS array and CONFIG object. Mixing them violates single-responsibility. Layer 1.5 ensures it exists before simulation.js reads it.

### Q2: What does marketState contain at Phase 1 scope?

**Options:** (a) Full shape with null/default values for all future fields, (b) Lean -- only fields that have a reader
**Decision:** Option B -- lean. No field exists in marketState until something reads it.
**Rule established:** "No field exists in marketState until something reads it." This prevents dead fields and keeps the object auditable.
**Phase 1 shape:**
```
marketState = {
  prob: 50,
  activeWeapons: [],
  simMultipliers: { speed_mult: 1.0, spawn_rate_mult: 1.0, hormuz_lane: 'open' },
  actionLog: []
}
```

### Q3: How does fireWeapon write to the simulation?

**Options:** (a) Probability drives multipliers (derive simMultipliers from prob), (b) Weapons write both independently
**Decision:** Option B -- fireWeapon writes both `prob += weapon.prob_delta` AND `simMultipliers[key] = value` for each key in weapon.sim_trigger_keys.
**Rationale:** The documentation explicitly maps each weapon to specific sim keys. D01 sets speed_mult=0.05 while D03 sets seized_fraction=0.25 -- these are weapon-specific physical effects, not probability-derived. Probability is the market's number. simMultipliers are the simulation's physics. Never derive one from the other.

### Q4: Do Phase 1 simMultipliers match the PRD's 7-factor formula?

**Options:** (a) Implement full 7-factor formula now with D01 populating 3 of 7, (b) Only implement D01's 3 keys, add others when weapons need them
**Decision:** Option B -- Phase 1 simMultipliers contain only `speed_mult`, `spawn_rate_mult`, `hormuz_lane`. Other keys (seized_fraction, routing_ok, fear_dampener, etc.) are added in Phase 3 when their weapons arrive.
**Consequence:** PRD updated to document the full sim_trigger_key activation schedule by phase, sourced from the actual xlsx data rather than the simplified 7-factor abstraction.

### Q5: How does speed_mult affect ships in updateSim()?

**Options:** (a) Scale progress calculation only (ships' displayed speed unchanged), (b) Scale effective speed for both progress and display
**Decision:** Option B -- `effectiveSpeed = v.speed * speed_mult`. Used for progress delta AND display (Avg Kn stat, ship panel). v.speed itself is never mutated by the game layer.
**Rationale:** The audience needs to see the number drop when D01 fires. If "Avg Kn" shows 14 while ships are frozen on the map, the performativity chain breaks. Legibility is the design requirement.

### Q6: How does spawn_rate_mult gate new vessel spawns?

**Options:** (a) Gate respawns -- arriving ships roll against spawn_rate_mult, fail = removed, (b) Freeze completed vessels at docks, (c) Pause progress at arrival
**Decision:** Option A -- when a vessel completes its route and `spawn_rate_mult < 1.0`, roll `Math.random() > spawn_rate_mult` -- if true, remove the vessel instead of respawning.
**Rationale:** Produces the most dramatic visual -- the fleet physically shrinks. The audience sees ships disappearing. This is a simulation, not a logistics model. Visual impact over fidelity.

### Q7: How does weapons_config.json load in a vanilla JS environment?

**Options:** (a) fetch() at runtime (async), (b) Parse script outputs JS file with const declaration (sync), (c) Inline in game-state.js
**Decision:** Option B -- parse script outputs `js/weapons-config.js` declaring `const WEAPONS_CONFIG = {...}`. Loaded via `<script>` tag at Layer 1, before game-state.js. No fetch, no async, no build system.
**Artifact:** `scripts/parse_effect_matrix.py` reads effect_matrix_v4.xlsx and outputs js/weapons-config.js. Run manually when weapon tuning changes.

### Q8: What happens when D01 decays and is removed from activeWeapons?

**Options:** (a) Recompute all simMultipliers from scratch on every weapon add/remove, (b) Stack-based per-key tracking
**Decision:** Option A -- `recomputeSimMultipliers()` starts from SIM_DEFAULTS, iterates all activeWeapons, applies each weapon's sim_trigger_keys. For conflicting numeric keys: Math.min (most restrictive wins). For flags: defender overrides disruptor.
**Rationale:** Simpler, no bookkeeping. Cheap with max 12 weapons. Naturally handles the D01+D02 conflicting speed_mult case (0.05 vs 0.6 -- min wins = 0.05).

### Q9: What are SIM_DEFAULTS?

**Decision:** Stored in game-state.js alongside marketState:
```
SIM_DEFAULTS = { speed_mult: 1.0, spawn_rate_mult: 1.0, hormuz_lane: 'open' }
```
When no weapons are active, simulation behaves exactly as it does today.

### Q10: Which keyboard key fires D01?

**Decision:** `Digit1`. Consistent with Phase 3 mapping (1-6 = D01-D06). No conflict with existing shortcuts. Handler checks `typeof fireWeapon === 'function'` as a guard.

### Q11: Where in index.html do the new scripts load?

**Decision:** Layer 1.5, between utils.js and map-setup.js:
```html
<!-- Layer 1.5: Game -->
<script src="js/weapons-config.js"></script>
<script src="js/game-state.js"></script>
```

### Q12: What visual feedback confirms D01 fired?

**Options:** (a) Status bar update, (b) Console only, (c) Flash banner
**Decision:** Option A -- add `PROB 72%` and `D01 ACTIVE` to the existing #statusBar line in updateStats(). No new DOM elements. MKTS panel in Phase 6 takes over detailed display; status bar stays as compact summary.

### Q13: What does the test infrastructure look like?

**Options:** (a) Hand-rolled HTML test runner (matches existing pattern), (b) Proper framework (Vitest, etc.)
**Decision:** Option A -- same pattern as tests/pre-phase-01-recentering.html. One HTML file per phase. Load modules under test via script tags, call public functions, assert results. Open in browser to run.

### Q14: Can fireWeapon('D01') be called multiple times?

**Options:** (a) No-op if already active, (b) Refresh decay timer, (c) Stack multiple instances
**Decision:** Option A -- no-op if D01 is already in activeWeapons. Weapon must fully decay before it can fire again. Naturally leads into the cooldown system in Phase 4.

---

## Phase 1 Implementation Plan

### Overview

Phase 1 is the tracer bullet. It proves one path end-to-end: keypress -> weapon lookup -> fire -> probability shifts -> simulation reads multipliers -> ships slow/stop -> status bar confirms. Three new files, two modified files, one test file.

### Step 1: Create js/weapons-config.js

**Action:** Already done. Parse script outputs `const WEAPONS_CONFIG = {...}` with all 12 weapons and 8 interactions from effect_matrix_v4.xlsx.
**Screen change:** None. Data file only.

### Step 2: Create js/game-state.js

**Action:** New file declaring:
- `SIM_DEFAULTS` -- default multiplier values (speed_mult: 1.0, spawn_rate_mult: 1.0, hormuz_lane: 'open')
- `marketState` -- prob: 50, activeWeapons: [], simMultipliers: copy of SIM_DEFAULTS, actionLog: []
- `weaponLookup(id)` -- finds weapon in WEAPONS_CONFIG.weapons by id, returns config object
- `fireWeapon(id)` -- looks up weapon, checks if already active (no-op if so), applies prob_delta to marketState.prob (clamped 0-100), pushes weapon entry to activeWeapons with decay tracking state, calls recomputeSimMultipliers(), logs to actionLog
- `recomputeSimMultipliers()` -- resets simMultipliers to SIM_DEFAULTS, iterates activeWeapons, applies each weapon's sim_trigger_keys (min for numeric, defender-overrides-disruptor for flags)

**Screen change:** None yet. State layer only.

### Step 3: Add script tags to index.html

**Action:** Insert two `<script>` tags at Layer 1.5 (after utils.js, before map-setup.js):
```html
<script src="js/weapons-config.js"></script>
<script src="js/game-state.js"></script>
```

**Screen change:** None. Scripts load silently.

### Step 4: Wire simulation.js to read simMultipliers

**Action:** Modify `updateSim()` in simulation.js:
- Compute `effectiveSpeed = v.speed * (marketState.simMultipliers.speed_mult || 1.0)` and use it for progress delta and display
- On vessel route completion: if `Math.random() > (marketState.simMultipliers.spawn_rate_mult || 1.0)`, remove vessel instead of respawning

**Screen change when D01 is NOT active:** None. speed_mult=1.0, spawn_rate_mult=1.0. Ships behave exactly as before.
**Screen change when D01 IS active:** Ships slow to ~5% speed (near frozen on map). Avg Kn stat drops from ~14 to ~0.7. Arriving ships have 80% chance of being removed -- fleet visibly shrinks over time.

### Step 5: Wire status bar to show game state

**Action:** Modify `updateStats()` in simulation.js to append probability and active weapon info to the status bar:
- If marketState exists: show `PROB XX%` and active weapon names
- The existing `HORMUZ FLOW` percentage naturally drops as ships slow, providing secondary confirmation

**Screen change:** Status bar at bottom changes from:
`SIM TICK 0042 // LAYER I // VESSELS 30 // HORMUZ FLOW 85%`
to:
`SIM TICK 0042 // PROB 50% // VESSELS 30 // HORMUZ FLOW 85%`
After pressing 1:
`SIM TICK 0043 // PROB 72% // D01 ACTIVE // VESSELS 28 // HORMUZ FLOW 4%`

### Step 6: Wire keyboard shortcut in bootstrap.js

**Action:** Add one line to the existing keydown handler:
`if (e.code === 'Digit1' && typeof fireWeapon === 'function') fireWeapon('D01');`

**Screen change:** Pressing `1` on keyboard fires D01. Immediate visible effects:
1. Status bar shows `PROB 72%` and `D01 ACTIVE`
2. Ships begin slowing (effectiveSpeed drops to 5% of normal)
3. Avg Kn stat drops
4. HORMUZ FLOW % drops
5. Over next 30-60 seconds, arriving ships are removed (fleet shrinks)

### Step 7: Create tests/phase-01-game-state.html

**Action:** Test file loading weapons-config.js and game-state.js, testing:
- `fireWeapon('D01')` shifts prob from 50 to 72
- `fireWeapon('D01')` sets simMultipliers.speed_mult to 0.05
- `fireWeapon('D01')` sets simMultipliers.spawn_rate_mult to 0.2
- `fireWeapon('D01')` sets simMultipliers.hormuz_lane to 'closed'
- Probability clamps to [0, 100] (fire D01 5 times equivalent -- but since no-op when active, test with direct prob manipulation)
- `fireWeapon('D01')` when D01 already active is a no-op (prob stays same)
- `recomputeSimMultipliers()` with empty activeWeapons resets to SIM_DEFAULTS
- actionLog records weapon fire with timestamp and delta

**Screen change:** Open tests/phase-01-game-state.html in browser -- see pass/fail results.

### What the user sees after all 7 steps

1. Open index.html in browser -- simulation runs normally, identical to before
2. Press `1` -- status bar flashes `PROB 72% // D01 ACTIVE`
3. Ships visibly slow to a crawl over 1-2 seconds
4. Avg Kn drops from ~14 to ~0.7
5. HORMUZ FLOW drops from ~85% to ~4%
6. Over next 30-60 seconds, fleet count drops as arriving ships are removed
7. That is the tracer bullet: one keypress -> market moves -> ships stop -> the strait goes dark

---

## Implementation Status (as of session break)

### What has been completed

#### Pre-Phase 1a: Recentering (DONE)
All coordinates, labels, ports, and route data have been swapped from Malacca to Hormuz. The simulation renders the Strait of Hormuz. Tests in `tests/pre-phase-01-recentering.html` pass.

#### Pre-Phase 1b: Ship Routing Fix — SHIPPING_LANES (PARTIALLY DONE — NEEDS WAYPOINT CORRECTION)

**What was done:**
- Added `SHIPPING_LANES` const to `js/config-data.js` (lines 110-151) with `inbound`, `outbound`, and `jitter` config
- Replaced old `generateRoutes()`/`jitterRoute()` with new `generateRoutes()`/`jitterLane()` (lines 153-179) using zone-aware jitter (0.04° open water, 0.02° approach, 0.008° strait narrows)
- Updated `js/map-setup.js` (lines 9-13) — `tssNW` and `tssSE` now reference `SHIPPING_LANES.inbound` and `SHIPPING_LANES.outbound` instead of hardcoded arrays
- Created `tests/pre-phase-01-routing.html` with 11 tests including Musandam/Qeshm exclusion zone checks

**What still needs fixing:**
Ships are still crossing land. Geographic research (documented in the "Pre-Phase 1b" section above) revealed the fundamental error: **both inbound and outbound TSS lanes pass NORTH of the Musandam Peninsula**, not south. The current `SHIPPING_LANES.inbound` waypoints route south of Musandam, which is coastline/land.

**Corrected waypoint requirements based on research:**
- Ra's Musandam (peninsula tip): 26.387°N, 56.527°E
- Great Quoin Island (north of peninsula): 26.504°N, 56.512°E
- Both lanes must pass north of lat ~26.50 (north of Quoin Islands) and south of lat ~26.85 (south of Qeshm/Larak)
- Inbound (westbound) lane center at narrows: ~26.50-26.55°N
- Outbound (eastbound) lane center at narrows: ~26.60-26.65°N
- The navigable corridor between Musandam/Quoin (south) and Qeshm/Larak (north) is only ~0.35° latitude wide

**Action needed:** Rewrite `SHIPPING_LANES.inbound` and `SHIPPING_LANES.outbound` waypoints so that ships approach from the Gulf of Oman (southeast), turn northwest through the TSS **north of Musandam**, then fan out into the Persian Gulf. The exclusion zone tests in `tests/pre-phase-01-routing.html` are correctly defined and will validate the fix.

#### Step 1: js/weapons-config.js (DONE)
Already exists at `js/weapons-config.js`. Contains all 12 weapons (D01-D06, R01-R06) and 8 interactions parsed from `effect_matrix_v4.xlsx`. Key D01 values:
- `prob_delta`: 22.0
- `sim_trigger_keys`: `{ speed_mult: 0.05, spawn_rate_mult: 0.2, hormuz_lane: "closed" }`

### What is in progress — Phase 1 TDD

**TDD approach:** Vertical slices (one test → one implementation → repeat), using the same HTML test runner pattern as existing tests.

**Test file created:** `tests/phase-01-game-state.html`
- Currently contains 1 test (Slice 1 RED): `fireWeapon("D01") shifts prob from 50 to 72`
- Loads `js/weapons-config.js` and `js/game-state.js` via script tags
- Has a `resetState()` helper that resets marketState between tests

**8 TDD slices planned (vertical RED→GREEN):**

| # | Test behavior | Status |
|---|---|---|
| 1 | `fireWeapon('D01')` shifts prob from 50 to 72 | RED (test written, no implementation) |
| 2 | `fireWeapon('D01')` sets `simMultipliers.speed_mult` to 0.05 | not started |
| 3 | `fireWeapon('D01')` sets `simMultipliers.spawn_rate_mult` to 0.2 | not started |
| 4 | `fireWeapon('D01')` sets `simMultipliers.hormuz_lane` to `'closed'` | not started |
| 5 | `fireWeapon('D01')` when already active is a no-op | not started |
| 6 | Probability clamps to [0, 100] | not started |
| 7 | `recomputeSimMultipliers()` with empty activeWeapons resets to SIM_DEFAULTS | not started |
| 8 | `actionLog` records weapon fire with timestamp and delta | not started |

**After TDD slices, production wiring needed:**

| Step | File | What to do | Status |
|---|---|---|---|
| 2 | `js/game-state.js` | Create file with `SIM_DEFAULTS`, `marketState`, `weaponLookup()`, `fireWeapon()`, `recomputeSimMultipliers()` | not started |
| 3 | `index.html` | Add `<script>` tags at Layer 1.5 (after `js/utils.js` line 470, before `js/map-setup.js` line 473) | not started |
| 4 | `js/simulation.js` | In `updateSim()`: use `effectiveSpeed = v.speed * (marketState.simMultipliers.speed_mult \|\| 1.0)` for progress delta; on route completion, gate respawn with `spawn_rate_mult` | not started |
| 5 | `js/simulation.js` | In `updateStats()`: replace `// LAYER I //` span with `PROB XX%` and active weapon names from `marketState` | not started |
| 6 | `js/bootstrap.js` | Add `if (e.code === 'Digit1' && typeof fireWeapon === 'function') fireWeapon('D01');` to keydown handler | not started |

### Key architectural context for the next session

**Script load order in index.html (lines 467-500):**
```
Layer 1: js/config-data.js → js/markets.js → js/utils.js
Layer 1.5: [INSERT HERE] js/weapons-config.js → js/game-state.js
Layer 2: js/map-setup.js
Layer 3: js/gfw.js
Layer 4: js/financials.js → js/vessel-creation.js → js/simulation.js
Layer 5: js/database.js
Layer 6: js/panel-ship.js → js/panel-port.js → js/panel-analytics.js → js/panel-db.js
Layer 7: js/drag.js → js/filters.js
Layer 8: js/hand-gesture.js
Layer 9: js/bootstrap.js
```

**Status bar HTML (index.html lines 456-461):**
```html
<div id="statusBar">
  <span id="sbTick">SIM TICK 0000</span>
  <span>// LAYER I //</span>
  <span id="sbVessels">VESSELS 0</span>
  <span id="sbFlow">// HORMUZ FLOW 0%</span>
</div>
```

**Key simulation.js locations:**
- `updateSim()` starts at line 51 — the main simulation loop
- Progress delta calculation: line 65 — `const progressDelta = (v.speed * dtHours) / rLen;`
- Speed random walk: lines 77-78 — `v.speed` is mutated here, game layer should NOT mutate `v.speed`, use `effectiveSpeed` instead
- Respawn logic: lines 84-116 — when `v.progress >= 1`, vessel is respawned. Insert `spawn_rate_mult` gate here
- `updateStats()` starts at line 183 — status bar update logic
- Flow percentage: line 197 — `var flowPct = ...` uses `v.speed` directly, should use effective speed when game layer exists

**Key bootstrap.js locations:**
- Keyboard handler: lines 33-48 — add D01 keybinding here

**marketState design decisions (from Grill Report):**
- `marketState` is the single source of truth; simulation never writes to it, only reads
- `fireWeapon()` writes both `prob += weapon.prob_delta` AND `simMultipliers[key] = value` independently
- `recomputeSimMultipliers()` starts from SIM_DEFAULTS, iterates activeWeapons, applies each weapon's keys (Math.min for numeric conflicts, defender overrides disruptor for flags)
- `fireWeapon('D01')` is a no-op if D01 is already in activeWeapons
- `effectiveSpeed = v.speed * speed_mult` — v.speed is never mutated by the game layer

**Test infrastructure:**
- Pattern: standalone HTML files in `tests/` that load JS via `<script>` tags
- No framework — hand-rolled `test()` and `assert()` functions
- Open in browser to run, results displayed inline
- Existing tests: `tests/pre-phase-01-recentering.html` (8 tests), `tests/pre-phase-01-routing.html` (11 tests), `tests/phase-01-game-state.html` (8 tests, all GREEN)

---

## Post-Phase 1: Game Status Dashboard

### Why this comes next

Phase 1 proves the tracer bullet — keypress → weapon → market → ships — but the feedback lives in a one-line status bar that is illegible at Movement Lab projection scale and gives no causal narrative. Players and audience cannot read "D01 fired → prob +22% → ships halting" from the status bar. This dashboard makes the performativity chain visible in real time.

### What it is

A fixed `<div id="gameDashboard">` panel on the right edge of `index.html`. Four stacked zones, always visible:

```
┌─────────────────────────┐
│  PROBABILITY            │  ← large number, color-coded bar
│  ██████████░░░░  72%    │     RED >65% / AMBER 35–65% / GREEN <35%
├─────────────────────────┤
│  LAST ACTION            │  ← weapon card, replaces on each fire
│  D01 · STRAIT BLOCKADE  │
│  CAUSE  ↑ +22% prob     │
│  EFFECT  speed ×0.05    │
│          spawn ×0.20    │
│          lane → CLOSED  │
├─────────────────────────┤
│  ACTIVE WEAPONS         │  ← live list, one row per weapon
│  D01 ████████░░ [decay] │
├─────────────────────────┤
│  EVENT LOG              │  ← last 3 events, newest on top
│  → D01 +22% · t=0042   │
└─────────────────────────┘
```

### Data sources (read-only from marketState)

| Zone | Source | Update trigger |
|---|---|---|
| Probability bar | `marketState.prob` | every `updateStats()` tick |
| Last action card | `marketState.actionLog` (last entry) | on `fireWeapon()` |
| Active weapons list | `marketState.activeWeapons` | on `fireWeapon()` |
| Event log | `marketState.actionLog` (last 3) | on `fireWeapon()` |

### Color thresholds

| Range | Color | Meaning |
|---|---|---|
| prob > 65% | RED (`#ef4444`) | Strait likely closing — disruptor winning |
| 35% ≤ prob ≤ 65% | AMBER (`#f59e0b`) | Contested — outcome uncertain |
| prob < 35% | GREEN (`#4ade80`) | Strait likely open — defender winning |

### Files changed

- `index.html` — adds `#gameDashboard` div + all CSS inline in `<style>` block; adds script tags for `weapons-config.js`, `game-state.js`, `game-dashboard.js`; replaces status bar `// LAYER I //` span with `<span id="sbProb">// PROB 50%</span>`
- `js/game-dashboard.js` — new file; pure DOM writer, 4 zones, reads `marketState` only
- `js/simulation.js` — `updateStats()` now calls `updateDashboard()` and updates `sbProb`

### Test file

`tests/post-phase-01-dashboard.html` — verifies `updateDashboard()` renders correct HTML for known `marketState` snapshots (empty state, one weapon active, prob at each color threshold boundary).

---

## Grill Report: Multi-Model Selector for detector.html

**Date:** 2026-04-28
**Feature:** Allow detector.html to switch between multiple trained Teachable Machine models via a dropdown, with per-model label configuration.
**Motivation:** Testing the gesture-detection mechanism in different physical locations requires different trained models.

---

### Q1: How does the detector know which models are available?

**Options:** (a) `models/manifest.json` — hand-maintained list, works on `file://`, (b) Auto-scan folder names via server directory listing — requires a server, (c) File System Access API drag-and-drop — requires a gesture each session

**Decision:** Option (a) — `models/manifest.json`

**Rationale:** Only option that works on `file://` with zero server infrastructure; one extra line to maintain per model is acceptable.

**Consequence:** Adding a model = copy folder + add one entry to manifest.json. No server required. Manifest is the source of truth for available models.

---

### Q2: Where does each model's LABEL_MAP config live?

**Options:** (a) `label-map.json` inside each model folder — self-contained, (b) Embed all label maps in manifest.json — one file, (c) Keep LABEL_MAP hardcoded in detector.html — only works if all models share class names

**Decision:** Option (a) — `label-map.json` per model folder

**Rationale:** Each folder becomes fully self-contained; copy the folder, edit its label-map.json, done — no central file to keep in sync.

**Consequence:** Each model folder must contain: `model.json`, `metadata.json`, `weights.bin`, `label-map.json`. detector.html fetches all four when a model is selected.

---

### Q3: What happens when detector.html first opens?

**Options:** (a) Auto-load first model in manifest.json — camera starts immediately, (b) Show dropdown first, require explicit selection — adds a tap before camera starts, (c) Remember last-used model in localStorage — auto-loads last session's model

**Decision:** Option (a) — auto-load first entry in manifest.json

**Rationale:** Live demo context — every extra tap before camera starts is friction at the wrong moment; first entry in manifest is "current venue's model" by convention.

**Consequence:** Reordering manifest.json entries is how you change the default model. Page behavior stays identical to current (auto-start on open).

---

### Q4: What is the format of `label-map.json`?

**Options:** (a) Mirror existing LABEL_MAP structure exactly — all fields duplicated, (b) Flat `className → weaponId` map — detector joins with weapons-config.js for the rest, (c) Full metadata block with model name and description at top level

**Decision:** Option (b) — flat `className → weaponId`

**Rationale:** Color, role, and action already live in weapons-config.js — duplicating them in every label-map.json would drift; let detector.html do the join at load time.

**Consequence:** detector.html must perform a join: `label-map.json` gives weaponId, `weapons-config.js` gives the rest. `null` value means "background — do nothing".

---

## Implementation Plan: Multi-Model Selector

### Step 1 — Create `models/manifest.json`

**Action:** Create `models/manifest.json` listing available model folders.

```json
[
  { "id": "tm-my-image-model", "name": "Lab A — Object 01", "path": "./tm-my-image-model/" }
]
```

**Visible change:** None — data layer only.

**If skipped:** detector.html has no model list to fetch; dropdown cannot render.

---

### Step 2 — Create `label-map.json` in each model folder

**Action:** Create `tm-my-image-model/label-map.json` with flat className → weaponId mapping.

```json
{
  "single_object_01": "D01",
  "blank background": null
}
```

**Visible change:** None — data layer only.

**If skipped:** detector.html cannot build LABEL_MAP for the selected model; weapon firing breaks.

---

### Step 3 — Add dropdown UI to `detector.html`

**Action:** Add a `<select id="modelSelect">` element to the tactical panel header. Style to match existing monospace dark theme.

**Visible change:** A small dropdown appears in the detector panel header, pre-selected to the first model name from manifest.

**If skipped:** User cannot switch models; page still works with auto-loaded first model.

---

### Step 4 — Fetch manifest on load, populate dropdown, auto-load first model

**Action:** Replace hardcoded `MODEL_URL` constant with a `loadManifest()` function that: (1) fetches `models/manifest.json`, (2) populates `<select>` options, (3) calls `loadModel(firstEntry.path)`.

**Visible change:** Page behavior identical to today — model loads, camera starts. Dropdown shows active model name.

**If skipped:** Dropdown is rendered but empty; model never loads.

---

### Step 5 — Fetch `label-map.json` on model load, build LABEL_MAP, display config table

**Action:** In `loadModel(path)`: fetch `path + 'label-map.json'`, join each entry against `WEAPONS_CONFIG` to build `LABEL_MAP`, then render a config table in the tactical panel showing className → weaponId → action for each non-null entry.

**Visible change:** Config table appears in the detector panel showing the active model's class-to-weapon mappings.

**If skipped:** LABEL_MAP stays empty; weapon firing does not work for the newly selected model.

---

### Step 6 — Wire dropdown `change` event to reload model + LABEL_MAP

**Action:** Add `modelSelect.addEventListener('change', ...)` that stops the current camera stream, calls `loadModel(selectedPath)`, which re-fetches label-map.json and re-renders the config table.

**Visible change:** Selecting a different model in the dropdown stops the current camera, shows "LOADING…", then restarts with the new model and updated config table.

**If skipped:** Dropdown renders but switching has no effect.

---

### Folder convention for adding a new model

1. Export TM model → rename folder (no spaces, no parens), place in project root
2. Create `label-map.json` in the folder: `{ "class_name": "WEAPON_ID", "blank background": null }`
3. Add one entry to `models/manifest.json`: `{ "id": "folder-name", "name": "Human Label", "path": "./folder-name/" }`
4. To make it the default: move its entry to position 0 in the manifest array

---

## Implementation Record: Multi-Model Selector

**Date:** 2026-04-28
**Status:** Complete — 12 tests, all GREEN

### What was built

Six files created or modified:

| File | Change |
|---|---|
| `models/manifest.json` | New — lists all available TM model folders |
| `tm-my-image-model/label-map.json` | New — `single_object_01 → D01`, `blank background → null` |
| `tm_model_01/label-map.json` | New — same as above (identical class labels) |
| `tm_model_02/label-map.json` | New — 5-class map (see table below) |
| `detector.html` | Refactored — MODEL_URL/LABEL_MAP replaced with dynamic loading |
| `tests/phase-02-multi-model.html` | New — 12 stress tests, all GREEN |

### tm_model_02 label-map (production config)

| Detected object | Weapon | Player | Effect |
|---|---|---|---|
| Object 01 | D01 | Disruptor (A) | Strait closure — prob +22%, ships halt |
| Pret Cup | D02 | Disruptor (A) | Sanctions — prob +8%, speed ×0.6 |
| Snacks | R01 | Defender (B) | Naval escort / freedom of navigation |
| Sparkling water | R02 | Defender (B) | Emergency re-flagging |
| Background | — | — | Resets to SCANNING, no weapon fired |

### label-map.json format

Single weapon (string value):
```json
{ "Snacks": "R01" }
```

Multiple weapons fired simultaneously (array value):
```json
{ "Snacks": ["R01", "R02"] }
```

Background / no-op class (null):
```json
{ "Background": null }
```

### Key design decisions implemented

- `buildLabelMap(rawMap)` — pure function, joins flat label-map against `WEAPONS_CONFIG`. Supports string, array, and null values. Unknown weapon IDs silently drop to null; empty arrays produce null without crashing.
- `buildConfigTable(rawMap)` — pure function, renders LABEL MAP section in the tech panel. All-null maps return a "none mapped" fallback string rather than empty HTML.
- `loadManifest()` — fetches `models/manifest.json` on boot, populates dropdown, auto-loads first entry. Falls back to `./tm-my-image-model/` if manifest is missing (backward-compatible).
- `stopCamera()` — stops media stream tracks before switching models; prevents camera lock on model change.
- Multi-weapon firing: when `weaponIds` array has >1 entry, each ID is posted to BroadcastChannel separately in the same debounce window. Status bar shows `WEAPON FIRED: R01 + R02`.

### Stress test results (tests/phase-02-multi-model.html)

| Slice | Edge case | Result |
|---|---|---|
| 1 | Single disruptor → weaponId D01, player A | GREEN |
| 2 | null value → null entry | GREEN |
| 3 | Unknown weaponId → null, no crash | GREEN |
| 4 | buildConfigTable skips nulls, renders weapon name | GREEN |
| 5 | Array → weaponIds contains all valid IDs | GREEN |
| 6 | Array → action label joined with "+", player B | GREEN |
| 7 | Mixed array ["R01","Z99"] → keeps R01, drops Z99 | GREEN |
| 8 | Empty array [] → null entry, no crash | GREEN |
| 9 | Defender weapon → player B, color #3b82f6, barClass player-b | GREEN |
| 10 | buildConfigTable array entry renders both weapon names | GREEN |
| 11 | All-null rawMap → "none mapped" fallback string | GREEN |
| 12 | Exact tm_model_02 production config pinned as regression guard | GREEN |

---

## Grill Report: Phase 2 — marketTick Decay Loop

**Date:** 2026-04-28
**Feature:** Autonomous 20-second tick loop — decay, drift, and mean-reversion.

---

### Q1: How is each weapon's remaining effect tracked in activeWeapons?

**Options:** (a) `remainingDelta` stored on entry at fire time, decremented each tick, (b) `firedAt` timestamp, derive decay from elapsed time, (c) `ticksFired` counter, compute ticks_active from global tick count

**Decision:** Option (a) — `remainingDelta` on each activeWeapons entry

**Rationale:** Directly testable ("remainingDelta ≤ 0 after 11 ticks"), matches issue spec language, single comparison for "fully decayed".

**Consequence:** `fireWeapon()` must set `remainingDelta = weapon.prob_delta` on each new entry. `marketTick()` decrements `entry.remainingDelta` by `decay_per_30s × (20/30)` each tick.

---

### Q2: Does Brownian drift apply when no weapons are active?

**Options:** (a) Drift always runs every tick, (b) Drift only runs when weapons are active, (c) Drift + mean-reversion pull toward 50

**Decision:** Option (c) — drift + mean-reversion

**Rationale:** Market breathes organically at all times but gravitates back to 50 between rounds — prevents prob drifting to 80 from pure noise.

**Consequence:** Each tick applies `drift = (Math.random() - 0.5) * 4` plus `pull = (50 - prob) * 0.05`. Both applied before clamp.

---

### Q3: Slow weapons in Phase 2 or deferred?

**Options:** (a) Defer to Phase 3, (b) Handle in Phase 2, (c) Stub onset counter only

**Decision:** Option (a) — defer entirely to Phase 3

**Rationale:** All 6 Phase 2-testable weapons are fast; slow weapon logic (onset delay + build_per_30s) is already scoped to issues/03.

**Consequence:** `marketTick` skips any entry where `weapon.speed === 'slow'`. Phase 3 extends the tick loop with onset + build path.

---

### Q4: Where does `marketTick` live?

**Options:** (a) Added to game-state.js, (b) New file js/market-tick.js, (c) Inline in bootstrap.js

**Decision:** Option (b) — new `js/market-tick.js`

**Rationale:** Keeps game-state.js as a pure data+write layer; tick loop is independently testable; follows the same file-per-concern pattern as game-dashboard.js.

**Consequence:** New `<script src="js/market-tick.js">` tag needed in index.html after game-state.js.

---

### Q5: How does tick count relate to the round timer?

**Options:** (a) Track `tickCount` in marketState, don't act on it, (b) Add onRoundEnd stub callback, (c) Don't track in Phase 2

**Decision:** Option (a) — `marketState.tickCount` increments each tick, no action taken

**Rationale:** Costs nothing, gives Phase 5 (round controller) a pre-populated field to read without adding speculative logic now.

**Consequence:** Phase 5 reads `marketState.tickCount`, checks against 30, triggers round end. No Phase 2 code changes needed at that point.

---

## Implementation Plan: Phase 2 — marketTick Decay Loop

### Step 1 — Add `remainingDelta` and `tickCount` to marketState

**Action:** Modify `js/game-state.js`:
- Add `tickCount: 0` to `marketState`
- In `fireWeapon()`, add `remainingDelta: weapon.prob_delta` to the activeWeapons entry

**Visible change:** None — data layer only.

**If skipped:** `marketTick` has no field to decrement; decay loop cannot function.

---

### Step 2 — Create `js/market-tick.js` with `marketTick()` and `startTick()`

**Action:** New file. `marketTick()` does on each call:
1. Increment `marketState.tickCount`
2. For each entry in `marketState.activeWeapons` where `weapon.speed === 'fast'`:
   - `entry.remainingDelta += weapon.decay_per_30s * (20/30)`
   - `marketState.prob += weapon.decay_per_30s * (20/30)`
3. Remove entries where `entry.remainingDelta <= 0`; call `recomputeSimMultipliers()` if any removed
4. Apply drift + mean-reversion: `prob += (Math.random() - 0.5) * 4 + (50 - prob) * 0.05`
5. Clamp `prob` to `[0, 100]`
6. Call `updateDashboard()` if defined

`startTick()` calls `setInterval(marketTick, 20000)`.

**Visible change:** None until wired into index.html.

**If skipped:** Market never moves autonomously; prob stays frozen after weapon fires.

---

### Step 3 — Add script tag and call `startTick()` in index.html

**Action:** Add `<script src="js/market-tick.js"></script>` after `game-state.js` in index.html. Call `startTick()` after all scripts load (end of body or DOMContentLoaded).

**Visible change:** Dashboard probability bar now decays over time after D01 fires. Ships gradually resume speed as `speed_mult` returns toward 1.0 via `recomputeSimMultipliers`.

**If skipped:** `marketTick` is defined but never runs.

---

### Step 4 — Tests in `tests/phase-02-market-tick.html`

Tests (each as a RED→GREEN TDD cycle):
1. After 11 calls to `marketTick()`, D01 `remainingDelta ≤ 0` and `activeWeapons` is empty
2. `prob` decreases each tick while D01 is active
3. `prob` stays within `[0, 100]` after 100 ticks of drift with no weapons
4. `tickCount` increments by 1 on each call
5. Slow weapon (D02) is not decayed — `remainingDelta` unchanged after tick
6. `recomputeSimMultipliers` is called after weapon removal — `speed_mult` returns to 1.0


---

## Implementation Record: Phase 2 — marketTick Decay Loop

**Date:** 2026-04-28
**Status:** Complete — 6 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `js/game-state.js` | Added `tickCount: 0` to marketState; added `remainingDelta: weapon.prob_delta` to each activeWeapons entry in `fireWeapon()` |
| `js/market-tick.js` | New file — `marketTick()` and `startTick()` |
| `index.html` | Added `<script src="js/market-tick.js">` after game-state.js; `startTick()` call at end of body |
| `tests/phase-02-market-tick.html` | New file — 6 tests, all GREEN |

### Decay math

Weapon config rates are per 30s. Tick interval is 20s. Scale factor: `20/30 = 0.667`.

| Weapon | decay_per_30s | decay_per_tick | prob_delta | ticks to fully decay |
|---|---|---|---|---|
| D01 | -2.0 | -1.333 | 22 | 17 |
| D03 | -1.0 | -0.667 | 14 | 21 |
| D04 | -1.5 | -1.0 | 18 | 18 |
| D06 | -2.0 | -1.333 | 12 | 9 |
| R01 | -1.5 | -1.0 | -18 | 18 |
| R02 | -0.5 | -0.333 | -10 | 30 |

### marketTick() behaviour per call

1. Increment `marketState.tickCount`
2. For each entry in `activeWeapons` where `weapon.speed === 'fast'`:
   - `entry.remainingDelta += decay_per_30s × (20/30)`
   - `marketState.prob += decay_per_30s × (20/30)`
   - If `remainingDelta ≤ 0`: remove entry, set `anyRemoved = true`
3. If any removed: call `recomputeSimMultipliers()` → sim multipliers restore to defaults
4. Apply drift + mean-reversion: `prob += (Math.random() - 0.5) × 4 + (50 - prob) × 0.05`
5. Clamp `prob` to `[0, 100]`
6. Call `updateDashboard()` if defined

### Slow weapons

D02, D05, R04, R05, R06 (`weapon.speed === 'slow'`) are skipped by the `speed !== 'fast'` guard. Their `remainingDelta` is set on fire but never decremented. Onset delay and `build_per_30s` logic deferred to Phase 3.

### Test results (tests/phase-02-market-tick.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | After 17 marketTick() calls, D01 removed from activeWeapons | GREEN |
| 2 | prob decreases each tick while D01 active | GREEN |
| 3 | prob stays in [0, 100] after 100 drift-only ticks | GREEN |
| 4 | tickCount increments by 1 per call | GREEN |
| 5 | D02 (slow) remainingDelta unchanged after tick | GREEN |
| 6 | speed_mult returns to 1.0 after D01 fully decays | GREEN |

### Visible demo

Fire D01 (`1` key) → prob jumps to 72 → every 20s prob ticks down ~1.33 → ships gradually resume speed as `speed_mult` climbs back toward 1.0 → after 17 ticks D01 clears → `speed_mult` snaps to 1.0.

---

## Grill Report: Phase 3 — All 12 Weapons via Keyboard

**Date:** 2026-04-28
**Feature:** Wire all 12 weapons to keyboard keys; add slow weapon onset + build logic to marketTick.

---

### Q1: How do we resolve the KeyR / KeyT keyboard conflicts?

**Options:** (a) Reassign sim shortcuts — toggleRoutes → Comma, toggleTrails → Period; weapons get clean Q–Y row, (b) Skip R and T in defender layout — use Q,W,E,G,U,I, (c) Shift modifier for all weapon keys

**Decision:** Option (a) — reassign toggleRoutes to Comma, toggleTrails to Period

**Rationale:** Weapons are the primary game mechanic and need single-key fires; sim shortcuts are operational tools that can move without affecting gameplay.

**Consequence:** bootstrap.js loses KeyR/KeyT for sim shortcuts; those move to Comma/Period. Full Q–Y row is free for R01–R06.

---

### Q2: How is slow weapon onset tracked per entry?

**Options:** (a) `ticksFiredAt` on entry — onset passed when `(currentTick - ticksFiredAt) × 20 >= onset_s`, (b) `onsetTicksRemaining` countdown counter on entry, (c) `activatesAt` wall-clock timestamp

**Decision:** Option (a) — `ticksFiredAt = marketState.tickCount` stored on each entry at fire time

**Rationale:** Reuses existing `tickCount` field, adds no new state, and the onset check is deterministic in tests.

**Consequence:** `fireWeapon()` must store `ticksFiredAt: marketState.tickCount` on every entry (fast and slow). Tick loop computes `ticksActive = currentTick - entry.ticksFiredAt`.

---

### Q3: How is slow weapon build applied to prob?

**Options:** (a) Apply `build_per_30s × (20/30)` directly to `prob` each tick after onset, (b) Track `accumulatedBuild` per entry and recompute prob from scratch each tick, (c) Cap build at a maximum accumulated delta

**Decision:** Option (a) — apply build directly to prob each tick

**Rationale:** Same pattern as fast weapon decay (also applied directly); keeps tick loop uniform; round controller removes weapons at round end so runaway isn't a risk.

**Consequence:** Slow weapon entries stay in `activeWeapons` indefinitely once active; removal is the round controller's responsibility (Phase 5).

---

### Q4: Does Phase 3 implement R06's disruptor_decay_mult = 1.5?

**Options:** (a) Defer to Phase 4 — R06 fires and builds normally but multiplier is a no-op, (b) Implement in Phase 3 inside the fast weapon decay loop, (c) Stub as a 1.0 placeholder function

**Decision:** Option (a) — defer entirely to Phase 4

**Rationale:** Phase 4 is explicitly scoped to weapon interactions; implementing it in Phase 3 pre-empts that design and adds cross-weapon logic before the interaction system exists.

**Consequence:** R06 fires, applies prob_delta, builds each tick — but disruptor weapons decay at their normal rate until Phase 4.

---

## Implementation Plan: Phase 3 — All 12 Weapons via Keyboard

### Full keyboard layout

| Key | Weapon | Name | Speed |
|---|---|---|---|
| `1` | D01 | Strait closure / naval blockade | Fast (already wired) |
| `2` | D02 | Sanctions package | Slow |
| `3` | D03 | Tanker seizure | Fast |
| `4` | D04 | Drone / missile strike on port | Fast |
| `5` | D05 | Insurance market suspension | Slow |
| `6` | D06 | Cyber attack on port logistics | Fast |
| `Q` | R01 | Naval escort / freedom of navigation | Fast |
| `W` | R02 | Emergency re-flagging | Fast |
| `E` | R03 | Alternative route activation | Fast |
| `R` | R04 | Diplomatic back-channel | Slow |
| `T` | R05 | Strategic petroleum reserve release | Slow |
| `Y` | R06 | Coalition formation | Slow |
| `,` | — | toggleRoutes (moved from R) | — |
| `.` | — | toggleTrails (moved from T) | — |

### Step 1 — Add `ticksFiredAt` to fireWeapon entries in `game-state.js`

**Action:** Add `ticksFiredAt: marketState.tickCount` to the entry pushed in `fireWeapon()`.

**Visible change:** None — data layer only.

**If skipped:** Slow weapon onset check has no reference tick; build never activates.

---

### Step 2 — Add slow weapon onset + build to `market-tick.js`

**Action:** After the fast weapon decay block, add a slow weapon block: for each entry where `weapon.speed === 'slow'`, compute `ticksActive = marketState.tickCount - entry.ticksFiredAt`. If `ticksActive * 20 >= weapon.onset_s`, apply `marketState.prob += weapon.build_per_30s * (20/30)`.

**Visible change:** After onset delay, prob starts moving autonomously (D02 builds +2/tick, R06 pulls -2.67/tick).

**If skipped:** Slow weapons fire their initial `prob_delta` but never build; half the weapon roster is broken.

---

### Step 3 — Rewire keyboard shortcuts in `bootstrap.js`

**Action:** Move `KeyR` → `Comma` for toggleRoutes. Move `KeyT` → `Period` for toggleTrails. Add Digit2–6 for D02–D06. Add KeyQ/W/E/R/T/Y for R01–R06.

**Visible change:** Keys 2–6 and Q–Y now fire weapons; comma/period toggle routes/trails.

**If skipped:** Only D01 is keyboard-fireable; 11 weapons inaccessible.

---

### Step 4 — Tests in `tests/phase-03-all-weapons.html`

TDD slices:
1. All 12 weapon IDs fire without error (fireWeapon returns cleanly for each)
2. Fast weapons D03/D04/D06 apply correct immediate prob_delta
3. Slow weapon D02 does not build before onset (3 ticks = 60s)
4. Slow weapon D02 builds after onset — prob increases each tick past tick 3
5. `ticksFiredAt` is set correctly on each entry
6. R06 active — disruptor decay rate unchanged (multiplier deferred to Phase 4)

---

## Implementation Record: Phase 3 — All 12 Weapons via Keyboard

**Date:** 2026-04-28
**Status:** Complete — 6 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `js/game-state.js` | Added `ticksFiredAt: marketState.tickCount` to each activeWeapons entry in `fireWeapon()` |
| `js/market-tick.js` | Added slow weapon onset + build block after fast weapon decay |
| `js/bootstrap.js` | Digits 2–6 → D02–D06; Q/W/E/R/T/Y → R01–R06; toggleRoutes moved to Comma; toggleTrails moved to Period |
| `tests/phase-03-all-weapons.html` | New — 6 tests, all GREEN |

### Keyboard layout

| Key | Weapon | Name | Speed |
|---|---|---|---|
| `1` | D01 | Strait closure / naval blockade | Fast |
| `2` | D02 | Sanctions package | Slow |
| `3` | D03 | Tanker seizure | Fast |
| `4` | D04 | Drone / missile strike on port | Fast |
| `5` | D05 | Insurance market suspension | Slow |
| `6` | D06 | Cyber attack on port logistics | Fast |
| `Q` | R01 | Naval escort / freedom of navigation | Fast |
| `W` | R02 | Emergency re-flagging | Fast |
| `E` | R03 | Alternative route activation | Fast |
| `R` | R04 | Diplomatic back-channel | Slow |
| `T` | R05 | Strategic petroleum reserve release | Slow |
| `Y` | R06 | Coalition formation | Slow |
| `,` | — | toggleRoutes (moved from R) | — |
| `.` | — | toggleTrails (moved from T) | — |

### Slow weapon onset + build logic (market-tick.js)

After the fast weapon decay block, each tick now runs a slow weapon pass:

```
for each entry where weapon.speed === 'slow':
  ticksActive = marketState.tickCount - entry.ticksFiredAt
  if ticksActive × 20 >= weapon.onset_s:
    marketState.prob += weapon.build_per_30s × (20/30)
```

Onset thresholds (ticks before build activates):

| Weapon | onset_s | onset ticks | build_per_tick |
|---|---|---|---|
| D02 | 60s | 3 | +2.00 |
| D05 | 90s | 5 | +2.67 |
| R04 | 60s | 3 | −2.00 |
| R05 | 90s | 5 | −1.33 |
| R06 | 120s | 6 | −2.67 |

Slow weapons are never removed by the tick loop — they stay in `activeWeapons` until the round controller clears them (Phase 5).

### Deferred

R06's `disruptor_decay_mult = 1.5` (speeds up disruptor fast weapon decay when R06 is active) is deferred to Phase 4 (weapon interactions). In Phase 3, R06 fires and builds normally but the cross-weapon multiplier is a no-op.

### Test results (tests/phase-03-all-weapons.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | All 12 weapons fire without error and appear in activeWeapons | GREEN |
| 2 | Fast weapon D03 applies prob_delta +14 immediately | GREEN |
| 3 | Slow weapon D02 does not build before onset (2 ticks = 40s < 60s) | GREEN |
| 4 | Slow weapon D02 builds after onset — prob rises on tick 3 | GREEN |
| 5 | ticksFiredAt = marketState.tickCount at fire time | GREEN |
| 6 | R06 active — D01 decays at normal rate (multiplier deferred to Phase 4) | GREEN |

---

## Grill Report: Phase 4 — Weapon Interactions

**Date:** 2026-04-28
**Feature:** When specific weapon pairs are simultaneously active, their per-tick build effects are replaced by a single net_delta override instead of summing independently.

---

### Q1: Where does the interaction table live?

**Options:** (a) Add `interactions` array to `weapons-config.js`, (b) Separate `js/interactions-config.js`, (c) Hardcoded in `market-tick.js`

**Decision:** Option (a) — `interactions` array added directly to `WEAPONS_CONFIG` in `weapons-config.js`

**Rationale:** Keeps all game balance data in one file; consistent with how weapons array already lives there; single file to edit when tuning pairs.

**Consequence:** `market-tick.js` reads `WEAPONS_CONFIG.interactions` at tick time. Any file that loads `weapons-config.js` automatically has access to the table.

---

### Q2: When and where is the interaction check applied?

**Options:** (a) In `marketTick` each tick — after individual effects, detect active pairs and apply net_delta, (b) In `fireWeapon` at fire time — patch entries on the spot when partner is detected, (c) Both — fire time for immediate offset, tick time for ongoing correction

**Decision:** Option (a) — interaction check runs inside `marketTick` each tick

**Rationale:** net_delta describes an ongoing per-tick rate, not a one-time event; keeping `fireWeapon` dumb (apply prob_delta, push entry) preserves separation of concerns.

**Consequence:** `fireWeapon` is unchanged. `marketTick` grows a pair-detection pass that runs each tick and replaces individual slow weapon builds when both partners are active.

---

### Q3: What does "net_delta override" mean mechanically per tick?

**Options:** (a) Skip-and-replace — paired weapons skip individual tick effects; apply interaction net_delta instead, (b) Correction-term — individual effects run, then add a correction delta, (c) One-time total — net_delta applied once at second fire, not every tick

**Decision:** Option (a) — skip-and-replace per tick

**Rationale:** Clearest expression of intent: paired weapons stop behaving individually and behave as a unit. No undo step required; paired entries are simply excluded from the individual slow-build loop.

**Consequence:** `marketTick` builds a `pairedIds` set before the slow weapon build loop. Any entry whose `weaponId` is in `pairedIds` is skipped. A second loop then applies `ix.net_delta * TICK_DECAY_SCALE` for each active pair when both partners are past onset.

---

## Implementation Plan: Phase 4 — Weapon Interactions

### Scope

Only **slow-slow pairs** get the skip-and-replace treatment (D02+R04, D05+R05). Fast weapon interactions (D01+R01, D03+R02, D04+R03, D06+R03) are already captured by `prob_delta` values at fire time; their per-tick decay continues independently.

Compound entries in the interactions table (`"D01+D02"`, `"any"`) are narrative descriptions only — skipped by the pair-detection filter.

### Step 1 — Confirm `interactions` array exists in `weapons-config.js`

**Action:** No code change needed. The array was already present with `disruptor_id`, `defender_id`, and `net_delta` fields for all 8 pairs.

**Visible change:** None — data layer only.

**If skipped:** `market-tick.js` has nothing to iterate; interaction detection loop throws.

---

### Step 2 — Add pair-detection and skip-and-replace to `market-tick.js`

**Action:** Between the fast weapon decay block and the slow weapon build loop, add:

1. Build `activeIds` set from current `activeWeapons`
2. Iterate `WEAPONS_CONFIG.interactions`; skip compound entries (`disruptor_id` contains `+` or equals `'any'`)
3. For each simple pair where both IDs are in `activeIds` and both weapons are `speed === 'slow'`: add both IDs to `pairedIds`, push pair to `activePairs`
4. In slow weapon build loop: add `if (pairedIds.has(entry.weaponId)) continue;` guard
5. After slow weapon loop: for each active pair, if both partners past their respective onset, apply `ix.net_delta * TICK_DECAY_SCALE` to `marketState.prob`

**Visible change:** When D05 is active and R05 fires (or vice versa), prob stops climbing after R05 onset — the +2.67/tick build from D05 is suppressed and offset by R05's −1.33/tick build, resulting in 0 net per tick.

**If skipped:** Paired slow weapons build independently — D05 and R05 together would still push prob upward at +1.33/tick (net of individual rates), ignoring the counter relationship.

---

### Step 3 — Tests in `tests/phase-04-interactions.html`

TDD slices (4 total):
1. **Tracer (D05+R05 past onset)** — interaction suppresses the +1.33/tick net build; delta after onset tick < 0.5
2. **D05 alone** — still builds +2.67/tick after onset (pairing doesn't break lone weapon)
3. **D02+R04 past onset** — prob stays flat (net_delta=0; individual builds also sum to 0 — regression guard)
4. **D05+R05 before onset** — no build applied; individual builds skipped, interaction net_delta also not applied (onset guard)

---

## Implementation Record: Phase 4 — Weapon Interactions

**Date:** 2026-04-28
**Status:** Complete — 4 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `js/weapons-config.js` | No change — `interactions` array was already present |
| `js/market-tick.js` | Added pair-detection block + skip-and-replace in slow weapon build loop |
| `tests/phase-04-interactions.html` | New — 4 tests, all GREEN |

### Interaction pair detection (market-tick.js)

Each tick, before the slow weapon build loop:

```
activeIds = Set of all weaponIds in activeWeapons
pairedIds = {}
activePairs = []

for each ix in WEAPONS_CONFIG.interactions:
  skip if disruptor_id contains '+', equals 'any', or defender_id contains '+'
  skip if either ID not in activeIds
  look up dW and rW in WEAPONS_CONFIG.weapons
  skip if either weapon is not 'slow'
  add both IDs to pairedIds, push ix to activePairs

slow build loop: skip any entry in pairedIds

for each ix in activePairs:
  if both partners past onset: prob += ix.net_delta * (20/30)
```

### Active slow-slow pairs

| Pair | net_delta | Mechanism |
|---|---|---|
| D02 + R04 | 0.0/30s | Back-channel freezes sanctions build. D02 build = +3.0/30s, R04 build = −3.0/30s — individual sum also = 0; interaction overrides both. |
| D05 + R05 | 0.0/30s | SPR breaks fear signal. D05 build = +4.0/30s, R05 build = −2.0/30s — without interaction net = +2.0/30s; interaction overrides to 0. |

### Fast-fast pairs (not implemented in tick loop)

D01+R01, D03+R02, D04+R03, D06+R03 — interaction captured by `prob_delta` values at fire time. Per-tick decay continues independently. Config `net_delta` for these pairs is narrative, not mechanical.

### Test results (tests/phase-04-interactions.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | D05+R05 both active past onset: prob delta < 0.5 per tick (build suppressed) | GREEN |
| 2 | D05 alone past onset: prob delta > 2.0 per tick (builds normally) | GREEN |
| 3 | D02+R04 both active past onset: \|delta\| < 0.5 per tick | GREEN |
| 4 | D05+R05 both active before onset: no build applied | GREEN |

---

## Grill Report: Phase 5 — Round Controller

**Date:** 2026-04-28
**Feature:** Full round lifecycle — start, play, end, score, pause/resume, reset. Best-of-3. Operator controls. Center-screen flash for major events.

---

### Q1: Where does round state live?

**Options:** (a) Flat fields on marketState (`marketState.phase`, `marketState.round`, etc.), (b) Nested `marketState.round` sub-object, (c) Separate `roundState` global
**Decision:** Option B — nested `marketState.round` sub-object
**Rationale:** Groups all round state under one key that can be atomically reset, without polluting the top-level marketState or breaking single-source-of-truth.
**Consequence:** `startRound()` resets `marketState.round` in one assignment. All readers (status bar, dashboard, tests) access `marketState.round.phase`, `marketState.round.scores`, etc.

Phase 5 shape added to `marketState`:
```js
round: {
  phase: 'idle',                              // 'idle' | 'playing' | 'roundEnd' | 'over'
  number: 0,                                  // 1, 2, 3
  scores: [0, 0],                             // [playerA, playerB]
  roles: ['disruptor', 'defender'],           // [playerA role, playerB role]
  winner: null,                               // null | 'A' | 'B'
  roundStartedAt: null,                       // Date.now() at startRound()
  pausedAt: null,                             // Date.now() at pauseRound()
  firstMoveFlags: { disruptor: false, defender: false }
}
```

---

### Q2: How does `endRound()` determine the winner?

**Options:** (a) Read `marketState.simMultipliers.hormuz_lane` directly, (b) Prob threshold — `prob > 65` → disruptor wins, (c) Both must agree
**Decision:** Option A — read `marketState.simMultipliers.hormuz_lane`
**Rationale:** `hormuz_lane` is already the authoritative physical state set by weapons and `recomputeSimMultipliers()`; it is consistent with what ships display and never diverges from ship behavior.
**Consequence:** `endRound()` is a single boolean check: `marketState.simMultipliers.hormuz_lane === 'closed'` → disruptor wins, else defender wins.

---

### Q3: How does PAUSE freeze the game?

**Options:** (a) Keep `setInterval`, add a `paused` flag that `marketTick()` checks and returns early, (b) Replace `setInterval` with a `setTimeout` chain — pause clears pending timeout, resume reschedules for remaining ms, (c) Clear interval on pause, restart fresh interval on resume
**Decision:** Option B — `setTimeout` chain with remaining-ms tracking
**Rationale:** The only approach that honors remaining interval time on resume; prevents giving a free 20s to whoever unpauses.
**Consequence:** `market-tick.js` replaces `startTick()` with `scheduleTick(delayMs)`. New exports: `pauseTick()` and `resumeTick()`. `round-controller.js` calls both.

```js
let tickTimer = null;
let tickPausedAt = null;
let tickRemainingMs = TICK_INTERVAL_MS;

function scheduleTick(delayMs) {
  tickTimer = setTimeout(() => { marketTick(); scheduleTick(TICK_INTERVAL_MS); }, delayMs);
}
function startTick() { scheduleTick(TICK_INTERVAL_MS); }
function pauseTick() { tickPausedAt = Date.now(); clearTimeout(tickTimer); }
function resumeTick() {
  const elapsed = Date.now() - tickPausedAt;
  tickRemainingMs = Math.max(0, tickRemainingMs - elapsed);
  scheduleTick(tickRemainingMs);
  tickRemainingMs = TICK_INTERVAL_MS;
}
```

---

### Q4: Where do operator controls render?

**Options:** (a) Add to existing left control panel below the PLAY button, (b) Separate floating operator overlay, (c) Keyboard-only
**Decision:** Option A — three buttons added to existing left control panel
**Rationale:** Consistent with existing UI; operator already reaches this panel; no new DOM layer or CSS required.
**Consequence:** `index.html` gets a `#roundControls` div inserted below `btnPlay`. Buttons call `startRound()`, `pauseRound()`, `resetGame()` via `onclick`.

---

### Q5: What does the status bar show for round and score?

**Options:** (a) Extend status bar inline with new span between sbTick and sbProb, (b) Show round/score only in `#gameDashboard`, (c) New dedicated `#roundBar`
**Decision:** Option A — new `#sbRound` span inserted between sbTick and sbProb
**Rationale:** Status bar is the one element guaranteed visible at Movement Lab projection scale; always-on round state must live there.
**Consequence:** Status bar reads: `SIM TICK 0042 // R1 · 08:20 · A1-B0 // PROB 72% // VESSELS 28 // HORMUZ FLOW 4%`. `updateStats()` in `simulation.js` populates `sbRound` from `marketState.round`.

---

### Q6: How does role swap track which player is which?

**Options:** (a) Dynamically remap keys — 1–6 fires defender weapons after swap, (b) Fixed key mapping, swap the role label in `marketState.round.roles` only, (c) No explicit role tracking
**Decision:** Option B — fixed key mapping, role label swap only
**Rationale:** Physical seat-swap is the legible ritual for the audience; remapping keys mid-game is error-prone and confusing under live demo conditions.
**Consequence:** Keys 1–6 always fire disruptor weapons, Q–Y always fire defender weapons. After a round, `swapRoles()` flips `marketState.round.roles` and the dashboard updates the role label. **Deferred — not in Phase 5 implementation scope.**

---

### Q7: Where does `round-controller.js` live in the script stack?

**Options:** (a) New `js/round-controller.js` at Layer 1.5 after `market-tick.js`, (b) Append to `game-state.js`, (c) Inline in `bootstrap.js`
**Decision:** Option A — new file at Layer 1.5 after `market-tick.js`, before `game-dashboard.js`
**Rationale:** Follows file-per-concern pattern; must load before `bootstrap.js` since operator buttons call its functions via `onclick`; needs `pauseTick`/`resumeTick` from `market-tick.js` to already be defined.
**Consequence:** `index.html` load order: `weapons-config.js` → `game-state.js` → `market-tick.js` → `round-controller.js` → `game-dashboard.js`.

**Additional decision (same question):** `fireWeapon()` checks `marketState.round.firstMoveFlags` on each fire. First disruptor weapon in a round → `showFlash('GO DEFENDER!')`. First defender weapon → `showFlash('GO DISRUPTOR!')`. Flags reset in `startRound()`.

---

### Q8: What does `startRound()` reset?

**Options:** (a) Reset game layer only — `prob → 50`, `activeWeapons → []`, `simMultipliers → SIM_DEFAULTS`, `actionLog → []`, `tickCount → 0`; vessels untouched, (b) Full reset including `resetSim()` — clears and respawns all vessels, (c) Reset game layer + 3-second holding screen
**Decision:** Option A — game layer reset only, vessels untouched
**Rationale:** `resetSim()` already exists for operator use; conflating it with round start destroys sim continuity and takes time during a live demo.
**Consequence:** Ships on map persist across rounds. Only `marketState` game fields and `marketState.round` are reset. `marketState.round.number` increments, `scores` persists across rounds (only reset by `resetGame()`).

---

### Q9: How does the 10-minute countdown work?

**Options:** (a) Wall-clock — `roundStartedAt = Date.now()` at start, computed each `updateStats()` frame, (b) Tick-based — `ticksRemaining` decremented each `marketTick()`, (c) Both — ticks for resolution, wall-clock for display
**Decision:** Option A — wall-clock based
**Rationale:** Precise to the millisecond, survives variable frame rates, pause handled by shifting `roundStartedAt` forward by paused duration.
**Consequence:** `updateStats()` computes `remaining = 600000 - (Date.now() - marketState.round.roundStartedAt - totalPausedMs)` and formats as `mm:ss`. `endRound()` is triggered inside `updateStats()` when remaining ≤ 0 and phase is `'playing'`.

---

### Q10: What happens to sim and tick when `endRound()` triggers?

**Options:** (a) Both loops keep running through roundEnd, (b) Auto-pause both on `endRound()` — operator must press START to begin next round, (c) Pause tick only, leave sim running
**Decision:** Option B — auto-pause both on `endRound()`
**Rationale:** Clean freeze with unambiguous state; operator controls when round 2 begins; prevents prob drift and weapon decay continuing while the audience reads results.
**Consequence:** `endRound()` calls `pauseTick()` and sets `playing = false`. `startRound()` calls `resumeTick()` and sets `playing = true`.

---

### Q11: What does `resetGame()` do vs `startRound()`?

**Options:** (a) Game layer reset + round sub-object back to initial shape + pause everything; vessels stay, (b) `resetGame()` calls `resetSim()` too — full nuclear reset, (c) `resetGame()` is just an alias for `startRound()`
**Decision:** Option A — `resetGame()` resets game layer + full round sub-object to `phase: 'idle'`, `number: 0`, `scores: [0,0]`; pauses everything; vessels stay
**Rationale:** Separates "reset game state" from "reset simulation" — operator may want to clear scores without wiping vessels.
**Consequence:** RESET button returns to true idle state. `startRound()` only resets within-round state (`prob`, `activeWeapons`, `firstMoveFlags`) and increments `round.number`; it does not touch `scores`.

---

### Q12: How does the `gameFlash` div work technically?

**Options:** (a) Single fixed div, CSS transition on `visible` class, `showFlash(text, durationMs)` helper, (b) CSS keyframe animation, auto-removes via `animationend`, (c) Render inside `#gameDashboard`
**Decision:** Option A — single `#gameFlash` div, CSS opacity transition, `showFlash()` helper
**Rationale:** Simple, no dependencies, interruptible (new flash can immediately replace old one), works at projection scale.
**Consequence:** `index.html` gets `<div id="gameFlash"></div>`. CSS: `position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 4rem; font-weight: 900; font-family: monospace; opacity: 0; transition: opacity 0.2s`. `showFlash(text, ms=2000)` sets textContent, adds class `visible`, clears after `ms`. Called by `startRound()`, `endRound()`, `pauseRound()`, `resumeRound()`, `resetGame()`, and `fireWeapon()` (first-move prompts).

---

## Phase 5 Implementation Plan

### Step 1 — Extend `marketState` with `round` sub-object in `js/game-state.js`

**Action:** Add `round` field to `marketState`. Add `firstMoveFlags` check to `fireWeapon()` — on first disruptor fire call `showFlash('GO DEFENDER!')`, on first defender fire call `showFlash('GO DISRUPTOR!')`.

**Visible change:** None until operator presses START. `fireWeapon()` now conditionally calls `showFlash()` on first move.

**If skipped:** `round-controller.js` has no state object to read or write; all round functions throw.

---

### Step 2 — Refactor `market-tick.js`: `setInterval` → `setTimeout` chain, add `pauseTick()` / `resumeTick()`

**Action:** Replace `startTick()` body with `scheduleTick(TICK_INTERVAL_MS)`. Add `pauseTick()` and `resumeTick()` as exported functions.

**Visible change:** None — behavior identical to current until pause is called.

**If skipped:** Pause cannot honor remaining interval time; `round-controller.js` has no pause/resume primitives.

---

### Step 3 — Create `js/round-controller.js` with `startRound()`, `endRound()`, `pauseRound()`, `resumeRound()`, `resetGame()`

**Action:** New file. Functions:
- `startRound()` — resets game layer, increments `round.number`, sets `phase: 'playing'`, stores `roundStartedAt`, calls `resumeTick()`, sets `playing = true`, calls `showFlash('ROUND N — BEGIN')`
- `endRound()` — reads `hormuz_lane`, sets winner, updates `scores`, sets `phase: 'roundEnd'`, calls `pauseTick()`, sets `playing = false`, calls `showFlash('ROUND N — X WINS')`, checks best-of-3
- `pauseRound()` — stores `pausedAt`, calls `pauseTick()`, sets `playing = false`, calls `showFlash('PAUSED')`
- `resumeRound()` — shifts `roundStartedAt` by paused duration, calls `resumeTick()`, sets `playing = true`, calls `showFlash('RESUMED')`
- `resetGame()` — resets everything to idle, calls `pauseTick()`, sets `playing = false`, calls `showFlash('GAME RESET')`

**Visible change:** None until wired into HTML. Functions defined globally.

**If skipped:** Operator buttons have no functions to call; `onclick` handlers throw.

---

### Step 4 — Add `#gameFlash` div and CSS to `index.html`

**Action:** Add `<div id="gameFlash"></div>` before status bar. Add CSS for fixed center positioning, 4rem monospace, opacity transition. Add `showFlash()` helper as an inline script or in `round-controller.js`.

**Visible change:** Nothing until `showFlash()` is called. DOM element present but invisible.

**If skipped:** `showFlash()` calls throw `getElementById` null error.

---

### Step 5 — Add operator buttons to control panel and `#sbRound` to status bar in `index.html`

**Action:** Insert `#roundControls` div below `btnPlay` in left panel with START ROUND, PAUSE, RESET buttons. Insert `<span id="sbRound">// R0 · --:-- · A0-B0</span>` between `sbTick` and `sbProb` in status bar.

**Visible change:** Three new buttons appear in control panel. Status bar gains round/timer/score segment showing idle defaults.

**If skipped:** Operator has no UI controls; status bar shows no round state.

---

### Step 6 — Add round countdown and `endRound()` trigger to `updateStats()` in `js/simulation.js`

**Action:** In `updateStats()`, if `marketState.round.phase === 'playing'`: compute `remaining`, format as `mm:ss`, write to `sbRound`. If `remaining <= 0`: call `endRound()`. Otherwise populate `sbRound` with idle/roundEnd defaults.

**Visible change:** Status bar timer counts down live during a round. `endRound()` fires automatically at zero.

**If skipped:** Timer never displays; round never auto-ends; operator must manually trigger `endRound()`.

---

### Step 7 — Add `<script src="js/round-controller.js">` to `index.html` at Layer 1.5

**Action:** Insert after `market-tick.js`, before `game-dashboard.js`.

**Visible change:** None — scripts load silently.

**If skipped:** `startRound` / `pauseRound` / `resetGame` are undefined; operator buttons throw on click.

---

### Step 8 — Tests in `tests/phase-05-round-controller.html`

TDD slices:
1. `startRound()` sets `phase: 'playing'`, `prob: 50`, `activeWeapons: []`, increments `round.number`
2. `endRound()` with `hormuz_lane: 'closed'` → disruptor wins, score increments
3. `endRound()` with `hormuz_lane: 'open'` → defender wins, score increments
4. Best-of-3: scores `[2,0]` after `endRound()` → `phase: 'over'`
5. `resetGame()` → `phase: 'idle'`, `scores: [0,0]`, `number: 0`
6. `pauseRound()` freezes phase, `resumeRound()` restores it
7. `firstMoveFlags` — first disruptor fire triggers `showFlash('GO DEFENDER!')`, flag set, second fire does not re-trigger

---

## Implementation Record: Phase 5 — Round Controller

**Date:** 2026-04-28
**Status:** Complete — 7 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `js/game-state.js` | Added `round` sub-object to `marketState`; added `firstMoveFlags` check in `fireWeapon()` |
| `js/market-tick.js` | Refactored `setInterval` → `setTimeout` chain; added `pauseTick()`, `resumeTick()`, `clearTimeout` guard in `resumeTick()` to prevent double-scheduling |
| `js/round-controller.js` | New file — `startRound()`, `endRound()`, `pauseRound()`, `resumeRound()`, `togglePauseRound()`, `resetGame()` |
| `index.html` | `#gameFlash` div + CSS; `showFlash()` inline script; `#roundControls` operator buttons (START/PAUSE/RESET); `#sbRound` span in status bar; `<script src="js/round-controller.js">` at Layer 1.5 |
| `js/simulation.js` | `updateStats()` populates `#sbRound` with `R1 · 08:20 · A0-B0`; triggers `endRound()` when countdown hits zero |
| `tests/phase-05-round-controller.html` | New — 7 tests, all GREEN |

### marketState.round shape

```js
round: {
  phase: 'idle',           // 'idle' | 'playing' | 'roundEnd' | 'over'
  number: 0,               // increments on each startRound()
  scores: [0, 0],          // [playerA, playerB] — persists across rounds
  roles: ['disruptor', 'defender'],
  winner: null,            // null | 'A' | 'B'
  roundStartedAt: null,    // Date.now() at startRound()
  pausedAt: null,          // Date.now() at pauseRound(), null when resumed
  totalPausedMs: 0,        // accumulated pause duration for accurate countdown
  firstMoveFlags: { disruptor: false, defender: false }
}
```

### Round lifecycle

```
idle → startRound() → playing → endRound() → roundEnd → startRound() → playing
                                           → over (if 2 wins reached)
playing → pauseRound() → [paused] → resumeRound() → playing
any → resetGame() → idle
```

### Status bar format

| Phase | Display |
|---|---|
| idle | `// R0 · --:-- · A0-B0` |
| playing | `// R1 · 08:20 · A0-B0` (live countdown) |
| roundEnd / over | `// R1 END · A1-B0` |

### gameFlash triggers

| Event | Flash text |
|---|---|
| `startRound()` | `ROUND N — BEGIN` |
| `endRound()` disruptor wins | `ROUND N — DISRUPTOR WINS` |
| `endRound()` defender wins | `ROUND N — DEFENDER WINS` |
| `endRound()` game over | `GAME OVER — PLAYER A/B WINS` |
| `pauseRound()` | `PAUSED` |
| `resumeRound()` | `RESUMED` |
| `resetGame()` | `GAME RESET` |
| First disruptor weapon | `GO DEFENDER!` |
| First defender weapon | `GO DISRUPTOR!` |

### Test results (tests/phase-05-round-controller.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | `startRound()` sets phase 'playing', prob 50, clears weapons, increments round.number | GREEN |
| 2 | `endRound()` hormuz_lane closed → disruptor score increments, winner 'A' | GREEN |
| 3 | `endRound()` hormuz_lane open → defender score increments, winner 'B' | GREEN |
| 4 | Best-of-3: two disruptor wins → phase 'over', scores [2,0] | GREEN |
| 5 | `resetGame()` → phase 'idle', scores [0,0], number 0, prob 50 | GREEN |
| 6 | `pauseRound()` freezes tick + sim; `resumeRound()` restores both | GREEN |
| 7 | First disruptor fire sets `firstMoveFlags.disruptor`, flashes 'GO DEFENDER!', second fire no-ops flash | GREEN |
