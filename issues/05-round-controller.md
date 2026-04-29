# Phase 5: Round controller

**Type:** AFK

## What to build

The full round lifecycle: start, play, end, score, swap, repeat. Best-of-3 format. One question: "Will the Strait of Hormuz remain open by round end?" Round resolves by reading `simulationState.hormuz_lane` (open = defender wins, closed = disruptor wins). Roles swap after each round (loser becomes disruptor). Game ends when one player reaches 2 round wins.

Operator controls: START, PAUSE, RESET buttons on the control panel.

## Acceptance criteria

- [ ] `startRound()`: resets probability to 50%, clears all active weapons, starts 10-minute countdown timer (30 ticks), sets phase to "playing"
- [ ] During "playing" phase: weapons can fire, marketTick runs, simulation responds
- [ ] `endRound()`: triggered when timer hits 0; reads `simulationState.hormuz_lane`; if closed -> disruptor wins, if open -> defender wins
- [ ] `hormuz_lane` state derived from probability: prob > 65% = closed, prob <= 65% = open (or based on lane_open multiplier)
- [ ] Round winner recorded in marketState.scores
- [ ] `swapRoles()`: loser of round becomes disruptor in next round
- [ ] Best-of-3: game ends when scores reach 2-0 or 2-1; phase set to "over"
- [ ] Operator buttons in control panel: START (begins round), PAUSE (freezes timer + tick), RESET (returns to idle)
- [ ] Phase transitions: idle -> playing -> roundEnd -> (playing or over)
- [ ] Round number and scores displayed in status bar
- [ ] Test: startRound resets all state correctly
- [ ] Test: endRound reads lane state and awards correct winner
- [ ] Test: role swap after round loss
- [ ] Test: game ends at 2 wins (not 3 rounds always)
- [ ] Test: pause freezes everything, resume continues from same state

## Blocked by

- Blocked by Phase 4 (weapon interactions needed for meaningful rounds)