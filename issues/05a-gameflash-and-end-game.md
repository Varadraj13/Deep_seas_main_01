# Phase 5a: gameFlash fix + End Game button

**Type:** AFK

## What to build

Two small corrections to the round controller and game state that improve operator and audience legibility.

**Fix 1 — gameFlash on every weapon fire:** Currently `fireWeapon()` only triggers a center-screen flash on the *first* weapon fired by each player per round (guarded by `firstMoveFlags`). Every weapon fire should produce a flash so the audience can see each play in real time. Flash text format: `DISRUPTOR · D01 STRAIT BLOCKADE +22%` (role + weapon id + name + delta). The "GO DEFENDER!" / "GO DISRUPTOR!" first-move prompts are retired — the per-weapon flash communicates the same information more richly.

**Fix 2 — End Game button:** There is no way for the operator to hard-stop the game mid-round. A new `endGameNow()` function reads `hormuz_lane` and immediately sets `phase: 'over'`, bypasses the best-of-3 scoring system, pauses everything, and flashes the result for 4 seconds. A red END GAME button in `#roundControls` calls it.

## Acceptance criteria

- [ ] Every call to `fireWeapon()` triggers `showFlash()` with text containing the weapon id, weapon name, and prob delta
- [ ] Flash text includes the player role: `DISRUPTOR · ...` or `DEFENDER · ...`
- [ ] Flash fires on every weapon fire, not just the first per player per round
- [ ] `firstMoveFlags` guard removed from `fireWeapon()` — field remains in `marketState.round` but is no longer read by `fireWeapon()`
- [ ] `endGameNow()` defined in `js/round-controller.js`
- [ ] `endGameNow()` with `hormuz_lane: 'closed'` → `phase: 'over'`, flash reads `STRAIT CLOSED — DISRUPTOR WINS`
- [ ] `endGameNow()` with `hormuz_lane: 'open'` (default) → flash reads `STRAIT OPEN — DEFENDER WINS`
- [ ] `endGameNow()` calls `pauseTick()` and sets `playing = false`
- [ ] `endGameNow()` flash duration is 4000ms (longer than standard 2000ms weapon flashes)
- [ ] `endGameNow()` works from any phase — no throw if called during `'idle'` or `'roundEnd'`
- [ ] Red END GAME button visible in `#roundControls` in index.html
- [ ] Test: `fireWeapon('D01')` → showFlash called with text containing `'D01'` and `'+22'`
- [ ] Test: `fireWeapon('R01')` → flash text contains `'DEFENDER'`
- [ ] Test: `fireWeapon('D01')` called twice — second call is no-op (weapon already active), showFlash called only once
- [ ] Test: `endGameNow()` with lane closed → `phase: 'over'`, flash contains `'DISRUPTOR WINS'`
- [ ] Test: `endGameNow()` with lane open → flash contains `'DEFENDER WINS'`
- [ ] Test: `endGameNow()` from `phase: 'idle'` does not throw

## Files changed

- `js/game-state.js` — remove `firstMoveFlags` conditional from `fireWeapon()`; add unconditional `showFlash()` call with formatted weapon text
- `js/round-controller.js` — add `endGameNow()` function
- `index.html` — add red END GAME button to `#roundControls`
- `tests/phase-05a-corrections.html` — new test file, 6 tests

## Blocked by

- Blocked by Phase 5 (round controller, `#roundControls`, `showFlash()` must all exist)
