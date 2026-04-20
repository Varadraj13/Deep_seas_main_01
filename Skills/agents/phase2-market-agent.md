# AGENT: Phase 2 — Prediction Market Agent
## Owns units 2A-1, 2A-2, 2B-1, 2B-2, 2B-3

## Purpose

This is the agent that builds the "Wizard of Oz moment". It creates
the Kalshi-style prediction market layer that animates in whenever a
ship is rerouted via `confirmDrag()`. By the end of this phase the
user pinches a ship, drags it off course, confirms the route, and a
panel slides in showing three maritime markets repricing in real time.

> **One sentence summary**: pinch a ship, move it off course, watch
> the world reprice.

## Ownership

| Owns | Never touches |
|---|---|
| `index.html` — new `MARKETS` array, `shiftMarkets()`, `initMarketHistory()`, `renderKalshiOverlay()`, `#kalshiOverlay` HTML/CSS, hooks into `confirmDrag`/`cleanupDrag`/keyboard handler | Anything else in `Test_simulator-main/` |

Phase 2 is still a single-file build. All code lives in `index.html`.

## Prerequisite

Phase 1 must have passed its exit gate before this agent starts.
Specifically, `CONFIG` must exist — Phase 2 adds a `CONFIG.MARKET`
subsection, which requires 1A-1 to be complete.

## Start prompt

Paste this verbatim into a fresh Claude Code session:

```
Read these skill files in order and treat them as binding constraints:

1. Skills/skills/project-context.md
2. Skills/skills/index-html-patterns.md
3. Skills/skills/data-patterns.md
4. Skills/skills/domain-patterns.md

You are the PHASE 2 PREDICTION MARKET AGENT for the Deep Seas /
Malacca Simulator project. Your rules:

- You only touch index.html. You never touch any other file.
- You own exactly 5 units: 2A-1 (MARKETS data + initMarketHistory),
  2A-2 (shiftMarkets function), 2B-1 (Kalshi overlay HTML + CSS),
  2B-2 (renderKalshiOverlay with sparkline), 2B-3 (wire into confirmDrag).
- You work on ONE unit at a time. Stop after each unit and wait for
  "verified, continue" before the next.
- Before writing any code, show me your plan: the lines you will
  edit, the code you will insert. Wait for "go ahead".
- When unsure about visual/CSS patterns, re-read
  Skills/skills/index-html-patterns.md. Treat its palette, font scale,
  and z-index table as hard constraints.
- When unsure about financial math or market pricing, re-read
  Skills/skills/domain-patterns.md. The pricing invariant is
  yesPrice + noPrice === 97 (NOT 100). The probability clamp range
  is [0.05, 0.95].
- The MARKETS array must NEVER be persisted to IndexedDB or
  localStorage. It is session-only by design (see Data Patterns skill
  file rule #3).
- `shiftMarkets()` must be synchronous and return an array for the
  renderer — no async, no await.
- Do not introduce any new libraries. Canvas 2D and plain DOM only
  for the sparkline and animation.

Before we start, confirm you have read all four skill files and list:
- The pricing invariant from domain-patterns.md.
- The sign convention for profitDelta (positive vs negative meaning).
- The z-index the Kalshi overlay must use from index-html-patterns.md.
```

## Units this agent owns

### 2A-1 — MARKETS data model + `initMarketHistory()`

**Scope**:
- Add to the existing `CONFIG` object:
  ```javascript
  CONFIG.MARKET = {
    IMPACT_SCALE: 0.15,
    ANIMATE_DURATION: 1200,
    SPARKLINE_POINTS: 24,
  };
  ```
- Immediately after the `CONFIG` block, declare `const MARKETS = [ ... ]`
  with **exactly three** entries (see `Skills/skills/data-patterns.md`
  for the schema):
  1. `id: 'hormuz-jul26'`, question "Will Strait of Malacca traffic
     normalise before Jul 2026?", probability 0.49, yesPrice 54,
     noPrice 47, volume `"$2.1M"`, history `[]`.
  2. `id: 'fuel-q2'`, question "Will VLSFO fuel prices exceed $700/ton
     by Jun 2026?", probability 0.39, yesPrice 42, noPrice 62, volume
     `"$890K"`, history `[]`.
  3. `id: 'singapore-delay'`, question "Will Singapore Port report
     >20% delay rate in Q2 2026?", probability 0.31, yesPrice 34,
     noPrice 68, volume `"$450K"`, history `[]`.
- Write `function initMarketHistory()` that seeds each market's
  `history` with 24 values via a random walk starting from that
  market's `probability` (±0.03 per step, clamped `[0.05, 0.95]`).
- Call `initMarketHistory()` right after `initVessels()` in the init
  sequence. Do not touch IndexedDB in this unit.

