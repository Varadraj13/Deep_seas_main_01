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
- Existing tests: `tests/pre-phase-01-recentering.html` (8 tests), `tests/pre-phase-01-routing.html` (11 tests), `tests/phase-01-game-state.html` (1 test, RED)
