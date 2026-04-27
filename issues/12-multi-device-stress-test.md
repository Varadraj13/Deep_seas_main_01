# Phase 12: Multi-device stress test

**Type:** HITL

## What to build

Verify the audience system works under real multi-device conditions. 10+ phones connected simultaneously over WiFi. All clients receive WebSocket updates with acceptable latency. Bets are recorded under load. Leaderboard renders on market_screen.html wall projection. Brief disconnections do not lose bets.

## Acceptance criteria

- [ ] 10+ physical devices connected to audience server simultaneously over WiFi
- [ ] All clients receive probability updates within 500ms of weapon fire
- [ ] All clients show same probability value (no state divergence between devices)
- [ ] Bets from all 10+ devices recorded correctly in server state
- [ ] Server does not crash or lag under 10+ concurrent WebSocket connections
- [ ] Leaderboard correctly scores all 10+ participants after round end
- [ ] Leaderboard appears on market_screen.html wall projection after round end
- [ ] Brief WiFi disconnection (5 seconds): client reconnects automatically, bet preserved
- [ ] Longer disconnection (30 seconds): client reconnects, sees current state, can still bet if round active
- [ ] No duplicate bet entries from reconnection race conditions
- [ ] Server memory usage stable over 30+ minutes (no leaks)
- [ ] Latency test: measure round-trip time from weapon fire to client display update
- [ ] If performance issues found: document bottlenecks and required fixes

## Blocked by

- Blocked by Phase 11 (audience server must exist)
- Blocked by Phase 7 (market_screen.html leaderboard placeholder must exist)
