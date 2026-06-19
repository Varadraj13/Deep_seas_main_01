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

---

## Post-Phase-5 Corrections — Identified Issues

Four issues discovered during live testing that need to be addressed before the demo. Grouped into three phases by concern.

| # | Issue | Root cause | Phase |
|---|---|---|---|
| 1 | gameFlash only fires on first weapon per player per round | `firstMoveFlags` guard in `game-state.js:82` prevents subsequent flashes | Phase 5a |
| 2 | Ship speed and HORMUZ FLOW % do not change when weapons are active | `avgSpeed` (simulation.js:198) and `flowPct` (simulation.js:207) both use raw `v.speed`, ignoring `speedMult`; speed change is also instant (no lerp) | Phase 5b |
| 3 | No End Game button — operator cannot declare a winner mid-round | No `endGameNow()` function exists; `endRound()` only feeds the best-of-3 round system | Phase 5a |
| 4 | No live activity feed showing what weapons were played and why prob is moving | `actionLog` is internal state; no scrolling visible feed on screen or on market projection | Phase 5c |

**Note on numbering:** Existing issues/06 through issues/13 define Phases 6–13 (MKTS panel, market screen extension, object detection, etc.). These correction phases are numbered 5a/5b/5c to slot between Phase 5 and the planned Phase 6 without renumbering the existing issue queue.

**Note on overlap with Phase 7 (market_screen extension):** Phase 5c introduces BroadcastChannel infrastructure to sync live state from index.html to market_screen.html. Phase 7 (issues/07) specifies a similar "shared mechanism (localStorage, BroadcastChannel, or WebSocket)" requirement. Phase 5c intentionally lays that foundation early so Phase 7 can build the full market screen UI on top of it rather than having to retrofit the sync layer. Phase 7 should be scoped to the market_screen UI work (flow_ratio bar, color thresholds, audience leaderboard placeholder) and can assume the BroadcastChannel is already live.

---

## Grill Report: Phase 5a — gameFlash Fix + End Game Button

**Date:** 2026-04-28
**Features:** (a) Flash on every weapon fire with weapon name and effect. (b) Operator END GAME button that immediately declares the winner.

---

### Q1: What should the flash text say when a weapon fires?

**Options:** (a) Short: `D01 ACTIVE`, (b) Rich: `DISRUPTOR · D01 STRAIT BLOCKADE +22%`, (c) Two-line: weapon name on line 1, prob change on line 2

**Decision:** Option (b) — `DISRUPTOR · D01 STRAIT BLOCKADE +22%` (or `DEFENDER · R01 NAVAL ESCORT −18%`)

**Rationale:** Legible at Movement Lab projection scale in one glance. Role prefix tells the audience who played. Weapon name and delta tell them what happened and how much it matters. Two-line would require layout changes; single line stays within existing `#gameFlash` CSS.

**Consequence:** `fireWeapon()` must format the string at fire time: `weapon.player.toUpperCase() + ' · ' + id + ' ' + weapon.name.toUpperCase() + ' ' + sign + delta + '%'`. This replaces the `firstMoveFlags` conditional flash.

---

### Q2: What happens to "GO DEFENDER!" / "GO DISRUPTOR!" first-move prompts?

**Options:** (a) Remove entirely — per-weapon flash replaces them, (b) Keep as a pre-flash before the weapon flash, (c) Move them to `#gameDashboard` as a persistent call-to-action

**Decision:** Option (a) — remove entirely

**Rationale:** The first-move prompts were designed to cue the other player. Now that every weapon fires a flash, the audience sees the play immediately — the prompt adds no information beyond what the weapon flash already communicates. Removing the `firstMoveFlags` guard also simplifies `fireWeapon()`.

**Consequence:** `firstMoveFlags` field remains in `marketState.round` (round controller resets it in `startRound()`) but `fireWeapon()` no longer reads it. The field becomes unused — it can be removed in a future cleanup, but removing it now would require changing the test in `tests/phase-05-round-controller.html` (Slice 7 tests the flag behavior), so leave it in place.

---

### Q3: What does END GAME do — end the current round or end the whole game?

**Options:** (a) Calls `endRound()` immediately, feeding into best-of-3 scoring, (b) New `endGameNow()` — reads `hormuz_lane`, immediately sets `phase: 'over'`, bypasses scoring, (c) Prompts operator to confirm before acting

**Decision:** Option (b) — new `endGameNow()` that bypasses round scoring

**Rationale:** The operator needs a "hard stop" that works regardless of what round it is or what the scores are. A demo can go wrong; the operator needs to be able to declare the game over on the spot. This is semantically different from `endRound()` — it's a game-layer override, not a round-level event. No confirmation needed in a live demo context; the button's label and position make its purpose clear.

**Consequence:** `round-controller.js` gets a new `endGameNow()` function. It reads `hormuz_lane`, resolves a winner, sets `marketState.round.phase = 'over'`, calls `pauseTick()`, sets `playing = false`, and flashes the result. Score arrays are NOT updated — this is a declaration, not a scoring event. The new button in `#roundControls` calls `endGameNow()` via `onclick`.

---

### Q4: What does the END GAME flash text say?

**Decision:** Two cases:
- `hormuz_lane === 'closed'`: `STRAIT CLOSED — DISRUPTOR WINS`
- `hormuz_lane === 'open'` (default): `STRAIT OPEN — DEFENDER WINS`

Duration: 4000ms (longer than weapon flashes at 2000ms — this is the final moment of the game and should linger).

---

### Q5: Where does the END GAME button sit in the UI?

**Options:** (a) Fourth button in `#roundControls` alongside START / PAUSE / RESET, (b) Separate `#endGameControls` div with its own section, (c) Only keyboard-accessible

**Decision:** Option (a) — fourth button in `#roundControls`, styled red (`background: #7f1d1d`, `color: #fca5a5`) to distinguish it from the operational buttons

**Rationale:** Operator already reaches `#roundControls`; adding a fourth button keeps all round management in one place. The red color signals "destructive / final" — distinct from the grey-styled START / PAUSE / RESET.

**Consequence:** No new DOM structure. `index.html` adds one `<button>` element to the existing `#roundControls` div.

---

## Phase 5a Implementation Plan

### Step 1 — Fix `fireWeapon()` in `js/game-state.js`

**Action:** Remove the `firstMoveFlags` conditional block (lines 82–86). Add a `showFlash()` call unconditionally after the `recomputeSimMultipliers()` call, formatting the weapon name and delta:

```js
if (typeof showFlash === 'function') {
  const sign = weapon.prob_delta >= 0 ? '+' : '';
  showFlash(weapon.player.toUpperCase() + ' · ' + id + ' ' + weapon.name.toUpperCase().slice(0, 20) + ' ' + sign + weapon.prob_delta + '%');
}
```

**Visible change:** Every weapon fire produces a center-screen flash. Previously only the first disruptor and first defender weapon per round triggered a flash.

**If skipped:** Audience sees no visual cue for weapons 2+ in each round.

---

### Step 2 — Add `endGameNow()` to `js/round-controller.js`

**Action:** New function appended to `round-controller.js`:

```js
function endGameNow() {
  const lane = marketState.simMultipliers.hormuz_lane || 'open';
  marketState.round.phase = 'over';
  if (typeof playing !== 'undefined') playing = false;
  if (typeof pauseTick === 'function') pauseTick();
  const msg = lane === 'closed' ? 'STRAIT CLOSED — DISRUPTOR WINS' : 'STRAIT OPEN — DEFENDER WINS';
  if (typeof showFlash === 'function') showFlash(msg, 4000);
  if (typeof updateDashboard === 'function') updateDashboard();
}
```

**Visible change:** None until operator presses END GAME.

**If skipped:** No hard-stop capability; operator cannot override the round timer.

---

### Step 3 — Add END GAME button to `index.html`

**Action:** Add a fourth button to `#roundControls`:

```html
<button onclick="endGameNow()" style="background:#7f1d1d;color:#fca5a5">END GAME</button>
```

**Visible change:** Red END GAME button appears in the operator control panel.

**If skipped:** `endGameNow()` is defined but unreachable without a keyboard shortcut or console call.

---

### Step 4 — Tests in `tests/phase-05a-corrections.html`

TDD slices:
1. `fireWeapon('D01')` calls `showFlash` with text containing `'D01'` and `'+22'`
2. `fireWeapon('D01')` twice — second call is a no-op (weapon already active), so `showFlash` called only once
3. `fireWeapon('R01')` flash text contains `'DEFENDER'`
4. `endGameNow()` with `hormuz_lane: 'closed'` → `phase: 'over'`, flash contains `'DISRUPTOR WINS'`
5. `endGameNow()` with `hormuz_lane: 'open'` → flash contains `'DEFENDER WINS'`
6. `endGameNow()` when `phase: 'idle'` (no round started) still resolves correctly — no throw

---

## Implementation Record: Phase 5a — gameFlash Fix + End Game Button

**Date:** 2026-04-28
**Status:** Complete — 6 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `js/game-state.js` | Removed `firstMoveFlags` conditional block from `fireWeapon()`; added unconditional `showFlash()` on every weapon fire with format `ROLE · ID NAME ±DELTA%` |
| `js/round-controller.js` | Added `endGameNow()` — reads `hormuz_lane`, sets `phase: 'over'`, pauses tick and sim, flashes result for 4000ms |
| `index.html` | Added `#btnEndGame` red button below START/PAUSE/RESET row; added CSS for dark red styling |
| `tests/phase-05-round-controller.html` | Updated Slice 7 — old `firstMoveFlags` / `'GO DEFENDER!'` assertion replaced with new per-weapon flash behavior |
| `tests/phase-05a-corrections.html` | New — 6 tests, all GREEN |

### Flash format

Every `fireWeapon()` call now produces: `DISRUPTOR · D01 STRAIT CLOSURE / NAVAL BLOCKADE +22%` (or `DEFENDER · R01 ...` for defender weapons). The "GO DEFENDER!" / "GO DISRUPTOR!" first-move prompts are retired.

### endGameNow() behavior

```
endGameNow()
  → reads marketState.simMultipliers.hormuz_lane
  → sets marketState.round.phase = 'over'
  → pauses tick + sim (playing = false)
  → flashes 'STRAIT CLOSED — DISRUPTOR WINS' or 'STRAIT OPEN — DEFENDER WINS' for 4000ms
  → works from any phase (idle, playing, roundEnd) — no guard
```

### Test results (tests/phase-05a-corrections.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | `fireWeapon('D01')` → flash contains `'D01'` and `'+22'` | GREEN |
| 2 | `fireWeapon('R01')` → flash contains `'DEFENDER'` | GREEN |
| 3 | `fireWeapon('D01')` twice → second call no-op, showFlash called only once | GREEN |
| 4 | `endGameNow()` lane closed → `phase: 'over'`, flash contains `'DISRUPTOR WINS'` | GREEN |
| 5 | `endGameNow()` lane open → flash contains `'DEFENDER WINS'`, duration 4000ms | GREEN |
| 6 | `endGameNow()` from `phase: 'idle'` → no throw, `phase: 'over'` | GREEN |

---

## Grill Report: Phase 5b — Ship Speed Responsiveness

**Date:** 2026-04-28
**Feature:** Make ship speed and flow metrics visibly respond to active weapons, with a gradual lerp so the change feels alive rather than instant.

---

### Q1: What exactly is broken?

**Root cause confirmed from code review:**

