# Phase 7: market_screen.html extension

**Type:** AFK

## What to build

Extend the existing market_screen.html wall projection page to show the full game state for audience viewing. Add flow_ratio bar (physical consequence of market probability), dashboard color thresholds, round/game scores, and a placeholder area for the audience leaderboard (wired in Phase 12).

The wall projection shows two things simultaneously: the market signal (probability %) and its physical consequence (flow_ratio = ships in strait / baseline). When they converge, the thesis is visible.

## Acceptance criteria

- [ ] flow_ratio progress bar displayed prominently alongside probability number
- [ ] flow_ratio calculated as N_current / N_base and updated every tick
- [ ] Dashboard background color changes at thresholds: RED (#993C1D) when prob > 65%, AMBER (#EF9F27) when 35-65%, GREEN (#0F6E56) when prob < 35%
- [ ] Round number and game scores displayed (e.g., "ROUND 2 | RED 1 - 0 BLUE")
- [ ] Current phase displayed (IDLE / PLAYING / ROUND END / GAME OVER)
- [ ] Active weapon name and delta shown when fired (fades after 3 seconds)
- [ ] Probability history sparkline/chart continues to work
- [ ] Placeholder div for audience leaderboard (populated when audience server connects)
- [ ] Page reads marketState via shared mechanism (localStorage, BroadcastChannel, or WebSocket)
- [ ] Updates in real time on every tick and every weapon fire
- [ ] Looks good on a projector (large text, high contrast, no small UI elements)
- [ ] Test: flow_ratio bar width matches calculated ratio
- [ ] Test: color threshold changes at correct boundary values
- [ ] Test: state sync between index.html and market_screen.html works reliably

## Blocked by

- Blocked by Phase 5 (round controller provides scores, phase, timer)
