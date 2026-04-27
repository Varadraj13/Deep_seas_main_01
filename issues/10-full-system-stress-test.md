# Phase 10: Full system stress test

**Type:** HITL

## What to build

Calibrate N_base and run 3 full rounds with two human players using physical objects. Verify the complete chain works under real conditions: gestures -> detection -> weapons -> market -> simulation -> display. Tune parameters based on observed gameplay.

This is the first time the full game is played as designed.

## Acceptance criteria

- [ ] N_base calibrated: simulation runs 60 seconds with no weapons, equilibrium ship count measured and set in config
- [ ] flow_ratio = 1.0 when no weapons active (confirms calibration)
- [ ] Full 3-round game completed with two human players using physical objects
- [ ] Round 1: disruptor attempts to close strait, defender attempts to keep open, round resolves correctly
- [ ] Round 2: roles swap correctly, loser of R1 is now disruptor
- [ ] Round 3 (if needed): roles swap again, game resolves at 2 wins
- [ ] Probability tracks weapon effects accurately throughout each round
- [ ] Ships respond to formula: visible slowdown when prob > 50%, near-stop when prob > 65%
- [ ] market_screen.html projection shows correct state throughout (prob, flow_ratio, scores, colors)
- [ ] MKTS panel shows all weapon activity, cooldowns, action log
- [ ] No crashes or state desync over 30+ minutes of play
- [ ] Weapons feel balanced: neither side has an unbeatable dominant strategy
- [ ] Performance: simulation maintains smooth animation (>30 fps) with weapons active
- [ ] If balance issues found: document required tuning changes to effect matrix

## Blocked by

- Blocked by Phase 7 (market_screen.html needed for projection)
- Blocked by Phase 9 (all 12 objects needed for full gameplay)