1. `simulation.js:198` — `avgSpeed` uses raw `v.speed`, not effective speed. The ship info panel and status bar never show the slowdown.
2. `simulation.js:207` — `flowPct` (the "HORMUZ FLOW XX%" in the status bar) is computed as `avg(v.speed) / 15 * 100`, also using raw speed. HORMUZ FLOW never drops even when D01 is active.
3. Speed change is instant — `speedMult` is read fresh each frame, so D01 firing causes an immediate snap from 1.0 to 0.05. Ships freeze mid-stride with no transition.

`progressDelta` IS correctly using `effectiveSpeed` (simulation.js:66–67), so ships DO move slower on the map when weapons are active. But the displayed numbers and the feel are broken.

---

### Q2: Where does the lerp state live?

**Options:** (a) `let currentSpeedMult = 1.0` as a local variable in `simulation.js`, (b) `marketState.currentSpeedMult` so dashboard can read it, (c) No lerp — just fix the display bug

**Decision:** Option (a) — local variable in `simulation.js`

**Rationale:** `currentSpeedMult` is a rendering/animation concern, not game state. It has no bearing on market probability, round outcomes, or tests. Keeping it local prevents `marketState` from accruing display-layer values. The dashboard reads `marketState.prob` for the probability display; it does not need to read `currentSpeedMult`.

**Consequence:** `simulation.js` gets `let currentSpeedMult = 1.0;` at module scope. On each `updateSim()` call, it lerps toward `marketState.simMultipliers.speed_mult`. `progressDelta`, `avgSpeed`, and `flowPct` all use `currentSpeedMult`.

---

### Q3: What lerp coefficient produces the right feel?

**Options:** (a) `0.015` per frame at ~60fps: reaches ~95% of target in ~200 frames (~3.3 seconds), (b) `0.03`: ~1.6 seconds, (c) `0.008`: ~6 seconds

**Decision:** Option (a) — `0.015`

**Rationale:** D01 drops speed_mult to 0.05 (near total halt). At 0.015, ships visibly slow over ~3 seconds — the audience sees the deceleration happen as a consequence of the weapon, which makes the causal chain legible. Too fast (0.03) feels like a glitch. Too slow (0.008) loses the moment.

**Consequence:** Each `updateSim()` call: `const targetMult = (typeof marketState !== 'undefined') ? (marketState.simMultipliers.speed_mult || 1.0) : 1.0;` then `currentSpeedMult += (targetMult - currentSpeedMult) * 0.015;`.

---

### Q4: Does `flowPct` need a floor when the lane is closed?

**Options:** (a) Use `currentSpeedMult` in the formula only, (b) Also clamp: if `hormuz_lane === 'closed'`, floor at a low value like 2% regardless of lerp state, (c) No floor

**Decision:** Option (a) — use `currentSpeedMult` in the formula only

**Rationale:** The lerp handles the transition. `hormuz_lane: 'closed'` drives `speed_mult` to 0.05, which through the lerp produces a flow near 3% at steady state. Adding an artificial floor creates divergence between what the formula reports and what the ships are physically doing. Trust the physics.

**Consequence:** `flowPct` formula becomes: `Math.min(100, Math.round((avgEffectiveSpeed / 15) * 100))` where `avgEffectiveSpeed = avg(v.speed) * currentSpeedMult`.

---

### Q5: What about `v.speed` display in the individual ship panel?