**Verify**:
- In DevTools: `MARKETS[0].history.length` returns 24.
- `MARKETS[0].history.every(v => v >= 0.05 && v <= 0.95)` returns true.
- `MARKETS[0].yesPrice` returns 54.
- `MARKETS[0].yesPrice + MARKETS[0].noPrice` equals 101 (the seeded
  values sum to 101 intentionally — they will normalise to ≤97 after
  the first `shiftMarkets` call).
- No new console errors.

**Traps**:
- `MARKETS is not defined` → declared inside a function scope.
  Must be top-level alongside `CONFIG`.
- History stays empty → `initMarketHistory()` called before `MARKETS`
  was defined. Verify call order.

---

### 2A-2 — `shiftMarkets(profitDelta)` function

**Scope**:
- Add `function shiftMarkets(profitDelta)` immediately after `MARKETS`.
- Normalise: `impactScore = Math.max(-1, Math.min(1, profitDelta / 500000))`.
- Disruption: `disruptionLevel = -impactScore` (negative profit =
  disruption = upward pressure on YES — see domain-patterns.md).
- Per-market multipliers: market 0 → 1.0, market 1 → 0.7, market 2 → 0.5.
- For each market:
  - `p_new = market.probability + disruptionLevel * CONFIG.MARKET.IMPACT_SCALE * multiplier`
  - Clamp `p_new` to `[0.05, 0.95]`.
  - `market.yesPrice = Math.round(p_new * 97)`.
  - `market.noPrice = 97 - market.yesPrice`.  (invariant: sum = 97)
  - Store `oldProb = market.probability` before overwriting.
  - `market.probability = p_new`.
  - `market.history.push(p_new); market.history = market.history.slice(-CONFIG.MARKET.SPARKLINE_POINTS);`
- Return an array: `[{ id, oldProb, newProb, delta }, ...]`.

**Verify**:
```javascript
shiftMarkets(-200000);
MARKETS[0].probability;       // should be higher than 0.49
MARKETS[0].yesPrice + MARKETS[0].noPrice;  // should be 97
MARKETS[0].history.length;    // should be 25 (24 init + 1 new)
```
Run it 5 times with `-200000`. `probability` on market 0 should drift
upward toward (but not past) 0.95.

**Traps**:
- Prices go above 97 or below 0 → clamp missing on `p_new`.
- History keeps growing → `.slice(-SPARKLINE_POINTS)` missed.
- Sign inverted → you forgot `disruptionLevel = -impactScore`.

---

### 2B-1 — Kalshi overlay HTML + CSS

**Scope**:
- Add `<div id="kalshiOverlay">` inside the panel section before
  `</body>`, near the existing `#dragOverlay`.
