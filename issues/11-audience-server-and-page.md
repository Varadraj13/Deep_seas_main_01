# Phase 11: Audience server and page

**Type:** AFK

## What to build

Node.js + Express + WebSocket server that holds shared audience state and serves a mobile betting page. Audience members open a URL on their phones, see the live probability, and bet OPEN or CLOSED. Server records bets, calculates scores after round end, broadcasts state to all clients.

This is the layer that turns watchers into participants — the market.

## Acceptance criteria

- [ ] `server.js`: Express serves static files (audience.html, CSS, client JS)
- [ ] WebSocket server broadcasts marketState snapshot to all connected clients on: every tick, every weapon fire, round transitions
- [ ] REST endpoint: POST /bet accepts {playerId, prediction: "open"|"closed", timestamp}
- [ ] Server validates: bet only accepted during "playing" phase, one bet per player per round
- [ ] Late bet detection: bets placed after first weapon fire marked as "late"
- [ ] `audience.html`: mobile-optimized page with question, live probability (large number, color-coded), bet buttons (OPEN / CLOSED)
- [ ] After betting: buttons disabled, shows "Bet recorded: OPEN" confirmation
- [ ] WebSocket client receives state updates and animates probability changes
- [ ] Leaderboard: calculated after each round end (correct: +10, late correct: +5, wrong: +0)
- [ ] Leaderboard displayed on audience.html after round end
- [ ] Server handles 30-50 concurrent WebSocket connections without lag
- [ ] Reconnection: if client disconnects and reconnects, existing bet preserved
- [ ] Player ID generated client-side (localStorage) or via simple name entry
- [ ] Server exposes GET /state for market_screen.html to poll leaderboard data
- [ ] Test: POST /bet records bet correctly and returns 200
- [ ] Test: WebSocket broadcasts reach all connected test clients
- [ ] Test: leaderboard scores calculated correctly (correct/late/wrong)
- [ ] Test: duplicate bet from same player in same round rejected
- [ ] Test: bet rejected when phase is not "playing"

## Blocked by

- Blocked by Phase 5 (round controller provides phase, round transitions, scoring triggers)
