# Phase 5b: Ship speed responsiveness

**Type:** AFK

## What to build

Fix three bugs that cause ship speed and the HORMUZ FLOW % indicator to ignore active weapons. Add a gradual lerp so speed changes feel alive rather than snapping instantly.

**Bugs confirmed from code review:**

1. `simulation.js:198` — `avgSpeed` display uses raw `v.speed`, not effective speed. The "Avg Kn" stat never changes when weapons are active.
2. `simulation.js:207` — `flowPct` (the "HORMUZ FLOW XX%" in the status bar) is computed as `avg(v.speed) / 15 * 100` using raw speed. HORMUZ FLOW stays at ~85% even when D01 has halted the strait — the most visible indicator on the main projection is broken.
3. The `speedMult` applied to `progressDelta` is read fresh each frame, so ships snap to near-zero speed the instant D01 fires. No gradual deceleration.

`progressDelta` itself IS correctly using `effectiveSpeed` (simulation.js:66–67), so ships do move slower on the map — the fix is to the displayed numbers and the transition feel.

**Fix:** Add `let currentSpeedMult = 1.0` as a local variable in `simulation.js`. Each frame, lerp it toward `marketState.simMultipliers.speed_mult` at rate 0.015 (~3 seconds to transition). Use `currentSpeedMult` everywhere speed is displayed or calculated: `progressDelta`, `avgSpeed`, `flowPct`, and the ship detail panel.

## Acceptance criteria

- [ ] `let currentSpeedMult = 1.0` declared in `simulation.js` at module scope
- [ ] Each `updateSim()` call lerps `currentSpeedMult` toward `marketState.simMultipliers.speed_mult` at rate 0.015
- [ ] `progressDelta` uses `currentSpeedMult` (replaces the per-vessel `speedMult` read)
- [ ] `avgSpeed` display (simulation.js ~line 198) multiplied by `currentSpeedMult`
- [ ] `flowPct` formula (simulation.js ~line 207) multiplied by `currentSpeedMult`
- [ ] Ship detail panel speed display shows `v.speed * currentSpeedMult` (not raw `v.speed`)
- [ ] After firing D01 (speed_mult → 0.05): ships visibly decelerate over ~3 seconds on the map
- [ ] After firing D01: "Avg Kn" stat drops from ~14 to ~0.7
- [ ] After firing D01: "HORMUZ FLOW" in status bar drops from ~85% to ~3%
- [ ] After D01 decays and is removed: ships gradually accelerate back to normal speed
- [ ] When no weapons are active, `currentSpeedMult` stays at 1.0 and behavior is identical to pre-fix
- [ ] Test: after 500 simulated lerp steps with speed_mult = 0.05, `currentSpeedMult` is within 0.02 of 0.05
- [ ] Test: after D01 fires and decays, `currentSpeedMult` lerps back toward 1.0
- [ ] Test: `flowPct` formula at `currentSpeedMult = 0.05`, avg raw speed 14 → flowPct ≤ 5
- [ ] Test: `flowPct` formula at `currentSpeedMult = 1.0`, avg raw speed 14 → flowPct ≈ 93
- [ ] Test: when no weapons active, lerp target is 1.0 and `currentSpeedMult` does not drift

## Files changed

- `js/simulation.js` — add `currentSpeedMult` variable; lerp in `updateSim()`; fix `avgSpeed` and `flowPct` in `updateStats()`
- `js/panel-ship.js` — fix speed display to use `v.speed * currentSpeedMult`
- `tests/phase-05b-speed.html` — new test file, 5 tests

## Blocked by

- Blocked by Phase 1 (simulation must already read `marketState.simMultipliers.speed_mult`, which was wired in Phase 1)
