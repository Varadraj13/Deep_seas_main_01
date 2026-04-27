# Phase 6: MKTS panel UI

**Type:** AFK

## What to build

In-sim overlay panel on index.html showing the live game state. This is the player's dashboard — they see what weapons are active, what the probability is, whose turn it is, and what just happened. Read-only view of marketState; never writes back.

## Acceptance criteria

- [ ] MKTS panel visible as overlay on index.html (toggleable via 'K' key or button)
- [ ] Displays: current question ("Will the Strait of Hormuz remain open?")
- [ ] Displays: live probability as large number with color coding (RED >65%, AMBER 35-65%, GREEN <35%)
- [ ] Displays: current round number and scores (e.g., "Round 2 | Disruptor 1 - 0 Defender")
- [ ] Displays: current player role labels (who is disruptor, who is defender)
- [ ] Displays: active weapons list with name, remaining cooldown bar, and decay/build indicator
- [ ] Displays: round timer countdown (MM:SS)
- [ ] Displays: recent action log (last 5 actions with timestamp, weapon name, delta applied)
- [ ] Panel updates on every marketState change (weapon fire, tick, round transition)
- [ ] Panel is read-only — clicking elements does not mutate marketState
- [ ] Styled consistently with existing dark theme (matches control panel aesthetics)
- [ ] Test: panel renders correct probability value from marketState
- [ ] Test: active weapons list updates when weapon fired and when weapon decays to zero
- [ ] Test: action log appends new entries and caps at 5 most recent

## Blocked by

- Blocked by Phase 5 (round controller provides round number, scores, timer, phase)
