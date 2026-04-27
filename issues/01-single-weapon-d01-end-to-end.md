# Phase 1: Single weapon D01 end-to-end

**Type:** AFK

## What to build

The tracer bullet. Create the `marketState` object (central game state), the weapons config loader (reading D01 from a JSON derived from effect_matrix_v4.xlsx), and the `fireWeapon('D01')` function. Wire a single keyboard key to fire D01 Strait Blockade. When fired: probability jumps by +22, the `speed_mult` and `lane_open` simulation multipliers update, and ships in the strait visibly slow/stop according to the 7-factor ship count formula.

This slice also introduces the test infrastructure (lightweight HTML test runner or Node test script) and the first integration tests for marketState and the ship count formula.

End-to-end path: keypress -> weaponLookup -> fireWeapon -> marketState.prob updates -> simulation reads multipliers -> ships slow/stop on map.

## Acceptance criteria

- [ ] `marketState` object exists with: prob (starts at 50), activeWeapons array, phase, actionLog
- [ ] Weapon config JSON file contains D01 definition (id, type:fast, prob_delta:+22, decay_rate, sim_trigger_keys: speed_mult=0.05, lane_open=0)
- [ ] `fireWeapon('D01')` applies +22 to marketState.prob immediately
- [ ] `simulation.js` reads `speed_mult`, `spawn_rate_mult`, and `hormuz_lane` from `marketState.simMultipliers`
- [ ] `speed_mult` scales vessel speed in the update loop (0.05 = near halt)
- [ ] `spawn_rate_mult` gates new vessel spawns (0.2 = 80% fewer new ships)
- [ ] `hormuz_lane` is a state flag ('open'/'closed') read by the round controller in Phase 5
- [ ] Ships visibly slow/stop when D01 is active
- [ ] No other simMultiplier fields exist yet -- only D01's 3 keys are present
- [ ] Keyboard key (e.g., '1') fires D01
- [ ] `marketState.actionLog` records the weapon fire with timestamp
- [ ] Test: fireWeapon('D01') shifts prob from 50 to 72
- [ ] Test: ship count formula produces correct N_current given known multiplier inputs
- [ ] Test: probability clamps to [0, 100] range
- [ ] Existing simulation features (vessel movement, ports, analytics) still work normally when no weapon is active

## Blocked by

None - can start immediately
