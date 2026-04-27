# Phase 13: Movement Lab integration

**Type:** HITL

## What to build

Full dress rehearsal in the Columbia GSAPP Movement Lab. All systems running simultaneously: projector displaying market_screen.html, webcam running detector.html, two players with physical objects, 10+ audience phones betting, 3-round game played to completion.

This is where the thesis is tested: does the audience experience the flip moment? Do they realize their collective bets shaped the probability?

## Acceptance criteria

- [ ] Projector connected and displaying market_screen.html at readable resolution
- [ ] Webcam positioned for reliable object detection (lighting, angle, distance calibrated)
- [ ] N_base re-calibrated for Movement Lab conditions (if simulation behavior differs from dev)
- [ ] Two players briefed on their 6 objects each and basic strategy
- [ ] 10+ audience members connected to audience.html via venue WiFi
- [ ] Full 3-round game played without system crashes
- [ ] Round resolution is clear and unambiguous to audience (winner announced, scores visible)
- [ ] Role swaps work correctly between rounds
- [ ] Audience leaderboard visible on projection between rounds
- [ ] Probability and flow_ratio both visible on projection throughout play
- [ ] Object detection works reliably in Movement Lab lighting (>70% confidence for all 12 objects)
- [ ] No lag between gesture and probability update (perceptible to audience as "instant")
- [ ] System recovers gracefully from any single component failure (e.g., webcam dropout, one phone disconnect)
- [ ] The causal chain is legible to viewers: object lifted -> probability moves -> ships respond
- [ ] Document any issues, tuning changes, or UX observations for final iteration
- [ ] Record video of at least one full round for documentation

## Blocked by

- Blocked by Phase 10 (full game must work with two players)
- Blocked by Phase 12 (audience system must handle multi-device load)