- Structure: header ("PREDICTION MARKETS" + subtitle), 3 `.market-row`
  rows (`.market-question`, `.market-prob`, `.market-yes`, `.market-no`,
  `canvas.market-sparkline`), footer (`#kalshi-volume` + "You moved
  the market.").
- CSS in the single `<style>` block at the top of `index.html` (do
  NOT create a new style block — see index-html-patterns.md rule).
- Panel: `position: fixed; bottom: 20px; left: 20px; width: 320px;
  background: #0a0a0a; border: 1px solid #1a1a1a; padding: 16px;`
  **border-radius 0** (do not use 6px even though DOCUMENTATION.md
  says so — the project convention is sharp corners). Add
  `box-shadow: 0 0 40px rgba(0,0,0,0.8);`.
- `z-index: 1001` (matches `index-html-patterns.md` layer table).
- `display: none;` by default. `.show` class → `display: block;` with
  a `transform: translateX(-10px) → translateX(0)` slide-in over 0.3s.
- Font scale: question 11px, probability 22px bold, prices 14px,
  subtitle 10px, footer 10px — all Helvetica/Arial, uppercase
  letter-spacing 1–2px on labels (matches project font scale).
- YES button: green border, `#16a34a` accent. NO button: `#cc0000`
  accent (**use the project red**, not `#ef4444` — the project palette
  forbids introducing new reds).

**Verify**:
- In DevTools: `document.getElementById('kalshiOverlay').classList.add('show')`
  → panel slides in from bottom-left with three empty rows.
- It does not visually collide with `#dragOverlay` or `#controls`.
- Sharp corners everywhere. Dark palette matches the rest of the app.

**Traps**:
- Panel invisible → `.show` rule specificity lost to `display: none`.
  Use `#kalshiOverlay.show { display: block; }`.
- Border-radius accidentally kept → search the CSS for `border-radius`
  in any new rule; must be 0 or absent.
- Overlaps `#dragOverlay` → nudge `bottom` or `left` until clear.

---

### 2B-2 — `renderKalshiOverlay(shiftResults)` + sparkline

**Scope**:
- Add `function renderKalshiOverlay(shiftResults)` after `shiftMarkets`.
- For each market index 0..2:
  - Update `#prob-{i}` text to `Math.round(MARKETS[i].probability * 100) + '%'`.
  - Animate the number counting from `oldProb` to `newProb` over
    `CONFIG.MARKET.ANIMATE_DURATION` ms using `requestAnimationFrame`.
    Use `_lerpVal()` (or a locally-scoped helper — do NOT create a
    global `lerp`, that collides with Chart.js).
  - Update `#yes-{i}` text to `MARKETS[i].yesPrice + '¢'`.
  - Update `#no-{i}` text to `MARKETS[i].noPrice + '¢'`.
  - Flash `#yes-{i}` border `#16a34a` for 1 second if `newProb > oldProb`.
  - Draw sparkline on `#spark-{i}`:
    - `ctx.clearRect(0, 0, w, h)`.
    - Walk `MARKETS[i].history` with `ctx.moveTo` / `lineTo`.
    - Flip y: `y = h - (value * h)`.
    - Stroke colour: `#16a34a` if last value > first, else `#cc0000`.
    - Draw 3px cyan dot at the last point.
- After updating all 3 markets, add `.show` class to `#kalshiOverlay`.
- Update `#kalshi-volume` with a combined volume string.

**Verify**:
```javascript
const results = shiftMarkets(-300000);
renderKalshiOverlay(results);
```
Panel slides in. Probabilities animate from old to new. Sparklines
visible with cyan dot at the end. Yes/No prices legible.

**Traps**:
- Sparkline flat → history empty (2A-1 wasn't verified).
- Animation never stops → rAF callback missing a termination condition.
  Use a start time and check `elapsed >= CONFIG.MARKET.ANIMATE_DURATION`.
- Console complains `lerp is not a function` → you tried to use
  Chart.js's `lerp`. Use `_lerpVal` or inline the interpolation.

---

### 2B-3 — Wire into `confirmDrag()` / `cleanupDrag()` + K shortcut

**Scope**:
- In `confirmDrag()` (around line 2517), immediately after the
  existing `addDBEvent(...)` call, add:
  ```javascript
  const shiftResults = shiftMarkets(dragFinancials.profitDelta);
  renderKalshiOverlay(shiftResults);
  ```
- In `cleanupDrag()` (around line 2552), add:
  ```javascript
  document.getElementById('kalshiOverlay').classList.remove('show');
  ```
- In the script #1 keyboard handler (around line 2712 — see
  index-html-patterns.md keyboard shortcut pattern), add:
  ```javascript
  if (e.code === 'KeyK') document.getElementById('kalshiOverlay').classList.toggle('show');
  ```
  Add it to script #1 specifically (not script #2) — script #2 may
  not have loaded if MediaPipe failed.
- That is all. Do not modify any other logic in `confirmDrag` or
  `cleanupDrag`.

**Verify** (end-to-end):
1. Open `http://localhost:8000`.
2. Press E (EasyHands) — cyan line appears.
3. Pinch a ship, drag it significantly off course.
4. Release pinch, click Confirm Route.
5. Kalshi panel slides in with three shifted markets.
6. Press Escape — both overlays hide.
7. Repeat — markets shift cumulatively, not reset.
8. Press K — panel toggles on/off manually.

**Traps**:
- Panel doesn't appear → the two new lines are inside an `if` branch
  that didn't execute. Put them at the top of `confirmDrag` instead.
- Panel stays visible after cancel → `cleanupDrag()` wasn't the
  function modified (easy to edit a duplicate named `cancelDrag`).
- Markets reset on every drag → you recreated `MARKETS` or called
  `initMarketHistory()` inside `shiftMarkets`. Neither should happen.

## Phase 2 exit gate

- [ ] `CONFIG.MARKET` exists with IMPACT_SCALE, ANIMATE_DURATION,
      SPARKLINE_POINTS.
- [ ] `MARKETS` contains exactly 3 markets with seeded 24-point history.
- [ ] `shiftMarkets(-200000)` shifts probabilities and preserves
      `yesPrice + noPrice === 97`.
- [ ] `#kalshiOverlay` matches the project palette — dark, sharp
      corners, project red, no gradients.
- [ ] `renderKalshiOverlay()` animates the probability number and
      draws a working sparkline with a cyan dot at the last point.
- [ ] Pinch → drag → confirm → Kalshi panel appears automatically.
- [ ] Escape / cancel hides both overlays.
- [ ] K key toggles the panel manually.
- [ ] Zero console errors throughout the full flow.
- [ ] Markets are **not** persisted — reloading the page resets them.

When all boxes are checked, say to the orchestrator:
`Phase 2 exit gate passed. Ready for Phase 3 handoff.`
