# Phase 4: Weapon interactions

**Type:** AFK

## What to build

The interaction override system. When specific weapon pairs are simultaneously active, a net_delta override replaces the independent sum of their effects. The 3 perfect counter pairs fully neutralize each other. Cooldown system prevents weapon spam.

This is where strategic depth emerges: players must read what the opponent has active and respond with the correct counter.

## Acceptance criteria

- [ ] Interaction table loaded from config: maps weapon pairs to net_delta overrides
- [ ] When D01 and R01 are both active: net_delta override replaces independent calculation (not just D01.delta + R01.delta)
- [ ] Perfect counter pair D02 + R04: R04 freezes D02 build (net effect = 0)
- [ ] Perfect counter pair D03 + R02: R02 fully neutralizes D03 (seized_fraction returns to 0)
- [ ] Perfect counter pair D05 + R05: R05 breaks D05 fear signal (fear_dampener returns to 1.0)
- [ ] Cooldown system: each weapon has a cooldown period after firing; cannot re-fire until cooldown expires
- [ ] Cooldown displayed per weapon (remaining ticks)
- [ ] Attempting to fire during cooldown does nothing (no effect, no log entry)
- [ ] When both players fire simultaneously, interaction check runs before applying deltas
- [ ] Test: D01 + R01 simultaneously active produces the configured net_delta, not +22 + (-18) = +4
- [ ] Test: all 3 perfect counter pairs produce zero net effect
- [ ] Test: cooldown prevents re-fire and expires correctly
- [ ] Test: non-interacting weapon pair (e.g., D04 + R05) sums independently as normal

## Blocked by

- Blocked by Phase 3 (all 12 weapons must be fireable)
