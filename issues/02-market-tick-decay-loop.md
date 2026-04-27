# Phase 2: marketTick decay loop

**Type:** AFK

## What to build

The autonomous 20-second tick loop that makes the market feel alive between player actions. After D01 is fired, its probability delta decays over time (decay_rate = -2 per tick). Each tick also applies a small Brownian drift (random walk within bounds) to create organic market movement. The probability drifts back toward baseline unless the player keeps firing.

Visible demo: fire D01 (prob jumps to 72), then watch it decay tick by tick: 70, 68, 66... while ships gradually resume speed.

## Acceptance criteria

- [ ] `marketTick()` function runs every 20 seconds (setInterval)
- [ ] Each tick processes all active fast weapons and reduces their remaining delta by decay_rate
- [ ] D01 decays at -2 per tick (prob: 72 -> 70 -> 68 -> ... back toward 50)
- [ ] Brownian drift adds a small random value (e.g., +/- 1-2) per tick
- [ ] Probability clamped to [0, 100] after drift
- [ ] Simulation multipliers update as probability changes (ships gradually resume normal speed as prob falls)
- [ ] Active weapon removed from activeWeapons array when its effect is fully decayed
- [ ] Tick count tracked (30 ticks = full 10-minute round)
- [ ] Test: after 11 ticks of decay at -2, D01 effect is fully gone (prob returns to ~50 +/- drift)
- [ ] Test: Brownian drift stays within expected bounds over 100 ticks
- [ ] Test: multiple simultaneous active weapons each decay independently

## Blocked by

- Blocked by Phase 1 (marketState + fireWeapon must exist)
