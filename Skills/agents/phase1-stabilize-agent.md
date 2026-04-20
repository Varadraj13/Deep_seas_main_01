# AGENT: Phase 1 — Stabilize Agent
## Owns units 1A-1, 1A-2, 1B-1

## Purpose

This agent makes the existing `index.html` bulletproof before anything
new is built on top of it. It consolidates scattered constants into a
single `CONFIG` object, adds a MediaPipe load timeout fallback, and
pre-warms camera permissions on page load.

It does **not** add any new visible features. If the user sees any
visual change after Phase 1 lands, something is wrong.

## Ownership

| Owns | Never touches |
|---|---|
| `index.html` — CONFIG block, MediaPipe load section, MediaPipe init section | Anything else in `Test_simulator-main/` |

Phase 1 is a single-file refactor. The agent modifies `index.html`
only. No new files, no deletions.

## Start prompt

Paste this verbatim into a fresh Claude Code session:

```
Read these skill files in order and treat them as binding constraints:

1. Skills/skills/project-context.md
2. Skills/skills/index-html-patterns.md
3. Skills/skills/data-patterns.md
4. Skills/skills/domain-patterns.md

You are the PHASE 1 STABILIZE AGENT for the Deep Seas / Malacca
Simulator project. Your rules:

- You only touch index.html. You never touch any other file.
- You own exactly 3 units: 1A-1 (CONFIG block), 1A-2 (MediaPipe
  timeout fallback), 1B-1 (silent camera pre-warm).
- You work on ONE unit at a time. After finishing a unit you stop
  and wait for me to say "verified, continue" before starting the next.
- Before writing any code, show me your plan: exact lines you will
  change, exact code you will add. Wait for "go ahead" before editing.
- When unsure about any pattern, re-read Skills/skills/index-html-patterns.md.
- The project must still run via `python -m http.server 8000` after
  every unit. No build steps. No new libraries.
- The three critical rules you must never violate:
  1. Do not rename `_lerpVal` back to `lerp` (Chart.js global collision).
  2. Do not remove the try/catch around `updateSim(dt)` in animate().
  3. Do not introduce an await on `dbPut()` calls — fire-and-forget
     is intentional.

Before we start, confirm you have read all four skill files and list:
- The 3 most important constraints from project-context.md.
- The 3 most important constraints from index-html-patterns.md.
- Where constants currently live that will be consolidated by 1A-1
  (give me the line numbers from project-context.md).
```

## Units this agent owns

### 1A-1 — Consolidate constants into `const CONFIG = {}`

**Scope**:
- Create `const CONFIG = { ... }` at the top of script #1 (around
  line 661).
- Move these constants in:
  - `COLLISION_DIST_NM` (currently line 1091)
  - `FUEL_PRICE_PER_TON`, `CREW_COST_PER_HOUR`, `PORT_FEE_BASE`,
    `INSURANCE_RATE` (currently lines 2193-2196)
  - `HAND_SMOOTH` (currently line 2748)
  - `PINCH_THRESHOLD` (currently line 2795)
  - `GRAB_RADIUS` (currently line 2820)
- Replace every reference to the old constant names with `CONFIG.NAME`.
- Do not change any logic, only the references.

**Verify**:
- `http://localhost:8000` loads cleanly.
- Ships move. EasyHands still works.
- DevTools console has zero new errors.
- No stray references to the old constant names remain (search the
  whole file for e.g. `FUEL_PRICE_PER_TON` — it should only appear
  inside `CONFIG`).

**Traps**:
- `CONFIG is not defined` → the CONFIG block landed inside a function.
  Move it above all functions.
- Pinch stops working → a `PINCH_THRESHOLD`/`GRAB_RADIUS` reference
  in script #2 was missed. Search script #2 specifically.

---

### 1A-2 — MediaPipe load timeout + mouse-drag fallback

**Scope**:
- In script #2 around line 2765, wrap the existing `loadMediaPipe()`
  IIFE in `Promise.race` against a 10-second timeout.
- On timeout: show a yellow banner `<div id="mediapipe-warning">` at
  top-centre of the map with "Hand tracking loading slowly — mouse
  drag available", auto-call `toggleDragMode()` to activate mouse drag.
- On success before timeout: hide the banner if it was shown, proceed
  normally.
- The banner HTML and CSS must match the existing terminal palette
  (see `Skills/skills/index-html-patterns.md` — dark panel background
  `#0a0a0a`, border `#1a1a1a`, 10px Helvetica text, sharp corners).
- Do not change any other MediaPipe logic.

**Verify**:
- Temporarily break the CDN URL (append `_BREAK` to the filename).
  Reload. Within 10 seconds the banner appears and mouse drag activates.
- Restore the URL. Reload. Banner never appears. Hand mode works.

**Traps**:
- Banner never shows → `Promise.race` not awaited correctly.
- Drag mode activates even on success → race condition; timeout is
  too short. Bump to 15000ms if demo wifi is slow.
- `toggleDragMode is not defined` → called before it was declared.
  Defer with `setTimeout(() => toggleDragMode(), 0)`.

---

### 1B-1 — Silent camera permission pre-warm

**Scope**:
- In script #2, immediately after `mediaPipeReady = true` (around line
  2776), add:
  ```javascript
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => stream.getTracks().forEach(t => t.stop()))
    .catch(err => console.warn('Camera pre-warm failed:', err));
  ```
- That's it. 6–8 lines including the comment. Do not start the
  MediaPipe camera here — that still happens in `toggleHandMode()`.

**Verify**:
- Hard-reload (Ctrl+Shift+R). Chrome shows camera permission prompt
  within 3 seconds. Click Allow.
- Press H (Hand Mode). No second prompt. Camera activates immediately.
- Check the webcam LED turns off after the pre-warm (the
  `stream.getTracks().forEach(t => t.stop())` line).

**Traps**:
- Running from `file://` → `getUserMedia` silently fails. Confirm
  `http://localhost:8000`.
- Camera light stays on → `getTracks().forEach(t => t.stop())` missed.
- Popup still appears on Hand Mode → pre-warm fired before MediaPipe
  was ready. Check the `.then()` chain.

## Phase 1 exit gate

Before handing off to the Phase 2 agent, all of these must be true:

- [ ] `const CONFIG = { ... }` holds all 8 constants listed above.
- [ ] Searching for each raw constant name finds it only inside `CONFIG`.
- [ ] `#mediapipe-warning` banner appears within 10 seconds when the
      CDN is unreachable.
- [ ] Camera permission granted silently on page load.
- [ ] Hand Mode button triggers no permission popup.
- [ ] Zero new console errors.
- [ ] Ships still move, EasyHands still pinches, `confirmDrag()` still
      updates the drag overlay.

When all boxes are checked, say to the orchestrator:
`Phase 1 exit gate passed. Ready for Phase 2 handoff.`
