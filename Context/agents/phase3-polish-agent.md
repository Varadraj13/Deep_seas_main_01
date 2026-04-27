# AGENT: Phase 3 — Projector Polish Agent
## Owns units 3A-1, 3A-2

## Purpose

This agent makes Phase 2's Kalshi overlay legible on a projector at
90-person room scale, and adds a demo-reset shortcut so the markets
can be cleanly reset between runs without reloading the page.

It does **not** add new functionality or new markets. Every change is
either a CSS size bump or a single keyboard shortcut.

## Ownership

| Owns | Never touches |
|---|---|
| `index.html` — CSS rules for `#kalshiOverlay`, `resetMarkets()` function, keyboard handler for R | Anything else. Does not touch `shiftMarkets`, `renderKalshiOverlay`, `MARKETS`, `CONFIG`, any sim logic |

## Prerequisite

Phase 2 must have passed its exit gate. The full
`pinch → drag → confirm → Kalshi panel appears` flow must already work.

## Start prompt

Paste this verbatim into a fresh Claude Code session:

```
Read these skill files in order and treat them as binding constraints:

1. Skills/skills/project-context.md
2. Skills/skills/index-html-patterns.md
3. Skills/skills/domain-patterns.md

You are the PHASE 3 PROJECTOR POLISH AGENT for the Deep Seas /
Malacca Simulator project. Your rules:

- You only touch index.html. You never touch any other file.
- You own exactly 2 units: 3A-1 (Kalshi projection sizing — CSS only)
  and 3A-2 (resetMarkets + R key shortcut).
- You work on ONE unit at a time. Stop after each and wait for
  "verified, continue".
- Before writing, show me your plan: the exact CSS selectors you will
  edit (3A-1) and the exact function + handler lines you will add (3A-2).
- You do not change the behaviour of shiftMarkets, renderKalshiOverlay,
  or MARKETS. You only change CSS and add a reset path.
- You do not introduce new colours, new fonts, or new libraries. The
  palette is fixed (see Skills/skills/index-html-patterns.md).
- For 3A-2, you must preserve any existing KeyR behaviour — if the
  Kalshi overlay is NOT showing, KeyR must keep doing whatever it did
  before (it currently toggles the route overlay). Only override it
  when the overlay is visible.

Before we start, confirm you have read all three skill files and list:
- The font size hierarchy from index-html-patterns.md.
- The rule about not adding new libraries or build steps.
- Whether the Kalshi overlay currently already exists (yes/no).
```

## Units this agent owns

### 3A-1 — Kalshi panel projection sizing

**Scope** (CSS only — do not touch any JavaScript):
- `.market-prob`: 22px → 32px.
- `.market-yes`, `.market-no`: 14px → 16px, height 36px.
- `.market-question`: 11px → 13px.
- `#kalshiOverlay`: width 320px → 380px.
- `#kalshiOverlay`: confirm `box-shadow: 0 0 40px rgba(0,0,0,0.8)` is
  present (Phase 2 should already have added it; if not, add it here).
- `.kalshi-footer` or equivalent ("You moved the market." line): 10px
  → 12px, colour `#888888` (more visible).

**Do not**:
- Change any other CSS property (no border-radius, no new colours, no
  margin/padding tweaks unless absolutely required to prevent text
  clipping at the new sizes).
- Restructure the panel HTML.
- Touch any JavaScript.

**Verify**:
- Open the Kalshi panel with K key.
- Stand ~3 metres away from the monitor (or zoom the browser to 300%
  as a proxy).
- Read the probability percentage and Yes¢ / No¢ prices comfortably.
- If legible, done. Otherwise bump sizes another 2px increments.

**Traps**:
- Text wraps or clips → `max-width` on `.market-question` needs to
  grow from 200px to match the new panel width (~260px).
- Buttons misalign → new height 36px forces a flex/grid tweak; keep
  it minimal.

---

### 3A-2 — `resetMarkets()` + R-key shortcut

**Scope**:
- Store original market values once at init time. The cleanest place
  is inside `initMarketHistory()` or immediately after it:
  ```javascript
  MARKETS.forEach(m => {
    m._originalProbability = m.probability;
    m._originalYesPrice    = m.yesPrice;
    m._originalNoPrice     = m.noPrice;
  });
  ```
- Add `function resetMarkets()`:
  ```javascript
  function resetMarkets() {
    MARKETS.forEach(m => {
      m.probability = m._originalProbability;
      m.yesPrice    = m._originalYesPrice;
      m.noPrice     = m._originalNoPrice;
      m.history     = [];
    });
    initMarketHistory();
    // Re-render from a zero-delta shift so the panel refreshes.
    renderKalshiOverlay(MARKETS.map(m => ({
      id: m.id, oldProb: m.probability, newProb: m.probability, delta: 0
    })));
    // Optional: flash "RESET" on the header for 1 second.
    const hdr = document.querySelector('#kalshiOverlay .kalshi-header');
    if (hdr) {
      const prev = hdr.textContent;
      hdr.textContent = 'RESET';
      setTimeout(() => { hdr.textContent = prev; }, 1000);
    }
  }
  ```
- In the script #1 keyboard handler, override R when the overlay is
  visible:
  ```javascript
  if (e.code === 'KeyR') {
    const k = document.getElementById('kalshiOverlay');
    if (k && k.classList.contains('show')) {
      e.preventDefault();
      resetMarkets();
      return;   // do not fall through to the existing R behaviour
    }
    // ... existing R handler stays here
  }
  ```
- Ensure the existing R behaviour still fires when `#kalshiOverlay`
  is not showing.

**Verify**:
1. Run a full demo: pinch → drag → confirm → markets shift visibly.
2. Press R.
3. Markets return to their starting values. Sparklines reseed.
4. Header flashes "RESET" for ~1 second, then returns.
5. Repeat. Consistent behaviour every time.
6. Close the Kalshi panel (Escape / K). Press R. The pre-existing
   R behaviour still works (no regression).

**Traps**:
- R resets markets even when the panel is closed → missing the
  `classList.contains('show')` check.
- Markets reset but sparklines don't reseed → `initMarketHistory()`
  not called or called before `history` was cleared.
- Existing R handler broken → `return` missing after the reset branch.

## Phase 3 exit gate

- [ ] Kalshi probability, Yes¢ and No¢ prices readable from ~3 metres.
- [ ] Panel still fits on screen without overlapping `#dragOverlay` or
      `#controls`.
- [ ] Pressing R while the Kalshi panel is visible resets all three
      markets to their starting values and reseeds the sparklines.
- [ ] Pressing R while the Kalshi panel is hidden preserves the
      pre-existing R behaviour.
- [ ] Zero console errors.
- [ ] Full demo loop works: EasyHands → pinch → drag → confirm →
      Kalshi panel → R → reset → repeat.

When all boxes are checked, say to the orchestrator:
`Phase 3 exit gate passed. Ready for demo rehearsal.`