**Options:** (a) Show `v.speed * currentSpeedMult` as "current speed" in the panel, (b) Keep showing raw `v.speed` (the vessel's inherent speed), (c) Add a second "effective speed" row

**Decision:** Option (a) — show `v.speed * currentSpeedMult` as the displayed speed value in the ship panel

**Rationale:** A player opening a ship's panel during a blockade should see `0.7 kn` not `14 kn`. The effective speed IS what the ship is doing. The raw speed is an internal physics constant, not something the audience needs to see. One number is less confusing than two.

**Consequence:** `panel-ship.js` (or wherever speed is rendered in the ship panel) must multiply `v.speed` by `currentSpeedMult` when displaying. Since `currentSpeedMult` is in `simulation.js` scope and `panel-ship.js` is loaded later, it is accessible as a global.

---

### Q6: Does the random walk on `v.speed` need adjustment?

**Current:** `v.speed += (Math.random() - 0.5) * 0.05` and clamp to `[0.6×maxSpeed, 1.05×maxSpeed]` runs every frame.

**Decision:** No change

**Rationale:** The random walk on `v.speed` is the ship's "engine noise" — small variation around its rated speed. `currentSpeedMult` is the geopolitical multiplier applied on top. These are independent: a ship still varies its engine output slightly even during a blockade; its effective speed is just that small variation × 0.05. The composition is physically correct.

---

## Phase 5b Implementation Plan

### Step 1 — Add `currentSpeedMult` lerp variable to `js/simulation.js`

**Action:** Add after the `let playing, simSpeed, ...` declaration at line 4:

```js
let currentSpeedMult = 1.0;
```

**Visible change:** None — initial value matches SIM_DEFAULTS.

**If skipped:** Lerp has no state to persist between frames; speed change remains instant.

---

### Step 2 — Lerp `currentSpeedMult` toward target in `updateSim()`

**Action:** At the top of `updateSim()`, before the vessel loop, add:

```js
const targetMult = (typeof marketState !== 'undefined') ? (marketState.simMultipliers.speed_mult || 1.0) : 1.0;
currentSpeedMult += (targetMult - currentSpeedMult) * 0.015;
```

Replace the existing per-vessel `speedMult` read (lines 65–66) with a reference to the module-level `currentSpeedMult`:

```js
// Before (per-vessel read each iteration):
const speedMult = (typeof marketState !== 'undefined' && marketState.simMultipliers.speed_mult) || 1.0;
const effectiveSpeed = v.speed * speedMult;

// After (uses pre-computed lerped value):
const effectiveSpeed = v.speed * currentSpeedMult;
```

**Visible change:** Ships now decelerate gradually over ~3 seconds when D01 fires, rather than snapping to near-zero instantly.

**If skipped:** Speed change remains instant.

---

### Step 3 — Fix `avgSpeed` display in `updateStats()`

**Action:** Replace line 198:

```js
// Before:
document.getElementById('avgSpeed').textContent = (vessels.reduce((s,v)=>s+v.speed,0)/vessels.length).toFixed(1);

// After:
document.getElementById('avgSpeed').textContent = (vessels.reduce((s,v)=>s+v.speed,0)/vessels.length * currentSpeedMult).toFixed(1);
```

**Visible change:** The "Avg Kn" stat in the control panel now drops from ~14 to ~0.7 when D01 is active. This makes the weapon's physical consequence legible in the dashboard numbers.

**If skipped:** Avg Kn stays at ~14 regardless of weapons — a visible lie.

---

### Step 4 — Fix `flowPct` in `updateStats()`

**Action:** Replace line 207:

```js
// Before:
var flowPct = vessels.length ? Math.min(100, Math.round((vessels.reduce(function(s,v){return s+v.speed;},0) / vessels.length / 15) * 100)) : 0;

// After:
var flowPct = vessels.length ? Math.min(100, Math.round((vessels.reduce(function(s,v){return s+v.speed;},0) / vessels.length * currentSpeedMult / 15) * 100)) : 0;
```

**Visible change:** "HORMUZ FLOW XX%" in the status bar now tracks weapon state. With D01 active, it drops from ~85% to ~3%. This is the most visible indicator of the game state on the main projection — it must respond.

**If skipped:** HORMUZ FLOW stays at ~85% even during a full blockade — the primary visual indicator of strait disruption is broken.

---

### Step 5 — Fix speed display in ship panel (`js/panel-ship.js`)

**Action:** Find where `v.speed` is displayed in the ship detail panel (the "Speed" or "kn" field). Multiply by `currentSpeedMult`:

```js
// Wherever v.speed is formatted for display in the ship panel:
(v.speed * currentSpeedMult).toFixed(1) + ' kn'
```

**Visible change:** Opening a ship's panel during a blockade shows effective speed (~0.7 kn) instead of rated speed (~14 kn).

**If skipped:** Ship panel shows false speed; captain's view contradicts what the map shows.

---

### Step 6 — Tests in `tests/phase-05b-speed.html`

TDD slices:
1. After firing D01, `currentSpeedMult` is lerping toward 0.05 after 60 simulated frames (not there yet — lerp is gradual)
2. After 500 simulated frames with D01 active, `currentSpeedMult` is within 0.02 of 0.05
3. After D01 decays and is removed, `currentSpeedMult` lerps back toward 1.0
4. `flowPct` formula: at `currentSpeedMult = 0.05`, avg raw speed 14 → flowPct ≤ 5
5. `flowPct` formula: at `currentSpeedMult = 1.0`, avg raw speed 14 → flowPct ≈ 93

**Note:** These tests simulate the lerp by calling the lerp expression N times in a loop — no actual `requestAnimationFrame` needed.

---

## Implementation Record: Phase 5b — Ship Speed Responsiveness

**Date:** 2026-04-28
**Status:** PENDING — code written, visual behaviour not yet verified in browser

### What was written

| File | Change |
|---|---|
| `js/simulation.js` | Added `currentSpeedMult = 1.0` at module scope; added `_lerpSpeedMult(target)` and `_calcFlowPct(avgRawSpeed, mult)` helpers; lerp called at top of `updateSim()` each frame; `effectiveSpeed` now uses module-level `currentSpeedMult`; `avgSpeed` display multiplied by `currentSpeedMult`; `flowPct` rewritten to use `_calcFlowPct()` |
| `js/panel-ship.js` | Speed display uses `v.speed * currentSpeedMult`; ETA calculation uses effective speed with division-by-zero guard |
| `tests/phase-05b-speed.html` | 5 tests covering lerp convergence, recovery, flowPct formula at blockade and normal conditions, steady-state zero drift |

### Test results (tests/phase-05b-speed.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | `_lerpSpeedMult` converges to 0.05 from 1.0 after 500 steps | GREEN |
| 2 | `_lerpSpeedMult` recovers to 1.0 after switching target | GREEN |
| 3 | `_calcFlowPct(14, 0.05)` → ≤ 5 | GREEN |
| 4 | `_calcFlowPct(14, 1.0)` → 93 | GREEN |
| 5 | Steady state `_lerpSpeedMult(1.0)` from 1.0 — no drift | GREEN |

### What is unresolved

Visual behaviour in the browser has not been verified. Specifically:
- Ships visibly decelerating over ~3 seconds when D01 fires (lerp feel)
- "Avg Kn" stat dropping in the control panel
- "HORMUZ FLOW" in the status bar dropping to ~3% under D01
- Ship panel showing ~0.7 kn not ~14 kn during blockade

**To resolve:** Open `index.html`, fire D01 with key `1`, and confirm all four visual indicators respond correctly. Mark this complete once verified.

---

## Grill Report: Phase 5c — Live Activity Feed

**Date:** 2026-04-28
**Feature:** A scrolling real-time event feed showing weapon plays, round events, and prob milestones. Visible on the in-sim panel and on the market screen projection.

---

### Q1: Where does the feed live — index.html only, or also market_screen.html?

**Context:** `market_screen.html` is currently completely standalone with hardcoded dummy data. It has no connection to `marketState` in `index.html`.

**Options:** (a) index.html only — bottom-left `#activityFeed` panel, (b) Both — index.html panel + sync to market_screen.html via BroadcastChannel API, (c) market_screen.html only

**Decision:** Option (b) — both, via BroadcastChannel

**Rationale:** The audience watches the wall projection (market_screen.html), not the operator's simulation screen (index.html). If the feed is only on index.html, the audience never sees it. BroadcastChannel is the right tool — it's a browser API that lets two tabs on the same origin communicate with zero server infrastructure, zero WebSocket, zero localStorage polling. index.html posts events; market_screen.html listens and renders.

**Consequence:** `game-state.js` opens a `BroadcastChannel('hormuz-game')` and posts a snapshot message on every state change. `market_screen.html` opens the same channel and updates its UI on each message. This also live-connects `market_screen.html` to the real `prob`, `flowPct`, and round state — replacing the hardcoded dummy values.

---

### Q2: What events populate the feed?

**Options:** (a) Weapon fires only, (b) Weapon fires + round lifecycle events, (c) Weapon fires + round events + prob milestones + weapon decay notifications

**Decision:** Option (c) — all four event types

| Type | Example text | Trigger |
|---|---|---|
| `weapon` | `DISRUPTOR · D01 Strait Blockade +22% → 72%` | `fireWeapon()` |
| `round` | `ROUND 1 STARTED · prob reset to 50%` | `startRound()`, `endRound()`, `resetGame()` |
| `milestone` | `⚠ PROB CROSSED 65% — STRAIT CLOSING` | checked in `marketTick()` when prob crosses 65 or 35 |
| `decay` | `D01 decayed · prob returning` | when entry removed from activeWeapons in `marketTick()` |

**Rationale:** Weapon fires are the primary narrative. Round events frame the structure. Milestones are the most important audience signal (the 65% threshold is when the game tilts). Decay events explain why prob is coming back down. Together they form a complete play-by-play.

---

### Q3: Where does the feed data live?

**Options:** (a) Reuse `marketState.actionLog` — extend it with richer fields, (b) Separate `marketState.eventFeed` array, (c) Local DOM only — no persistent state

**Decision:** Option (b) — separate `marketState.eventFeed` array

**Rationale:** `actionLog` was designed as a weapon-fire audit log with a specific schema (`weaponId`, `delta`, `timestamp`). Changing its schema would break Phase 1–4 tests and the `updateDashboard()` function that reads from it. A separate `eventFeed` array holds richer events with a `type` field, `text` (display string), `color` (CSS class), and `timestamp`. The `actionLog` stays untouched.

**Consequence:** `marketState.eventFeed = []` added to `marketState` in `game-state.js`. New helper `addFeedEvent(type, text, color)` pushes to `eventFeed` and broadcasts via BroadcastChannel. `startRound()` does NOT clear `eventFeed` — the feed accumulates across all rounds for the full session narrative.

---

### Q4: How does the feed render on index.html?

**Options:** (a) Bottom-left fixed panel, always visible, (b) Collapsible panel with a toggle button, (c) Replace Zone 4 (Event Log) of `#gameDashboard`

**Decision:** Option (a) — new `#activityFeed` fixed panel, bottom-left of index.html

**Rationale:** `#gameDashboard` already occupies the right edge. The feed belongs on the left to frame the map. Fixed position ensures it's always visible without requiring operator interaction. Replacing `#gameDashboard` Zone 4 would lose the existing compact log view.

**Layout:**
```
┌────────────────────┐
│ FEED                │  ← header, 9px monospace, uppercase
├────────────────────┤
│ [T+0043] DISRUPTOR  │  ← newest on top
│  D01 Blockade +22%  │
│ [T+0042] ROUND 1    │
│  STARTED            │
│ ...                 │  ← scrolls when overflow
└────────────────────┘
```

Shows last 8 entries in the panel. Overflow is hidden (older entries scroll out). New entries prepend (slide in from top via CSS transition). CSS: `position: fixed; bottom: 40px; left: 10px; width: 260px; max-height: 280px; overflow: hidden`.

---

### Q5: How does market_screen.html receive live updates?

**Decision:** BroadcastChannel named `'hormuz-game'`. Message format:

```js
{
  type: 'state',           // always 'state' for full snapshots
  prob: marketState.prob,
  lane: marketState.simMultipliers.hormuz_lane,
  activeWeapons: [...weaponIds],
  round: { phase, number, scores, timer },
  feed: marketState.eventFeed.slice(-20)  // last 20 events
}
```

`market_screen.html` replaces its dummy `setInterval` update loop with a `channel.onmessage` handler that:
1. Updates the probability numbers (yes/no prices and charts)
2. Updates the ticker footer with live HORMUZ FLOW, vessel count, round state
3. Renders the `feed` array as a scrolling list in a new panel

---

### Q6: When does index.html broadcast?

**Options:** (a) Every `updateStats()` frame (~60fps) — too frequent, (b) On every `addFeedEvent()` call (weapon fires, round events, milestones), (c) On every `marketTick()` (every 20s) plus on every `addFeedEvent()`

**Decision:** Option (c) — broadcast on `marketTick()` AND on `addFeedEvent()`

**Rationale:** `marketTick()` keeps market_screen.html's probability chart updating every 20s even if no weapons are fired. `addFeedEvent()` ensures instantaneous updates when a weapon fires. ~60fps broadcast would generate enormous message volume for a cross-tab channel with no benefit.

---

### Q7: Where does `addFeedEvent()` get called from?

| Caller | Event |
|---|---|
| `fireWeapon()` in game-state.js | weapon fire event |
| `startRound()`, `endRound()`, `resetGame()` in round-controller.js | round lifecycle events |
| `marketTick()` in market-tick.js | decay events, milestone crossings |
| `endGameNow()` in round-controller.js | game-over event |

**Consequence:** `addFeedEvent()` must be defined in `game-state.js` (so it's available to all callers loaded after it). It pushes to `eventFeed`, caps the array at 100 entries (drop oldest), and calls the broadcast function if BroadcastChannel is available.

---

## Phase 5c Implementation Plan

### Step 1 — Add `eventFeed` and `addFeedEvent()` to `js/game-state.js`

**Action:** Add `eventFeed: []` to `marketState`. Add function:

```js
let _feedChannel = null;
try { _feedChannel = new BroadcastChannel('hormuz-game'); } catch(e) {}

function addFeedEvent(type, text, color) {
  const entry = { type, text, color: color || 'system', ts: Date.now(), tick: typeof simTickCount !== 'undefined' ? simTickCount : 0 };
  marketState.eventFeed.push(entry);
  if (marketState.eventFeed.length > 100) marketState.eventFeed.shift();
  if (typeof renderFeed === 'function') renderFeed();
  _broadcastState();
}

function _broadcastState() {
  if (!_feedChannel) return;
  const r = marketState.round;
  _feedChannel.postMessage({
    type: 'state',
    prob: marketState.prob,
    lane: marketState.simMultipliers.hormuz_lane || 'open',
    activeWeapons: marketState.activeWeapons.map(e => e.weaponId),
    round: { phase: r.phase, number: r.number, scores: r.scores },
    feed: marketState.eventFeed.slice(-20)
  });
}
```

**Visible change:** None until feed panel added.

---

### Step 2 — Call `addFeedEvent()` from all event sources

**Action:** Add calls in the following locations:

`js/game-state.js` — in `fireWeapon()` after `recomputeSimMultipliers()`:
```js
const sign = weapon.prob_delta >= 0 ? '+' : '';
addFeedEvent('weapon',
  weapon.player.toUpperCase() + ' · ' + id + ' ' + weapon.name + ' ' + sign + weapon.prob_delta + '% → ' + Math.round(marketState.prob) + '%',
  weapon.player === 'disruptor' ? 'disruptor' : 'defender'
);
```

`js/round-controller.js` — in `startRound()`, `endRound()`, `resetGame()`, `endGameNow()`:
```js
addFeedEvent('round', 'ROUND ' + marketState.round.number + ' STARTED · prob reset to 50%', 'system');
```

`js/market-tick.js` — after weapon removal:
```js
addFeedEvent('decay', entry.weaponId + ' decayed · prob returning', 'system');
```

`js/market-tick.js` — prob milestone check (run once per tick, after drift/clamp):
```js
// Track previous prob to detect crossings
const prevProb = marketState.prob before drift;
if (prevProb < 65 && marketState.prob >= 65) addFeedEvent('milestone', '⚠ PROB CROSSED 65% — STRAIT CLOSING', 'disruptor');
if (prevProb > 35 && marketState.prob <= 35) addFeedEvent('milestone', '✓ PROB CROSSED 35% — STRAIT STABLE', 'defender');
if (prevProb >= 65 && marketState.prob < 65) addFeedEvent('milestone', 'PROB BACK BELOW 65%', 'system');
```

Also call `_broadcastState()` at the end of `marketTick()`.

**Visible change:** None until feed panel added.

---

### Step 3 — Create `js/game-feed.js` with `renderFeed()`

**Action:** New file. Pure DOM writer — reads `marketState.eventFeed`, renders to `#activityFeed` panel. Newest entry on top. Color-coded rows.

```js
function renderFeed() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  const entries = marketState.eventFeed.slice(-8).reverse();
  el.innerHTML = entries.map(function(e) {
    const cls = 'feed-' + e.color;
    return '<div class="feed-row ' + cls + '">[' + String(e.tick).padStart(4,'0') + '] ' + e.text + '</div>';
  }).join('');
}
```

**Visible change:** None until div added to index.html.

---

### Step 4 — Add `#activityFeed` div and CSS to `index.html`

**Action:** Add `<div id="activityFeed"></div>` as a fixed bottom-left panel. Add CSS:

```css
#activityFeed {
  position: fixed; bottom: 40px; left: 10px;
  width: 280px; max-height: 280px; overflow: hidden;
  background: rgba(5,5,5,0.92); border: 1px solid #1a1a1a;
  font-family: 'IBM Plex Mono', monospace; font-size: 9px;
  color: #666; padding: 8px; z-index: 500;
}
.feed-row { padding: 2px 0; line-height: 1.5; border-bottom: 1px solid #0e0e0e; }
.feed-disruptor { color: #f87171; }
.feed-defender  { color: #60a5fa; }
.feed-system    { color: #4b5563; }
```

Add `<script src="js/game-feed.js">` after `game-dashboard.js` at Layer 1.5.

**Visible change:** Feed panel appears bottom-left. Populates as weapons fire and rounds progress.

---

### Step 5 — Connect `market_screen.html` to BroadcastChannel

**Action:** In `market_screen.html`'s `<script>` block, replace the hardcoded `setInterval` update with a BroadcastChannel listener:

```js
const gameChannel = new BroadcastChannel('hormuz-game');
gameChannel.onmessage = function(e) {
  const msg = e.data;
  if (msg.type !== 'state') return;
  // Update probability display
  const yes = Math.round(msg.prob);
  const no = 100 - yes;
  document.getElementById('yesPrice').textContent = yes + '¢';
  document.getElementById('noPrice').textContent  = no + '¢';
  document.getElementById('yesChance').textContent = yes + '% chance';
  document.getElementById('noChance').textContent  = no + '% chance';
  // Update ticker footer
  document.getElementById('tick4').textContent = 'PROB ' + yes + '% · LANE ' + msg.lane.toUpperCase();
  // Update round state footer
  document.getElementById('roundNum').textContent = msg.round.number || '—';
  // Render feed
  renderMarketFeed(msg.feed);
};
```

Add `renderMarketFeed(entries)` function that renders the last 12 feed entries in a new feed panel below the player tables.

**Visible change:** When both index.html and market_screen.html are open in the same browser, market_screen.html updates live as weapons fire.

**If only one tab is open:** BroadcastChannel silently has no listeners; no error. index.html works normally. market_screen.html shows its last received state.

---

### Step 6 — Tests in `tests/phase-05c-feed.html`

TDD slices:
1. `addFeedEvent('weapon', 'D01 +22%', 'disruptor')` — entry appears in `marketState.eventFeed`
2. `eventFeed` caps at 100 entries — adding 101st drops the oldest
3. `renderFeed()` produces one `.feed-row` per entry (up to 8)
4. `fireWeapon('D01')` — `eventFeed` gains one entry with `type: 'weapon'` and text containing `'D01'`
5. `addFeedEvent()` called 5 times — `renderFeed()` shows the 5 entries in reverse order (newest first)
6. `startRound()` adds a `type: 'round'` event to eventFeed

---

## Implementation Record: Phase 5c — Live Activity Feed

**Date:** —
**Status:** PENDING — not started. Deferred to implement after Phase 8.

---

## Implementation Record: Phase 6 — MKTS Panel UI

**Date:** —
**Status:** PENDING — not started. Defined in `issues/06-mkts-panel-ui.md`.

---

## Implementation Record: Phase 7 — market_screen.html Extension

**Date:** —
**Status:** PENDING — not started. Defined in `issues/07-market-screen-extension.md`. Phase 5c BroadcastChannel infrastructure must be in place first.

---

## Implementation Record: Subphase 1.1 — index.html broadcasts game state

**Date:** 2026-06-16
**Status:** Complete

### What was built

| File | Change |
|---|---|
| `js/game-broadcast.js` | New file — opens `BroadcastChannel('hormuz-game')`, exposes `broadcastGameState()` |
| `index.html` | Added `<script src="js/game-broadcast.js">` at Layer 1.5 after `game-dashboard.js` |
| `js/game-state.js` | Added `broadcastGameState()` call at tail of `fireWeapon()` |
| `js/market-tick.js` | Added `broadcastGameState()` call at tail of `marketTick()` |
| `js/round-controller.js` | Added `broadcastGameState()` call at tail of `startRound()`, `endRound()`, `pauseRound()`, `resumeRound()`, `endGameNow()`, `resetGame()` |

### Broadcast shape

```js
{
  shipProbability: Math.round(marketState.prob),   // 0–100 integer
  lane: marketState.simMultipliers.hormuz_lane,    // 'open' | 'closed'
  activeWeapons: [...weaponIds],                   // string[]
  round: { phase, number, scores }                 // from marketState.round
}
```

### Architecture note

`BroadcastChannel('hormuz-game')` is the outbound pipe from `index.html` to `market_screen.html` on the same machine. It is entirely separate from `BroadcastChannel('deepseas-game')` in `bootstrap.js`, which is the inbound pipe from `detector.html` carrying `{type:'FIRE_WEAPON', weaponId}`. The channel is opened once in `game-broadcast.js` and posts on every state change via the same `typeof X === 'function'` guard pattern already used by `updateDashboard()`.

### Key design decision

`broadcastGameState()` lives in a dedicated `js/game-broadcast.js` file (Layer 1.5) rather than inside `game-state.js`, mirroring the `game-dashboard.js` precedent: dedicated file, pure function, never mutates state.

---

## Implementation Record: Subphase 1.2 — market_screen.html listens, drops dummy data

**Date:** 2026-06-16
**Status:** Complete — all behaviors verified in browser

### What was built

| File | Change |
|---|---|
| `market_screen.html` | Added `BroadcastChannel('hormuz-game')` listener; removed drift logic from `tick()`; removed fake `simTick++`/`totalVol` increments and `roundSec` countdown; added `.player-table { display: none }`; set `tick3` to static `SIM TICK —` |
| `tests/subphase-1-2-listener.html` | New — verification page that fires synthetic broadcast messages and shows expected values for `market_screen.html` to match |

### Channel listener (added to market_screen.html)

```js
const hormuzChannel = new BroadcastChannel('hormuz-game');
hormuzChannel.onmessage = function(e) {
  const msg = e.data;
  yesProb = (100 - msg.shipProbability) / 100;
  document.getElementById('tick4').textContent =
    'LANE ' + msg.lane.toUpperCase() + ' · SHIP PROB ' + msg.shipProbability + '%';
  document.getElementById('roundNum').textContent = msg.round.number || '—';
  document.getElementById('roundTimer').textContent = msg.round.phase.toUpperCase();
};
```

### YES/NO semantics

Contract question: "When will traffic at the Strait of Hormuz return to normal?"
- YES = open/normal = `(100 − shipProbability)¢`
- NO = disrupted/closed = `shipProbability¢`

D01 fires (prob 50→72): YES drops to 28¢, NO jumps to 72¢. Disruptor fires → NO price jumps. Legible to audience.

### tick() loop after changes

`setInterval(tick, 160)` stays for smooth chart animation. `tick()` now only: pushes current `yesProb` to history, redraws charts, updates price displays. No drift, no random walk. `yesProb` is written exclusively by the channel listener.

### What's still fake/static in market_screen.html

| Element | Status | Reason |
|---|---|---|
| `tick1` — HORMUZ FLOW | Static string | Not in broadcast; lives in simulation.js |
| `tick2` — VESSELS | Static string | Not in broadcast |
| `tick3` — SIM TICK | Static `SIM TICK —` | Removed fake increment |
| YES/NO player tables | Hidden | Placeholder — real audience data arrives in Subphase 2.2/2.3 |
| `totalVol` | Static `$1,503,164` | Removed fake increment |

---

## Implementation Record: Subphase 2.1 — Node + Express + WebSocket server

**Date:** 2026-06-16
**Status:** Complete — 20 tests, all GREEN

### What was built

| File | Change |
|---|---|
| `.gitignore` | New — excludes `node_modules/` and `.env` |
| `package.json` | New — `"start": "node server.js"`, dependencies `express` and `ws` |
| `server.js` | New — full audience betting server |
| `tests/subphase-2-1-server.js` | New — 7 behaviors, 20 assertions, all GREEN |

### Server state

```js
{
  marketPrice: 0.5,     // betsOpen / (betsOpen + betsClosed); 0.5 when no bets
  betsOpen: 0,          // cumulative within a round
  betsClosed: 0,
  connectedCount: 0     // live WebSocket connections
}
```

### Endpoints

| Method | Path | What it does |
|---|---|---|
| `GET` | `/healthz` | Returns `{ status: 'ok' }` |
| `POST` | `/bet` | `{ side: 'open'\|'closed' }` — increments counter, recomputes `marketPrice`, broadcasts, returns full state |
| `POST` | `/reset` | Zeros `betsOpen`/`betsClosed`, resets `marketPrice` to 0.5, broadcasts |
| `WS` | `/` | On connect: sends current state. On close: decrements `connectedCount` |
| Static | `/*` | `express.static('.')` — serves entire repo root including `audience.html` |

### Key design decisions

- **Bet transport**: REST POST for placing bets, WebSocket for receiving broadcasts. Clean separation: HTTP for commands, WS for subscriptions.
- **Port**: `process.env.PORT ?? 3000` — Render-ready with no extra work.
- **Per-round reset**: `POST /reset` is explicit, operator-controlled. Called between rounds. Each round's audience bet is a fresh independent signal.
- **Static serving**: `express.static('.')` at repo root — phones on venue WiFi reach `audience.html` at `http://[laptop-ip]:3000/audience.html`. Same path works on Render.
- **CORS**: `Access-Control-Allow-Origin: *` on all routes — required when `market_screen.html` or `index.html` are served from `file://`.

### marketPrice formula

```js
state.marketPrice = total === 0 ? 0.5 : state.betsOpen / total;
```

Division-by-zero guard: returns 0.5 (neutral) when no bets placed. `betsOpen` counts OPEN bets (Hormuz stays open), `betsClosed` counts CLOSED bets (Hormuz disrupted). Higher `marketPrice` = more audience members betting OPEN.

### Test results (tests/subphase-2-1-server.js)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | `GET /healthz` → `{status:'ok'}` | GREEN |
| 2 | `POST /bet side=open` × 3 → `betsOpen=3`, `marketPrice>0.5` | GREEN |
| 3 | `POST /bet side=closed` → `betsClosed=1`, `marketPrice=0` | GREEN |
| 4 | After reset, fresh bet recalculates from zero | GREEN |
| 5 | `POST /reset` → `marketPrice=0.5`, `betsOpen=0`, `betsClosed=0` | GREEN |
| 6 | WS connect → broadcast received with `marketPrice`, `betsOpen`, `connectedCount` | GREEN |
| 7 | `POST /bet` → WS clients receive broadcast immediately | GREEN |

---

## Implementation Record: Subphase 2.2 — audience.html (mobile betting UI)

**Date:** 2026-06-17
**Status:** Complete — 13 assertions, all GREEN

### What was built

| File | Change |
|---|---|
| `audience.html` | New — mobile-first betting UI served by `server.js` |
| `tests/subphase-2-2-audience.html` | New — 5 slices, 13 assertions, all GREEN |

### audience.html layout

Three vertically-stacked sections filling `100dvh`:

| Section | Element | Detail |
|---|---|---|
| Top | `.question` | "Will the Strait of Hormuz remain open?" — 11px, dimmed, uppercase |
| Middle | `#price` | Current market price in cents (e.g. `50¢`) — 72px, green flash on WS update |
| Bottom | `#btnOpen` + `#btnClosed` | 64px min-height buttons; green / red border+text, dark fill on flash |

### Bet flow

1. User taps OPEN or CLOSED button
2. `placeBet(side)` fires: adds `.flash` class to button (removes after 300ms), calls `POST /bet { side }`
3. Server updates `marketPrice`, broadcasts via WebSocket to all connected clients
4. `ws.onmessage` on every `audience.html` tab updates `#price` and flashes green for 400ms

### Key design decisions

- **Relative URLs throughout**: `fetch('/bet')` and `ws://location.host` — work on `localhost:3000`, venue LAN IP, and Render with zero config. No `js/config.js` needed.
- **Unlimited bets**: No per-session tracking. Every tap is a fresh OPEN or CLOSED signal. Matches how real prediction markets allow continuous trading.
- **Minimal UI**: Only the price and two buttons. All collective stats (total volume, round #, bet breakdown) live on `market_screen.html` wall projection where the room can see them.
- **Dark theme** (`#0a0a0a`): Keeps phone screens from blinding the audience in a darkened demo room.
- **Button text**: Rendered as literal `OPEN` / `CLOSED` in HTML (not CSS `text-transform`) so test assertions on the raw HTML string pass without DOM parsing.
- **Auto-reconnect**: `ws.onclose` reloads the page after 2 s — handles server restarts between rounds invisibly.

### YES/NO semantics

`marketPrice` = `betsOpen / (betsOpen + betsClosed)` = probability Hormuz stays OPEN.

- OPEN bet → pushes `marketPrice` up → price shown as `marketPrice × 100 ¢`
- CLOSED bet → pushes `marketPrice` down
- Guard: `marketPrice = 0.5` when no bets placed

### Test results (tests/subphase-2-2-audience.html)

| Slice | Behaviour | Result |
|---|---|---|
| 1 | `POST /bet {side:'open'}` returns 200 with numeric `marketPrice` and `betsOpen=1` | GREEN |
| 2 | WS opens, receives initial state on connect, receives broadcast after `POST /bet` | GREEN |
| 3 | `GET /audience.html` returns 200; HTML contains `OPEN`, `CLOSED`, `id="price"` | GREEN |
| 4 | Flash class added to button on `placeBet()`, removed after 300 ms | GREEN |
| 5 | `#price` DOM element renders `Math.round(marketPrice × 100) + '¢'` correctly | GREEN |

---

## Grill Report: Subphase 2.3 — market_screen.html gains marketPrice

### Q1: Where on market_screen.html does audience marketPrice live?

**Options:** (a) Replace `totalVol` in header-right with `AUDIENCE 50¢`, (b) Add a full-width strip between header and main grid showing marketPrice + vote counts, (c) Use `tick1` in the footer ticker
**Decision:** Option (a) — header-right replaces the static `totalVol` slot
**Rationale:** Minimal — one number always in frame without adding new DOM structure or visual weight.
**Consequence:** `id="totalVol"` and its `VOL` label are replaced; `betsOpen`/`betsClosed`/`connectedCount` not displayed.

### Q2: What does the header-right slot show?

**Options:** (a) Label + price only — `AUDIENCE 50¢`, (b) Label + price + vote counts — `AUDIENCE 50¢ · 12 open · 8 closed`, (c) Label + price + connected count
**Decision:** Option (a) — `AUDIENCE 50¢` only
**Rationale:** User explicitly wants minimal; vote counts and connected count are operational details visible on audience.html.
**Consequence:** Only `marketPrice` is rendered from the WS broadcast; `betsOpen`, `betsClosed`, `connectedCount` are received but ignored in the DOM.

### Q3: What is the WebSocket URL?

**Options:** (a) Hardcode `ws://localhost:3000`, (b) Derive from `location.host` (breaks on `file://`), (c) Guard — try `location.host`, fall back to `localhost:3000`
**Decision:** Option (a) — hardcode `ws://localhost:3000`
**Rationale:** Roadmap explicitly defers URL config to Part 3 / Subphase 3.1; hardcoding is honest about that deferral.
**Consequence:** Part 3 replaces this with `js/config.js` + `SERVER_URL`; no other code changes needed here.

### Q4: What happens when the WebSocket drops or server isn't running?

**Options:** (a) Silent — hold last value (or `50¢` default), no error shown, (b) Show `AUDIENCE —` in the label when disconnected, (c) Auto-reconnect loop with visible status
**Decision:** Option (a) — silent, hold last value
**Rationale:** Error states on a projector wall are embarrassing; the BroadcastChannel game data keeps working regardless; stale `50¢` is unobtrusive.
**Consequence:** No reconnect logic needed; `ws.onclose` and `ws.onerror` are omitted or left empty.

### Q5: Does audience marketPrice ever influence yesProb or the charts?

**Options:** (a) Display-only — WS handler updates one DOM element only, `yesProb` never written by WS handler, (b) Blend — `yesProb` becomes weighted average of game signal and audience signal, (c) Toggle — operator switches chart between game-driven and audience-driven
**Decision:** Option (a) — display-only, strict separation
**Rationale:** Roadmap is explicit: "never numerically merged." The thesis point is two independent signals side by side; blending destroys the meaning of both numbers.
**Consequence:** `yesProb` is owned exclusively by the BroadcastChannel listener; the WS handler touches only the header `AUDIENCE` display element.

### Q6: What does the display show before the first WS message arrives?

**Options:** (a) Always `AUDIENCE 50¢` — server default is 0.5 so this is accurate, (b) `AUDIENCE —` until first broadcast, then switches, (c) `AUDIENCE 50¢` dimmed until first bet placed
**Decision:** Option (a) — always `AUDIENCE 50¢`
**Rationale:** `50¢` is the honest server default (guard in `recompute()`); no state logic needed; operator and room understand context.
**Consequence:** DOM element initialised with `50¢` in HTML; WS handler overwrites on first message.

### Q7: What does the test look like?

**Options:** (a) Node script only — connects WS, fires `POST /bet`, confirms broadcast shape, (b) Browser HTML test page mirroring 2.2 pattern, (c) Both Node + browser
**Decision:** Option (a) — Node script only
**Rationale:** WS data layer already tested in 2.1 and 2.2; the only new thing is wiring one DOM element, faster verified by opening market_screen.html in a tab.
**Consequence:** `tests/subphase-2-3-market-ws.js` is a lightweight Node script; no new browser test page.

---

## Implementation Plan: Subphase 2.3

### Step 1 — Replace totalVol slot in market_screen.html header

**Action:** In `market_screen.html`, replace `VOL <span id="totalVol">$1,503,164</span>` with `AUDIENCE <span id="audiencePrice">50¢</span>`
**Visible change:** Header-right shows `AUDIENCE 50¢` (static until WS connects).
**If skipped:** No display slot for the audience price.

### Step 2 — Add WebSocket connection to server.js in market_screen.html

**Action:** In `market_screen.html` `<script>`, add after the BroadcastChannel block — `const audienceWs = new WebSocket('ws://localhost:3000')` with `onmessage` handler that writes `Math.round(msg.marketPrice * 100) + '¢'` to `#audiencePrice`. No `onerror`/`onclose` handlers (silent failure by design).
**Visible change:** `AUDIENCE` number in the header updates live when phones place bets.
**If skipped:** Header stays static at `50¢` forever.

### Step 3 — Write tests/subphase-2-3-market-ws.js

**Action:** Node script — reset server, open WS, confirm initial broadcast has `marketPrice`/`betsOpen`/`connectedCount`, fire `POST /bet`, confirm second broadcast has updated `marketPrice`.
**Visible change:** None — terminal output only.
**If skipped:** No automated verification that the WS feed the DOM wires into is correct.

---

## Implementation Record: Subphase 2.3 — market_screen.html gains marketPrice

**Date:** 2026-06-17
**Status:** Complete — 5 tests GREEN, live demo verified

### What was built

| File | Change |
|---|---|
| `market_screen.html` | Header-right: replaced static `VOL $1,503,164` with `AUDIENCE <span id="audiencePrice">50¢</span>` |
| `market_screen.html` | Added `audienceWs` WebSocket block before the BroadcastChannel listener |
| `tests/subphase-2-3-market-ws.js` | New — Node script, 5 assertions, all GREEN |

### DOM change

```html
<!-- Before -->
<div class="vol-label">VOL <span id="totalVol">$1,503,164</span></div>

<!-- After -->
<div class="vol-label">AUDIENCE <span id="audiencePrice">50¢</span></div>
```

### WebSocket block added to market_screen.html

```js
const audienceWs = new WebSocket('ws://localhost:3000');
audienceWs.onmessage = function(e) {
  const msg = JSON.parse(e.data);
  document.getElementById('audiencePrice').textContent =
    Math.round(msg.marketPrice * 100) + '¢';
};
```

### Key design decisions

- **Display-only**: `audienceWs.onmessage` touches only `#audiencePrice`. `yesProb` and the YES/NO charts are exclusively owned by the BroadcastChannel game listener — the two signals are strictly separated.
- **Silent on disconnect**: No `onerror`/`onclose` handlers. Error states on a projector wall are worse than a stale number.
- **Hardcoded `ws://localhost:3000`**: Part 3 (Subphase 3.1) replaces this with `js/config.js` + `SERVER_URL`.

### Test results (tests/subphase-2-3-market-ws.js)

| Assertion | Behaviour | Result |
|---|---|---|
| s1a | WS connects to `ws://localhost:3000` | GREEN |
| s1b | Initial broadcast has numeric `marketPrice` | GREEN |
| s1c | Initial broadcast has numeric `betsOpen` | GREEN |
| s1d | Initial broadcast has numeric `connectedCount` | GREEN |
| s2a | After `POST /bet {side:'open'}`, second broadcast has `marketPrice > 0.5` | GREEN |

### Live demo verified

`market_screen.html` and `audience.html` open in two tabs. Tapping OPEN/CLOSED on the audience page visibly updated the `AUDIENCE` number in the top-right corner of the market screen within one broadcast cycle. `yesProb` and the YES/NO charts did not move.

---

## Grill Report: Subphase 2.4 — local end-to-end test

### Q1: Does Subphase 2.4 produce any new files?

**Options:** (a) Purely manual verification — open tabs, run checklist, mark done. No new files, (b) Node script automating the bet→broadcast→price check, (c) Full automated end-to-end test covering both bet flow and isolation
**Decision:** Option (a) — purely manual
**Rationale:** Data-layer automation was already done in 2.1–2.3; what 2.4 checks is live visual integration across browser tabs, which is inherently manual.
**Consequence:** No new files. Subphase closes on completion of the manual checklist.

### Q2: How is shipProbability isolation verified?

**Options:** (a) Code inspection — read both data flows, confirm no shared path, document as verification, (b) Live browser check — three tabs, place bet, watch chart prices don't move, (c) Both
**Decision:** Option (a) — code inspection only
**Rationale:** The isolation is structural: `audienceWs.onmessage` and `hormuzChannel.onmessage` write to entirely different variables and DOM elements; a live chart animation makes "did it move?" ambiguous anyway.
**Consequence:** Isolation verified by reading `market_screen.html` — `yesProb` has exactly 2 write sites (init + BroadcastChannel listener), `audiencePrice` has exactly 1 write site (audience WS handler). No overlap.

---

## Implementation Record: Subphase 2.4 — local end-to-end verification

**Date:** 2026-06-17
**Status:** Complete — all acceptance criteria met

### Verification checklist

| Check | Method | Result |
|---|---|---|
| `server.js` running on port 3000 | `GET /healthz` → `{status:'ok'}` | PASS |
| Bet on `audience.html` moves `AUDIENCE` price on `market_screen.html` | Live demo (2.3) — tapped OPEN/CLOSED, number updated within one broadcast | PASS |
| `shipProbability` / `yesProb` untouched by audience bet | Code inspection — `yesProb` written only at init and `hormuzChannel.onmessage` (line 274); `audiencePrice` written only at `audienceWs.onmessage` (line 264) | PASS |

### Isolation proof (market_screen.html)

```
yesProb write sites:     line 258 (init), line 274 (hormuzChannel.onmessage)
audiencePrice write sites: line 264 (audienceWs.onmessage)
Shared write sites:      NONE
```

Two completely independent data flows, two completely independent display slots. Part 2 is complete.

---

## Grill Report: Subphase 3.1 — deploy-readiness code

### Q1: Does audience.html need js/config.js?

**Options:** (a) No — leave untouched, relative URLs already work everywhere, (b) Yes — update it to match the config pattern, (c) Update only if a concrete failure case exists
**Decision:** Option (a) — audience.html untouched
**Rationale:** `fetch('/bet')` and `ws://location.host` are relative to the serving origin, which works identically on localhost, LAN, and Render — adding config introduces a failure mode that doesn't exist today.
**Consequence:** Only `market_screen.html` reads from `js/config.js`; `audience.html` requires zero changes for deploy.

### Q2: What does SERVER_URL look like in js/config.js?

**Options:** (a) Full HTTP URL — `'http://localhost:3000'`, WS derived via `.replace(/^http/, 'ws')`, (b) Just the host — `'localhost:3000'`, WS built as `'ws://' + SERVER_URL`
**Decision:** Option (a) — full HTTP URL
**Rationale:** The full URL contains the protocol, so swapping `http` → `ws` and `https` → `wss` is one `.replace()` call; a bare host cannot self-select the right WS protocol after deploy.
**Consequence:** After deploy, replacing `http://localhost:3000` with `https://your-app.onrender.com` automatically yields `wss://` — no extra logic needed anywhere.

### Q3: How does market_screen.html load js/config.js?

**Options:** (a) Plain `<script src="js/config.js">` before the main script block — global `const SERVER_URL`, (b) ES module import — requires `type="module"`, breaks `file://` in some browsers
**Decision:** Option (a) — plain script tag
**Rationale:** Matches how all other JS files are loaded in this project; works on both `file://` and Express-served contexts.
**Consequence:** `SERVER_URL` is a global variable available to the inline script block in `market_screen.html`.

---

## Implementation Plan: Subphase 3.1

### Step 1 — Create js/config.js

**Action:** New file with one line: `const SERVER_URL = 'http://localhost:3000'; // REPLACE AFTER DEPLOY`
**Visible change:** None — data layer only.
**If skipped:** market_screen.html has no config to read; WS URL stays hardcoded.

### Step 2 — Add script tag to market_screen.html

**Action:** Add `<script src="js/config.js"></script>` in the `<head>` before any other scripts.
**Visible change:** None — data layer only.
**If skipped:** `SERVER_URL` is undefined; the WS block throws a ReferenceError.

### Step 3 — Replace hardcoded ws://localhost:3000 in market_screen.html

**Action:** Replace `new WebSocket('ws://localhost:3000')` with `new WebSocket(SERVER_URL.replace(/^http/, 'ws'))`.
**Visible change:** None locally (behavior identical). After deploy: connects to `wss://` Render URL instead of localhost.
**If skipped:** market_screen.html cannot reach the Render server after deploy.

### Step 4 — Create render.yaml at repo root

**Action:** New file declaring a Node web service: build command `npm install`, start command `npm start`, health check path `/healthz`.
**Visible change:** None locally.
**If skipped:** Render cannot auto-detect the build/start commands; manual config required on the Render dashboard.

### Step 5 — Regression test

**Action:** Re-run `node tests/subphase-2-3-market-ws.js` with SERVER_URL still pointing at localhost. All 5 assertions must stay GREEN.
**Visible change:** Terminal output — 5 passed, 0 failed.
**If skipped:** No confirmation that the config change didn't break the local WS connection.

---

## Implementation Record: Subphase 3.1 — deploy-readiness code

**Date:** 2026-06-17
**Status:** Complete — 5 regression tests GREEN, no behavior change locally

### What was built

| File | Change |
|---|---|
| `js/config.js` | New — `const SERVER_URL = 'http://localhost:3000'; // REPLACE AFTER DEPLOY` |
| `market_screen.html` | Added `<script src="js/config.js">` in `<head>` |
| `market_screen.html` | `new WebSocket('ws://localhost:3000')` → `new WebSocket(SERVER_URL.replace(/^http/, 'ws'))` |
| `render.yaml` | New — Render Node web service definition |
| `audience.html` | Untouched — relative URLs already work everywhere |

### render.yaml

```yaml
services:
  - type: web
    name: deep-seas
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /healthz
```

### WS protocol derivation

```js
SERVER_URL.replace(/^http/, 'ws')
// 'http://localhost:3000'           → 'ws://localhost:3000'
// 'https://deep-seas.onrender.com'  → 'wss://deep-seas.onrender.com'
```

### Regression results (tests/subphase-2-3-market-ws.js)

5 passed, 0 failed — identical before and after the config change.

---

## Subphase 3.4 — Implementation Record

**Date:** 2026-06-17
**Commit:** b48b852

### Change made

`js/config.js` — one line updated:

```js
// before
const SERVER_URL = 'http://localhost:3000'; // REPLACE AFTER DEPLOY

// after
const SERVER_URL = 'https://deep-seas-main-01.onrender.com';
```

### Effect

- `market_screen.html` WebSocket now connects to `wss://deep-seas-main-01.onrender.com` (the `replace(/^http/, 'ws')` pattern converts `https://` → `wss://` automatically)
- `audience.html` is unaffected — it uses relative URLs (`/bet`, `ws://location.host`) served by the same Render instance

### Verification (Subphase 3.5 — HUMAN)

- Phone on cellular, laptop on WiFi
- Open `audience.html` at `https://deep-seas-main-01.onrender.com/audience.html`
- Tap OPEN or CLOSED
- Confirm AUDIENCE price updates on `market_screen.html`
- Confirm YES/NO price (yesProb from BroadcastChannel) is unaffected by the tap

---

## Subphase 3.6 — Grill Report: Audience Bets Influence Market Probability

**Date:** 2026-06-17

### Q1: What role should the audience play in the probability?

**Options:** (a) Blend — 70% game × 30% audience, (b) Replace — audience ratio becomes yesProb entirely, (c) Delta/nudge — audience adds ±offset to game probability
**Decision:** Option A — 70/30 blend: `displayProb = 0.7 × gameProb + 0.3 × audiencePrice`
**Rationale:** Game stays in control so players see their decisions matter, but audience visibly moves the YES/NO prices in real time.
**Consequence:** Both signals must be stored as separate variables in market_screen.html; `yesProb` (game) and `audienceMarketPrice` (bets) are combined only at render time inside `tick()`.

---

### Q2: What does "total investment" mean?

**Options:** (a) Show raw bet counts (OPEN 8 · CLOSED 4), (b) Simulate dollar amount ($100 per tap), (c) Show participant count (connectedCount)
**Decision:** Option B — simulate dollars: `totalInvested = (betsOpen + betsClosed) × $100`
**Rationale:** Looks like a real prediction market with zero new server logic — betsOpen and betsClosed already come in every WebSocket message.
**Consequence:** The value is pure theater; no real money tracked. betsOpen + betsClosed already in server payload so no server.js changes needed.

---

### Q3: Where does total investment display?

**Options:** (a) Footer ticker as VOL $1,200, (b) Header next to AUDIENCE — `AUDIENCE 53¢ · $1,200`, (c) New line below YES/NO prices per side
**Decision:** Option B — header: `AUDIENCE 53¢ · $1,200`
**Rationale:** Keeps all audience-related data (price + investment) in one place at the top of the screen.
**Consequence:** Header HTML needs a second span `totalInvested`; both are updated together inside `audienceWs.onmessage`.

---

### Q4: Does the blend live only on market_screen.html or does index.html also see it?

**Options:** (a) Visual only on market_screen — index.html untouched, (b) index.html also shows blended prob via WS, (c) Separate operator-only number
**Decision:** Option A — visual only on market_screen.html
**Rationale:** index.html is the game controller; showing crowd noise there would confuse the player.
**Consequence:** Zero changes to BroadcastChannel protocol, index.html, or server.js. All logic is confined to market_screen.html.

---

## Subphase 3.6 — Implementation Plan

### Step 1 — Add `totalInvested` span to header HTML (`market_screen.html`)
- **Action:** Change `<div class="vol-label">AUDIENCE <span id="audiencePrice">50¢</span></div>` to include `· <span id="totalInvested">$0</span>`
- **Visible:** Header now reads `AUDIENCE 50¢ · $0`
- **Breaks if skipped:** JS update will throw `getElementById('totalInvested') is null`

### Step 2 — Add `audienceMarketPrice` state variable (`market_screen.html`)
- **Action:** Add `let audienceMarketPrice = 0.5;` alongside `let yesProb = 0.51;` in the STATE block
- **Visible:** None — data layer only
- **Breaks if skipped:** `tick()` blend formula references an undefined variable

### Step 3 — Update `audienceWs.onmessage` to store price and compute dollars (`market_screen.html`)
- **Action:** Store `audienceMarketPrice = msg.marketPrice`, compute `(msg.betsOpen + msg.betsClosed) * 100`, update both `audiencePrice` and `totalInvested` spans
- **Visible:** Header AUDIENCE cents + dollar amount both update on each bet
- **Breaks if skipped:** `audienceMarketPrice` stays 0.5 forever; header shows stale $0

### Step 4 — Replace `yesProb` with `displayProb` inside `tick()` (`market_screen.html`)
- **Action:** At top of `tick()` compute `const displayProb = 0.7 * yesProb + 0.3 * audienceMarketPrice;` and use `displayProb` everywhere `yesProb` was used for price display, chart history push, and P&L calc
- **Visible:** YES/NO cent prices and charts now reflect blended value — audience bets visibly move the big numbers
- **Breaks if skipped:** Audience bets have no effect on YES/NO display (current behavior)

---

## Subphase 3.6 — Implementation Record

**Date:** 2026-06-17
**Commit:** 568abae
**Tests:** 17 passed, 0 failed (`tests/subphase-3-6-blend.html`)

### Changes made

**`market_screen.html`** — 4 edits:

1. Header HTML: `AUDIENCE <span id="audiencePrice">50¢</span> · <span id="totalInvested">$0</span>`
2. State block: added `let audienceMarketPrice = 0.5;`
3. `audienceWs.onmessage`: stores `audienceMarketPrice = msg.marketPrice`, computes `(betsOpen + betsClosed) * 100`, updates both header spans
4. `tick()`: computes `const displayProb = 0.7 * yesProb + 0.3 * audienceMarketPrice` and uses `displayProb` for all price display, chart history, and P&L

**`tests/subphase-3-6-blend.html`** — NEW, 17 assertions across 4 slices:
- Slice 1: blend formula (5 assertions)
- Slice 2: dollar calc (4 assertions)
- Slice 3: header DOM update (3 assertions)
- Slice 4: YES/NO display (5 assertions)

### Behavior after this subphase

- Audience tapping OPEN/CLOSED → AUDIENCE cents + dollar amount update in header
- YES/NO big prices = 70% game state + 30% audience bet ratio
- Game player in index.html is unaffected — yesProb still set by BroadcastChannel only
- Render will pick up the changes on next deploy (auto-deploys from main branch)

---

## Subphase 3.6b — Implementation Record: Per-Side Invested Display

**Date:** 2026-06-17
**Commit:** 584c179
**Tests:** 22 passed, 0 failed (`tests/subphase-3-6-blend.html`)

### Changes made

**`market_screen.html`:**
- Added `<div class="side-sub" id="yesInvested">$0</div>` under YES side price
- Added `<div class="side-sub" id="noInvested">$0</div>` under NO side price
- `audienceWs.onmessage` now updates both: `betsOpen × $100 → yesInvested`, `betsClosed × $100 → noInvested`

**`tests/subphase-3-6-blend.html`:**
- Added Slice 5 (5 assertions): per-side dollar amounts, sum integrity, zero state

---

## Pre-Phase 1b — Grill Report: Ship Routing Visual Quality

**Date:** 2026-06-18
**Tests:** 11/11 passed (`tests/pre-phase-01-routing.html`)
**File modified:** `js/config-data.js` — `SHIPPING_LANES` constant rewritten

### Q1: Is the current routing quality sufficient for the show, or does it need more refinement?

**Options:** (a) Accept current routing — 11/11 tests green, routes visually smooth, (b) Add more waypoints to further smooth curves, (c) Switch to a spline/curve interpolation library

**Decision:** Option (a) — accept current routing after the +5 intermediate waypoints added this session

**Rationale:** Tests confirm no waypoints land in exclusion zones, no consecutive gap > 1.2°; the dense arc approach (25-30 waypoints per lane) prevents straight-line interpolation from cutting through coastal features. Visual quality is sufficient for a thesis demo projection at show distance.

**Consequence:** Routing is locked. Future sessions should not modify `SHIPPING_LANES` unless a specific visual defect is identified and reported.

---

### Q2: Should inbound and outbound lanes be visually separated (collision/separation enforcement)?

**Options:** (a) No — the TSS polyline overlays already show lanes as distinct colors; jitter naturally offsets individual ships, (b) Yes — enforce a minimum lat offset between lanes in the narrows, (c) Yes — use a lateral offset constant applied at render time

**Decision:** Option (a) — no additional separation logic needed

**Rationale:** The real Hormuz TSS has inbound (south/Oman) and outbound (north/Iran) lanes separated by ~10 nautical miles. The waypoints already encode this separation: inbound sits at lat ~26.47-26.48 through the narrows, outbound at lat ~26.52-26.55. Jitter (strait: 0.008°) keeps ships within their respective lanes without overlap.

**Consequence:** No lane-separation code added. If two ships visually cross, it's a jitter edge case acceptable for the demo context.

---

### Implementation record

**Iteration 1 (initial fix):** Changed `inbound[2]` from `[24.3, 58.5]` to `[23.9, 59.0]`; replaced outbound tail waypoints to close spacing > 1.2°. Test 3 failure resolved. 10/11 → 11/11 before redesign.

**Iteration 2 (major redesign):** Rewrote both lanes from ~12 waypoints to ~25-27 waypoints each. Core insight: exclusion zone tests check waypoint positions only — straight-line interpolation between widely-spaced waypoints still crosses land. Solution: dense waypoints with tight spacing (0.1-0.2°) in the Musandam approach arc and narrows transition zones. Inbound arc staged through `[26.42, 56.58]` (lat > 26.4 before entering lng < 56.55). Outbound threaded `[26.48, 56.28]` (lat < 26.5) then `[26.52, 56.35]` (lng > 56.3 permits lat > 26.5).

**Iteration 3 (+5 intermediate waypoints):** Added 2 waypoints to inbound approach arc (`[25.57, 56.93]`, `[25.72, 56.77]`), 1 to inbound narrows exit (`[26.32, 55.9]`), 2 to outbound descent (`[26.3, 56.9]`, `[26.1, 57.12]`). Final count: inbound 30 waypoints, outbound 26 waypoints. 11/11 confirmed.

**Iteration 4 (Qeshm narrows fix):** Outbound narrows at lat 26.52–26.55 were visually on Qeshm Island (south coast ~lat 26.5 extends to lng 56.9, not 56.3 as the test assumed). Fixed by dropping narrows to lat 26.42–26.43. Expanded Qeshm bbox in test from lngMax 56.3 → 56.9. 11/11 confirmed.

**Iteration 5 (Iranian coast / Bandar-e Jask fix):** Added T12 (RED) — piecewise Iranian coast corridor constraint for outbound waypoints east of lng 56.9. Test exposed 6 waypoints above the corridor (lat 25.1–26.2 at lng 57.0–58.1). Fixed by replacing the outbound Gulf of Oman descent with a steeper southward path staying ~0.4° below the Iranian coast. 12/12 confirmed.

---

## market_screen.html — Two-Layer Separation (Unblend)

**Date:** 2026-06-18
**Tests:** 22/22 passed (`tests/market-unblend.html`)
**File modified:** `market_screen.html`

### Design decision

`shipProbability` (ground truth, BroadcastChannel) and `marketPrice` (crowd bets, WebSocket) are two separate layers. The piece is the gap between them. They must never be averaged or blended — blending erases the tension that is the entire point.

### Changes

**1. Unblend tick():**
- Before: `const displayProb = 0.7 * yesProb + 0.3 * audienceMarketPrice`
- After: `const displayProb = audienceMarketPrice`
- YES/NO charts and prices now show pure crowd belief only

**2. Divergence display in tick():**
- `truthCents = round(yesProb*100)`, `crowdCents = round(audienceMarketPrice*100)`
- `gap = abs(truthCents - crowdCents)` → written to `#gapVal`
- `#gapBox.classList.toggle('wide', gap >= 10)` → turns value red at ≥10¢ gap

**3. Header band — three columns:**
- Removed: `AUDIENCE <audiencePrice> · <totalInvested>`
- Added: GROUND TRUTH `#truthOpen` / THE MARKET `#audiencePrice` / DIVERGENCE `#gapBox #gapVal`
- `#totalInvested` kept hidden (WS handler still writes to it)
- CSS: `.header-layers` flex row, `.header-layer` column, `.layer-label` 8px uppercase, `.layer-val` 20px light; `#gapBox.wide .layer-val { color: #ef4444 }`

**4. BroadcastChannel handler:** writes `Math.round(yesProb*100) + '¢'` to `#truthOpen` on every game tick

**5. Question:** `#contractQ` → "Will the Strait of Hormuz remain open?"

---

## Control Center + base.html — Grill Report

**Date:** 2026-06-18

### Q1: Which pages belong on the control center?

**Options:** (a) All four existing pages, (b) Three (index, market_screen, audience), (c) All four plus tests section
**Decision:** Option (a) — index, market_screen, audience, detector
**Rationale:** All four are live show infrastructure; operator needs one place to open everything on show day.
**Consequence:** control-center.html has 5 launch buttons (the four existing pages + base.html, which is created as part of this same task).

---

### Q2: What does clicking a button do?

**Options:** (a) Opens in new tab, (b) Opens in same tab, (c) Single "Open all" button
**Decision:** Option (a) — each button opens in a new tab
**Rationale:** All four pages must be open simultaneously; new tab is simple and popup-blocker-safe.
**Consequence:** Operator clicks all buttons once at setup; tabs persist for the full show.

---

### Q3: Should the control center automate which physical display each page opens on?

**Options:** (a) Label + slot assignment UI with reassignment dropdowns, (b) Static labels only, (c) Drag-to-display manually
**Decision:** Option (c) — operator drags tabs to the right display manually
**Rationale:** Browsers cannot target specific physical displays; manual drag is simpler and more reliable under show-day pressure.
**Consequence:** control-center.html is a pure launcher — no slot state, no localStorage, no reassignment UI.

---

### Q4: What information does each button show?

**Options:** (a) Page name only, (b) Page name + Creston slot label, (c) Page name + slot + description
**Decision:** Option (a) — page name only
**Rationale:** Operator pre-sets everything before the show; minimal labels reduce visual noise.
**Consequence:** Buttons show: INDEX / MARKET SCREEN / AUDIENCE / DETECTOR / BASE.

---

### Q5: Aesthetic?

**Options:** (a) Match IBM Plex Mono black-white project style, (b) Plain utilitarian, (c) Distinct background color
**Decision:** Option (a) — match project aesthetic
**Rationale:** 10 lines of CSS, looks intentional, consistent with all other pages.
**Consequence:** control-center.html uses same font, black background, uppercase mono labels as market_screen.html.

---

### Q6: base.html content and layout?

**Options:** (a) Object name + weapon name only, (b) Object + weapon name + one-line consequence, (c) Full weapon card
**Decision:** Option (b) — object + weapon name + consequence, with layout constraint
**Layout constraint:** Left and right edges of the page only — center remains pure white and empty so the physical prop can be placed in front of the projection without visual interference.
**Rationale:** Audience needs to know what happens when they place an object; one line is readable at projection distance.
**Consequence:** base.html has two columns absolutely positioned at left and right edges, center is untouched white.

---

### Implementation Plan

**Step 1 — Create `base.html`**
- Pure white background (`#ffffff`)
- IBM Plex Mono font, dark text
- Left column (position: fixed, left edge): disruptor objects from tm_model_02 (Pret Cup → D02, Object 01 → D01)
- Right column (position: fixed, right edge): defender objects (Snacks → R01, Sparkling water → R02)
- Each entry: object name (large), weapon name (medium), one-line consequence (small, muted)
- Center: empty white — nothing
- What user sees: projection-ready reference card with props info flanking empty center stage
- What breaks if skipped: Creston (4) has no content

**Step 2 — Create `control-center.html`**
- Black background, IBM Plex Mono
- Title: DEEP SEAS · CONTROL CENTER
- 5 large buttons: INDEX / MARKET SCREEN / AUDIENCE / DETECTOR / BASE — each `target="_blank"`
- What user sees: single-page launcher for all show pages
- What breaks if skipped: operator has no unified launch point

---

### Implementation Record

**Date:** 2026-06-18
**Tests:** 16/16 (`tests/control-center-structure.html`) + 20/20 (`tests/base-page-structure.html`)
**Files created:** `control-center.html`, `base.html`

**`base.html`:**
- White body (`#ffffff`), IBM Plex Mono, overflow hidden
- `.col-left { position: fixed; left: 0; }` — disruptor column (D01 Object 01, D02 Pret Cup)
- `.col-right { position: fixed; right: 0; }` — defender column (R01 Snacks, R02 Sparkling water)
- Each entry: object name (15px 500 uppercase), weapon ID (9px, red for disruptor / green for defender), weapon name (11px), consequence (10px 300 muted)
- Center: untouched white — no elements

**`control-center.html`:**
- Black body (`#0a0a0a`), IBM Plex Mono, centered flex column
- Title: "DEEP SEAS · CONTROL CENTER" (10px, 0.28em spacing, muted)
- 5 anchor links in a 320px column, each `target="_blank"`, border on hover
- Labels: Index / Market Screen / Audience / Detector / Base

---

## index.html Dual-Mode — Grill Report

**Date:** 2026-06-18

### Q1: Single page or two separate files?

**Options:** (a) Two separate files, (b) One page with URL parameter, (c) One page with two internal sections toggled in-place
**Decision:** Option (c) — single `index.html`, two internal sections, toggled in-place
**Rationale:** Live performance context — switching tabs or reloading in front of an audience is unacceptable; in-place toggle has zero visible browser chrome.
**Consequence:** `index.html` wraps existing simulation content in `#sim-mode` and adds a new `#video-mode` section; no new HTML files created.

---

### Q2: What triggers the mode switch?

**Options:** (a) BroadcastChannel from control-center.html, (b) localStorage + storage event, (c) Keypress on the projector window
**Decision:** Option (a) — BroadcastChannel on channel `hormuz-mode`
**Rationale:** Already used in the codebase (`hormuz-game`); sub-1ms cross-tab on same machine; operator never needs to focus the projector window.
**Consequence:** control-center.html broadcasts `{ mode: 'video_playback' }` or `{ mode: 'simulation' }`; `index.html` listens and switches.

---

### Q3: Control center hierarchy for INDEX?

**Options:** (a) INDEX becomes non-clickable label, (b) INDEX stays clickable + MODE 01/02 sub-buttons below, (c) No INDEX label, two peer buttons
**Decision:** Option (b) — INDEX opens `index.html` (new tab, defaults to MODE 01); MODE 01 / MODE 02 are indented sub-buttons that broadcast the switch signal
**Operator flow:** Click INDEX → drag to Creston (3) → use MODE 01 / MODE 02 from laptop to switch live
**Rationale:** Clicking INDEX also triggers MODE 01 so the page always starts in video_playback; sub-buttons handle all subsequent switches.
**Consequence:** control-center.html needs a sub-group CSS pattern and two `<button>` elements that call `BroadcastChannel.postMessage`.

---

### Q4: video_playback section content?

**Options:** (a) Blank white only, (b) White + hidden video placeholder, (c) White + full-bleed `<video>` element, no src
**Decision:** Option (c) — full-bleed `<video>` element, `src` empty, white background shows through
**Rationale:** Structure is ready; dropping a video file in later requires only adding a `src` attribute.
**Consequence:** `#video-mode` contains `<video id="bgVideo" autoplay loop muted playsinline>` sized to 100vw × 100vh with white body behind it.

---

### Q5: Transition style?

**Options:** (a) Instant switch, (b) 500ms fade, (c) 1.5–2s cinematic fade
**Decision:** Option (a) — instant switch (`display` toggle only)
**Rationale:** On a live stage, a mis-timed half-fade is more embarrassing than a crisp cut; instant is unambiguous.
**Consequence:** No CSS transition needed; mode switch is a `display:none` / `display:block` toggle on `#video-mode` and `#sim-mode`.

---

### Implementation Plan

**Step 1 — Modify `index.html`**
- Wrap all existing body content in `<div id="sim-mode" style="display:none">…</div>`
- Add `<div id="video-mode">` above it: white body, full-bleed `<video id="bgVideo" autoplay loop muted playsinline></video>`
- Add BroadcastChannel listener on `'hormuz-mode'`: `{ mode: 'video_playback' }` → show `#video-mode`, hide `#sim-mode`; `{ mode: 'simulation' }` → reverse
- Default state on load: `#video-mode` visible, `#sim-mode` hidden
- What user sees: index.html opens as white page with video element; simulation hidden until MODE 02 fired
- What breaks if skipped: BroadcastChannel messages have no listener; mode switching silently does nothing

**Step 2 — Modify `control-center.html`**
- INDEX `<a>` now also calls `new BroadcastChannel('hormuz-mode').postMessage({ mode: 'video_playback' })` on click (in addition to opening new tab) — sets default mode
- Add CSS for `.sub-group` (indented, border-left) and `.sub-btn` (smaller, same mono style)
- Add MODE 01 button: broadcasts `{ mode: 'video_playback' }`
- Add MODE 02 button: broadcasts `{ mode: 'simulation' }`
- What user sees: INDEX link + two indented sub-buttons below it on control-center.html
- What breaks if skipped: operator has no way to trigger mode switch from laptop

---

### Implementation Record

**Date:** 2026-06-18
**Tests:** index-dual-mode (all green) + control-center-mode-buttons (all green)
**Files modified:** `index.html`, `control-center.html`

**`index.html` changes:**
- Added `#video-mode` div immediately after `<body>`: `position:fixed; inset:0; background:#ffffff; z-index:9999` — sits above everything
- `<video id="bgVideo" autoplay loop muted playsinline style="width:100vw;height:100vh;object-fit:cover">` inside it — full-bleed, no src yet
- Wrapped all existing body content in `<div id="sim-mode" style="display:none">`
- Added `BroadcastChannel('hormuz-mode').onmessage` listener in an IIFE at bottom of body: `video_playback` → shows `#video-mode`, hides `#sim-mode`; `simulation` → reverse

**`control-center.html` changes:**
- Added `.sub-group` (flex column, `padding-left:20px`, `border-left:1px solid #222`) and `.sub-btn` CSS (9px mono, transparent bg, hover brightens)
- INDEX `<a>` gains `onclick="broadcast('video_playback')"` — opens page AND fires MODE 01 simultaneously
- Two `.sub-btn` elements below INDEX: "Mode 01 — Video Playback" and "Mode 02 — Simulation"
- `broadcast(mode)` helper at bottom: `new BroadcastChannel('hormuz-mode').postMessage({ mode })`

---

## Grill Report — Dual-Mode for market_screen.html + detector.html

**Date:** 2026-06-18
**Feature:** Extend video_playback / simulation dual-mode to market_screen.html and detector.html, matching the pattern already implemented in index.html.

### Q1: Simultaneous vs independent mode switching

**Options:** (a) All three pages switch simultaneously via single broadcast, (b) independent per-page controls, (c) index + market grouped, detector independent
**Decision:** Option a — one MODE 01/02 press switches all three pages at once
**Rationale:** On show day you want a single button to transition the entire room, not three presses with the risk of leaving one display stuck
**Consequence:** No new buttons needed in control-center.html; existing MODE 01/02 broadcast already reaches all pages on `hormuz-mode`

### Q2: Video element per page

**Options:** (a) Same blank white + `<video>` placeholder on each page, (b) each page plays a different video, (c) only index.html plays video, others go pure white
**Decision:** Option a — same blank white + `<video id="bgVideo">` placeholder on each
**Rationale:** Consistent "dark before show" state across all Crestons; video src can be filled in per-page later without restructuring
**Consequence:** All three pages look identical in video_playback mode; operator can differentiate later by setting different src values

### Q3: Control center changes needed

**Options:** (a) No changes — existing MODE 01/02 already broadcasts to all listeners, (b) add per-page sub-buttons, (c) rename MODE labels to reflect all-page scope
**Decision:** Option a — no changes to control-center.html
**Rationale:** BroadcastChannel fan-out is automatic; adding more buttons contradicts the simultaneous-switching decision from Q1
**Consequence:** control-center.html stays as-is; test suite for it remains green

### Q4: Camera detection loop behavior in video_playback mode

**Options:** (a) Visually hide only — `display:none` on `#sim-mode`, camera stays warm in background, (b) stop stream + cancel rAF loop, (c) pause video feed, keep model loaded
**Decision:** Option a — just hide, camera keeps running
**Rationale:** Stopping camera means 1-3s restart on MODE 02 switch; on show day a lag at wrong moment is worse than background CPU
**Consequence:** Switching back to simulation on detector.html is truly instant; camera stays live behind the white screen

### Implementation Plan

**Step 1 — Write tests/market-dual-mode.html** (RED)
- File created: `tests/market-dual-mode.html`
- Tests: #video-mode exists, #sim-mode exists, video element attrs, default state, hormuz-mode channel, white bg + full-bleed
- User sees: RED test results
- Breaks if skipped: no coverage for market_screen changes

**Step 2 — Write tests/detector-dual-mode.html** (RED)
- File created: `tests/detector-dual-mode.html`
- Same 5 slices as market test, targeting detector.html
- User sees: RED test results
- Breaks if skipped: no coverage for detector changes

**Step 3 — Implement market_screen.html**
- File modified: `market_screen.html`
- Add `#video-mode` div (white bg, full-bleed `<video id="bgVideo" autoplay loop muted playsinline>`) immediately after `<body>`
- Wrap all existing body content in `<div id="sim-mode" style="display:none">`
- Add BroadcastChannel('hormuz-mode') listener at bottom: video_playback → show video-mode / hide sim-mode; simulation → reverse
- No `invalidateSize` needed (no Leaflet map)
- User sees: market_screen.html opens as white screen; MODE 02 reveals market UI
- Breaks if skipped: market screen doesn't switch with rest of show

**Step 4 — Implement detector.html**
- File modified: `detector.html`
- Same structure as Step 3
- Camera rAF loop keeps running behind `display:none` — instant switch back
- User sees: detector.html opens as white screen; MODE 02 reveals camera feed + detection bars
- Breaks if skipped: detector screen stays on camera feed during video_playback phase

### Implementation Record

**Date:** 2026-06-18
**Tests:** market-dual-mode (all green) + detector-dual-mode (all green)
**Files modified:** `market_screen.html`, `detector.html`

**Pattern applied to both (identical to index.html):**
- Added `#video-mode` div immediately after `<body>`: `position:fixed; inset:0; background:#ffffff; z-index:9999`
- `<video id="bgVideo" autoplay loop muted playsinline style="width:100vw;height:100vh;object-fit:cover">` inside it — no src
- Wrapped all existing body content in `<div id="sim-mode" style="display:none">`
- Added `BroadcastChannel('hormuz-mode').onmessage` IIFE at bottom: `video_playback` ↔ `simulation` toggle
- No `invalidateSize` needed — neither page has a Leaflet map
- detector.html camera rAF loop keeps running behind `display:none` — instant switch back to simulation

---

## Major UI Redesign — FigJam Session 2026-06-18

### Full Weapon Table (from weapons-config.js)

| ID  | Name                              | Player    | Speed |
|-----|-----------------------------------|-----------|-------|
| D01 | Strait closure / naval blockade   | disruptor | fast  |
| D02 | Sanctions package                 | disruptor | slow  |
| D03 | Tanker seizure                    | disruptor | fast  |
| D04 | Drone / missile strike on port    | disruptor | fast  |
| D05 | Insurance market suspension       | disruptor | slow  |
| D06 | Cyber attack on port logistics    | disruptor | fast  |
| R01 | Naval escort / freedom of nav.    | defender  | fast  |
| R02 | Emergency re-flagging             | defender  | fast  |
| R03 | Alternative route activation      | defender  | fast  |
| R04 | Diplomatic back-channel           | defender  | slow  |
| R05 | Strategic petroleum reserve rel.  | defender  | slow  |
| R06 | Coalition formation               | defender  | slow  |

Physical objects currently mapped (tm_model_02/label-map.json):
- Object 01 → D01, Pret Cup → D02, Snacks → R01, Sparkling water → R02
- D03–D06, R03–R06: physical objects TBD (user will train new model entries)
- Satellite images: D01.jpg … D06.jpg, R01.jpg … R06.jpg (user will provide)

---

### Phased Implementation Plan

#### Phase A — Vertical Slice (connection test, no visual redesign)
1. `base.html`: expand from 4 → 12 weapons (D01-D06 left, R01-R06 right)
2. `detector.html`: default-load `tm_model_02` instead of first manifest entry
3. `detector.html`: add minimal weapon-fired stub display (div shows weaponId + weaponName on BroadcastChannel `deepseas-game` event)
4. Test: place Object 01 → D01 fires → stub shows "Strait closure / naval blockade"
- **Channel name**: `BroadcastChannel('deepseas-game')` (already in detector.html)

#### Phase B — Simulator cleanup
- REMOVE from `simulator.html`: `#gameDashboard` HTML + CSS, `#collisionWarning`, all of `#controls` below the stats (lines 103–242: PLAY/STEP/RST, speed slider, +ADD/-RMV, START/PAUSE/RESET, END GAME, display toggles, filter/env/econ/data tabs, legend, tactical detection link)
- KEEP in `#controls`: header (STRAIT OF HORMUZ / TRAFFIC CONTROL SYS) + 4 stats (vesselCount, simTime, avgSpeed, warnings)
- KEEP: `#statusBar`, `#vessel-results` (GFW click popup)
- SET: map zoom 8, center [25.5, 56.8] to match screenshot
- SET: GFW layer on by default (call `toggleGFW()` at end of bootstrap)
- ADD: context label bottom-left — "VESSEL TRAFFIC · STRAIT OF HORMUZ · SIMULATED FROM 2023 AIS DATA"

#### Phase C — Detector.html full redesign
- Aesthetic: dark background (#080808 kept), newspaper typography — Playfair Display (headlines) + EB Garamond (body) via Google Fonts
- Layout (4 panels):
  - Top-left: live camera feed (`#webcam`)
  - Top-right: probability score + weapon actions (moved from simulator's `#gameDashboard`)
  - Bottom-left: weapon trigger panel ("WEAPON FIRED! [weapon name]" + satellite image triggered by `deepseas-game` event)
  - Bottom-right: Bloomberg-style stock news table (static placeholder; dynamic later)
- Scrolling headline ticker across full width: "THE STRAIT OF HORMUZ TODAY WAS SUBJECT TO A..."
- Auto-load `tm_model_02` (not first manifest entry)
- Satellite image: `images/[weaponId].jpg` (e.g. `images/D01.jpg`) — user will provide files
- News content: `.md` files per weapon — user will provide; static placeholder for now
- Sound: pre-recorded AI voice per weapon — user will wire separately
- BroadcastChannel `deepseas-game` drives: weapon trigger display, satellite image, probability panel updates

#### Phase D — Control center additions (next session)
- Move simulator controls (PLAY/STEP/RST, START/PAUSE/RESET, END GAME, speed, filters) into `control-center.html`

---

### Resolved Design Questions

- Newspaper aesthetic on dark bg: borrow Playfair Display + EB Garamond typography, keep #080808 background
- All 12 weapons fire weapon-triggered events (not just D01)
- Satellite image naming: `images/[weaponId].jpg`
- Bloomberg panel: static placeholder now, dynamic on weapon fire later
- Scope order: base.html (Phase A, immediate) → simulator cleanup (Phase B) → detector redesign (Phase C) → control-center (Phase D, next session)
- Detector model: default to `tm_model_02`, not first manifest entry
- base.html for D03-D06, R03-R06: show weapon info without physical object name (TBD)
