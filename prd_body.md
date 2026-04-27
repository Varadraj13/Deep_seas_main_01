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
