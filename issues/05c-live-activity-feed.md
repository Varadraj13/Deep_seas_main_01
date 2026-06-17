# Phase 5c: Live activity feed

**Type:** AFK

## What to build

A scrolling real-time event feed showing weapon plays, round events, and probability milestones — visible on the in-sim panel (index.html bottom-left) and on the wall projection (market_screen.html). New entries appear at the top like a social feed, color-coded by role.

This also lays the BroadcastChannel infrastructure that connects index.html to market_screen.html, which Phase 7 (market screen extension) builds on top of.

**Feed events logged:**

| Type | Example text | Trigger |
|---|---|---|
| `weapon` | `DISRUPTOR · D01 Strait Blockade +22% → 72%` | `fireWeapon()` |
| `round` | `ROUND 1 STARTED · prob reset to 50%` | `startRound()`, `endRound()`, `endGameNow()`, `resetGame()` |
| `milestone` | `⚠ PROB CROSSED 65% — STRAIT CLOSING` | `marketTick()` when prob crosses 65 or 35 |
| `decay` | `D01 decayed · prob returning` | `marketTick()` when weapon removed from activeWeapons |

**State sync:** index.html opens a `BroadcastChannel('hormuz-game')` and posts a snapshot message on every `addFeedEvent()` call and every `marketTick()`. market_screen.html listens on the same channel and updates its probability display, ticker, and feed panel in real time. No server required — both pages open in the same browser on the same machine.

## Acceptance criteria

- [ ] `marketState.eventFeed` array added to `marketState` in `js/game-state.js`
- [ ] `addFeedEvent(type, text, color)` function defined in `js/game-state.js`
- [ ] `addFeedEvent()` caps `eventFeed` at 100 entries (drops oldest when exceeded)
- [ ] `addFeedEvent()` calls `renderFeed()` if defined and broadcasts via BroadcastChannel
- [ ] `fireWeapon()` calls `addFeedEvent('weapon', ...)` with role, weapon id, name, delta, and prob-after
- [ ] `startRound()` calls `addFeedEvent('round', ...)` with round number
- [ ] `endRound()` calls `addFeedEvent('round', ...)` with winner and lane state
- [ ] `endGameNow()` calls `addFeedEvent('round', ...)` with game-over result
- [ ] `resetGame()` calls `addFeedEvent('round', 'GAME RESET', 'system')`
- [ ] `marketTick()` adds `'decay'` event when a weapon is removed from activeWeapons
- [ ] `marketTick()` adds `'milestone'` event when prob crosses 65% (upward) or 35% (downward) or back
- [ ] `startRound()` does NOT clear `eventFeed` — feed accumulates across all rounds
- [ ] New `js/game-feed.js` with `renderFeed()` — pure DOM writer, reads `marketState.eventFeed`
- [ ] `#activityFeed` fixed panel visible on index.html, bottom-left, shows last 8 entries newest-on-top
- [ ] Feed rows color-coded: `feed-disruptor` (red), `feed-defender` (blue), `feed-system` (grey)
- [ ] BroadcastChannel `'hormuz-game'` opened in `js/game-state.js`; message posted on every `addFeedEvent()` and every `marketTick()`
- [ ] Message payload includes: `prob`, `lane`, `activeWeapons`, `round` (phase/number/scores), `feed` (last 20 entries)
- [ ] `market_screen.html` listens on `BroadcastChannel('hormuz-game')` and updates probability display, ticker, and a feed panel
- [ ] When only one tab open (no listener): BroadcastChannel posts silently with no error
- [ ] Test: `addFeedEvent()` pushes to `eventFeed`
- [ ] Test: `eventFeed` caps at 100 — 101st entry drops the oldest
- [ ] Test: `renderFeed()` produces one `.feed-row` per entry (up to 8)
- [ ] Test: `fireWeapon('D01')` → `eventFeed` gains one `type: 'weapon'` entry with text containing `'D01'`
- [ ] Test: 5 `addFeedEvent()` calls → `renderFeed()` shows entries in reverse order (newest first)
- [ ] Test: `startRound()` adds a `type: 'round'` entry to `eventFeed`

## Files changed

- `js/game-state.js` — add `eventFeed: []` to `marketState`; add `addFeedEvent()` and `_broadcastState()` functions; open BroadcastChannel; call `addFeedEvent()` inside `fireWeapon()`
- `js/round-controller.js` — call `addFeedEvent()` in `startRound()`, `endRound()`, `endGameNow()`, `resetGame()`
- `js/market-tick.js` — call `addFeedEvent()` on weapon decay and prob milestone crossings; call `_broadcastState()` at end of each tick
- `js/game-feed.js` — new file; `renderFeed()` DOM writer
- `index.html` — add `#activityFeed` div with CSS; add `<script src="js/game-feed.js">` at Layer 1.5
- `market_screen.html` — add BroadcastChannel listener; add feed panel; replace hardcoded dummy updates with live state from channel
- `tests/phase-05c-feed.html` — new test file, 6 tests

## Blocked by

- Blocked by Phase 5 (round controller functions must exist to call `addFeedEvent()` from)
- Phase 5a must be complete first (so `endGameNow()` exists before `05c` calls it)

## Note for Phase 7

Phase 5c establishes the BroadcastChannel sync layer between index.html and market_screen.html. Phase 7 (market screen extension, issues/07) should scope its work to the market_screen.html UI additions — flow_ratio bar, color threshold backgrounds, audience leaderboard placeholder — and assume the BroadcastChannel and live state delivery are already in place.
