# Deep Seas — Prediction Market Layer
## Granular Build Guide for Claude Code

---

## Project Definition

**What it does in one sentence:**
A real-time maritime traffic simulator where hand gestures reroute ships,
triggering a Kalshi-style prediction market overlay that reveals the user
as the hidden market manipulator behind global trade disruption events.

**End state:**
Single `index.html`, runs via `python -m http.server` in Chrome. User
pinch-grabs a ship with EasyHands, drags it off course, and a Kalshi-style
panel slides in showing maritime prediction markets (Yes¢/No¢, probability
curve) reacting in real time to the manipulation. 90 people in a room
understand immediately what's happening.

**Data chain:**
```
Webcam → MediaPipe pinch → Ship rerouted →
Financial delta (profitDelta) → Market probability shift →
Kalshi overlay renders (Yes¢ / No¢ + sparkline)
```

**Skill files to load at start of every Claude Code session:**
- `dev-practices.md`
- `phase-documentation-process.md`

---

## Before you start

```bash
# In your project folder:
python -m http.server 8000
# Open: http://localhost:8000
# Keep this running in a separate terminal tab throughout all sessions
```

Verify: `index.html` loads, ships move, EasyHands pinch works.
If this doesn't work, stop. Fix it before touching any code.

---

# Phase 1 — Stabilize
## Make the foundation bulletproof before adding anything

**What you're building:** A clean, crash-resistant version of the existing
simulation. No new features. Just making what exists reliable.

**Why it matters:** Every unit in Phase 2 builds on this. A bug introduced
here will be invisible until it surfaces mid-demo at Verci Flatiron.

**Output:** A working `index.html` where MediaPipe loads reliably,
EasyHands pinch-grabs ships without crashing, and the animation loop
never dies silently.

**Connects to:** Phase 2 attaches the prediction market trigger directly
to `confirmDrag()` — that function must be solid.

---

# Subphase 1A — Configuration & Constants (2 units)

## Before you start 1A
Open `index.html`. Confirm ships are moving and EasyHands works.
Constants are currently scattered: `COLLISION_DIST_NM` at line 1091,
financial constants at lines 2193-2196, hand tracking constants at
lines 2748/2795/2820. This subphase consolidates them.

---

## Unit 1A-1 — CONFIG block

### What this is and why it exists
Right now constants are scattered across the file in 3 different locations.
When you need to tune `PINCH_THRESHOLD` for a demo, you have to hunt for it.
A single CONFIG object at the top of the JS section means one place to
look, one place to change. Think of it like a settings panel for the
whole simulation.

### What it does
- Creates a single `const CONFIG = {}` object at the top of the first
  `<script>` block (around line 661)
- Moves all constants into it:
  `COLLISION_DIST_NM, FUEL_PRICE_PER_TON, CREW_COST_PER_HOUR,
  PORT_FEE_BASE, INSURANCE_RATE, PINCH_THRESHOLD, GRAB_RADIUS, HAND_SMOOTH`
- Updates all references to use `CONFIG.CONSTANT_NAME`

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, I want to consolidate all constants into a single CONFIG
object. Show me what you're going to do before writing anything.

Specifically:
- Find these constants: COLLISION_DIST_NM (line 1091), FUEL_PRICE_PER_TON,
  CREW_COST_PER_HOUR, PORT_FEE_BASE, INSURANCE_RATE (lines 2193-2196),
  HAND_SMOOTH (line 2748), PINCH_THRESHOLD (line 2795), GRAB_RADIUS (line 2820)
- Create const CONFIG = { ...all constants... } at the top of the first
  <script> block
- Replace every reference to the old constant names with CONFIG.name
- Do not change any logic, only the constant references
- Show me the CONFIG object and the list of lines you'll change before writing
```

### What's happening behind the scenes
JavaScript `const` at the top level creates a module-scoped constant.
By putting them all in one object, you get one source of truth. If
`CONFIG.PINCH_THRESHOLD = 0.07` is too sensitive for tomorrow's lighting,
you change one number in one place. Previously you'd need to remember
which of 3 script blocks it was in.

### How to verify
Open `http://localhost:8000`. Ships move. EasyHands works. Pinch grabs
a ship. No console errors. Check DevTools console — should be clean.
Expected: zero errors, identical behavior to before.

Connects to 1A-2: CONFIG will gain a `MARKET` section in the next unit.

### Where to look when debugging
- `CONFIG is not defined` → CONFIG block is inside a function scope,
  not at the top level. Move it above all functions.
- Ships freeze → a constant reference wasn't updated. Search for the
  raw constant name (e.g. `FUEL_PRICE_PER_TON`) — if it still exists
  outside CONFIG, that's the one missed.
- Pinch stops working → `PINCH_THRESHOLD` or `GRAB_RADIUS` reference
  missed. Check the hand tracking script block.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (constants section + all references)

---

## Unit 1A-2 — MediaPipe offline fallback

### What this is and why it exists
MediaPipe loads 3 scripts from jsDelivr CDN. If the CDN is slow (90
people on Verci Flatiron wifi), the scripts time out and hand tracking
never initializes — silently. The simulation still runs but pressing
Hand Mode shows nothing. This unit adds a timeout + user-visible warning
so you know immediately if it's failed, rather than discovering it
during the demo.

### What it does
- Wraps the existing `loadMediaPipe()` async function with a 10-second
  timeout race
- If timeout fires: shows a visible banner "Hand tracking unavailable —
  mouse drag mode active" and auto-enables mouse drag mode as fallback
- If load succeeds: existing behavior, no change

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, in the MediaPipe loading section (around line 2765),
I want to add a timeout fallback. Show me what you're going to do
before writing.

Specifically:
- Wrap the loadMediaPipe() async IIFE with a Promise.race against a
  10-second timeout
- If timeout fires: set mediaPipeReady = false, show a yellow banner
  div (id="mediapipe-warning") with text "Hand tracking loading slowly
  — mouse drag available", auto-call toggleDragMode() to enable mouse drag
- If load succeeds before timeout: hide the banner if it showed, proceed
  as normal
- The banner should appear at top-center of the map, styled like the
  existing warning patterns in the file
- Do not change any other MediaPipe logic
```

### What's happening behind the scenes
`Promise.race([promise1, promise2])` resolves with whichever promise
finishes first. By racing the load against a `new Promise(resolve =>
setTimeout(resolve, 10000))`, you get a guaranteed response within 10
seconds no matter what the CDN does. This is the standard pattern for
network timeouts in browser JS.

### How to verify
Temporarily change the CDN URL to something invalid (e.g. add `_BREAK`
to the filename), reload, wait 10 seconds. Banner should appear and
mouse drag should activate automatically. Restore the URL. Reload.
Banner should not appear, hand mode should work.

Connects to 1B-1: camera permission pre-warm happens after MediaPipe
confirms loaded.

### Where to look when debugging
- Banner never shows → timeout promise isn't resolving. Check that
  `Promise.race` is awaited correctly.
- Drag mode activates even when MediaPipe loads fine → race condition,
  timeout is too short. Increase to 15000ms.
- Console shows `toggleDragMode is not defined` → function is defined
  later in the file than the script block. Move the call inside a
  `setTimeout(() => toggleDragMode(), 0)` to defer execution.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (MediaPipe loading section ~line 2765)

---

### Subphase 1A complete — what you have
- [ ] All constants in one CONFIG object, tunable from one place
- [ ] MediaPipe load failure surfaces visibly within 10 seconds
- [ ] Mouse drag auto-activates as fallback if hand tracking fails
- [ ] Zero new console errors
- [ ] Ships still move, EasyHands still works

---

# Subphase 1B — Camera Pre-warm (1 unit)

## Before you start 1B
1A must be verified complete. Ships moving, no console errors.

---

## Unit 1B-1 — Silent camera permission pre-warm

### What this is and why it exists
When you press Hand Mode mid-demo, Chrome shows a permission popup:
"localhost wants to use your camera." The room sees this. It breaks
the flow. This unit requests camera permission silently on page load
so by the time you press Hand Mode, Chrome already has permission and
skips the popup entirely.

### What it does
- On page load (after MediaPipe confirms ready), calls
  `navigator.mediaDevices.getUserMedia({ video: true })` once silently
- Immediately stops the stream (we don't need it yet, just the permission)
- If permission denied: logs warning, does not crash
- Hand Mode button press then skips the permission dialog

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, after the mediaPipeReady = true line (around line 2776),
add a silent camera permission pre-warm. Show me what you're going to
do before writing.

Specifically:
- After mediaPipeReady is set to true, call navigator.mediaDevices
  .getUserMedia({ video: true })
- In the .then() handler: immediately call stream.getTracks().forEach(
  t => t.stop()) — this releases the camera but keeps the permission
- In the .catch() handler: console.warn only, no crash, no UI change
- Do not start the actual MediaPipe camera here — that still happens
  in toggleHandMode()
- This should be 6-8 lines maximum
```

### What's happening behind the scenes
Browsers cache camera permissions per origin. Once you call
`getUserMedia` and the user clicks Allow, Chrome remembers it for
`localhost:8000`. The next call (from MediaPipe's Camera utility)
skips the dialog entirely. By stopping the stream immediately, you're
not wasting resources — you just needed the permission token.

### How to verify
Hard-reload the page (Cmd+Shift+R). Within 3 seconds, Chrome should
show the camera permission prompt once. Click Allow. Now press Hand
Mode — no second prompt should appear. Camera activates immediately.

### Where to look when debugging
- Permission prompt still appears on Hand Mode → getUserMedia call
  isn't firing. Check it's inside the `.then()` of the MediaPipe
  load, not outside it.
- Camera light stays on after pre-warm → `getTracks().forEach(t =>
  t.stop())` missed. The stream isn't being released.
- `getUserMedia is not a function` → running from `file://` not
  `localhost`. Must be using `python -m http.server`.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (MediaPipe init section ~line 2776)

---

### Subphase 1B complete — what you have
- [ ] Camera permission granted silently on page load
- [ ] Hand Mode activates immediately with no popup
- [ ] Camera releases immediately after permission granted

---

### Phase 1 complete — verify gate
Before moving to Phase 2:
- [ ] Open `http://localhost:8000`
- [ ] Ships move immediately
- [ ] Press EasyHands (E) — cyan targeting line appears
- [ ] Pinch a ship — it grabs, route preview shows
- [ ] Confirm route — financial overlay updates
- [ ] Hand Mode activates with no permission popup
- [ ] No console errors throughout

If any of these fail, fix before Phase 2.

---

# Phase 2 — Prediction Market Layer
## The Wizard of Oz moment

**What you're building:** When a ship is rerouted via hand gesture, a
Kalshi-style prediction market panel slides in showing maritime trade
disruption markets reacting to the manipulation. Yes¢/No¢ prices shift.
A probability sparkline moves. The user is revealed as the market mover.

**Why it matters:** This is the conceptual payload of the whole project.
Without this, it's a maritime simulator. With this, it's a statement
about who actually moves markets.

**Output:** A `kalshi-overlay` panel that appears on `confirmDrag()`,
shows 2-3 simulated maritime prediction markets, animates probability
shifts based on `profitDelta`, and feels like a real trading terminal.

**Connects to:** Phase 3 (visual polish) takes this panel and makes it
legible at 90-person scale on a projector.

---

# Subphase 2A — Market Data Model (2 units)

## Before you start 2A
Phase 1 verify gate must be complete.

---

## Unit 2A-1 — Market data structure + CONFIG.MARKET

### What this is and why it exists
The prediction market needs data to display: market names, current
probabilities, Yes/No prices. This unit defines that data structure
and seeds it with simulated but realistic maritime markets modeled
on the real Kalshi "Strait of Hormuz" market you found. No UI yet —
just the data model.

### What it does
- Adds `MARKET` section to CONFIG object:
```javascript
CONFIG.MARKET = {
  IMPACT_SCALE: 0.15,      // max probability shift per drag (15%)
  ANIMATE_DURATION: 1200,  // ms for price animation
  SPARKLINE_POINTS: 24,    // history points in sparkline
}
```
- Creates `const MARKETS` array with 3 simulated markets:
```javascript
const MARKETS = [
  {
    id: 'hormuz-jul26',
    question: 'Will Strait of Malacca traffic normalize before Jul 2026?',
    probability: 0.49,   // current probability of YES
    yesPrice: 54,        // cents
    noPrice: 47,
    volume: '$2.1M',
    history: []          // sparkline data, populated on init
  },
  {
    id: 'fuel-q2',
    question: 'Will VLSFO fuel prices exceed $700/ton by Jun 2026?',
    probability: 0.39,
    yesPrice: 42,
    noPrice: 62,
    volume: '$890K',
    history: []
  },
  {
    id: 'singapore-delay',
    question: 'Will Singapore Port report >20% delay rate in Q2 2026?',
    probability: 0.31,
    yesPrice: 34,
    noPrice: 68,
    volume: '$450K',
    history: []
  }
]
```
- Populates `history` arrays with 24 realistic random-walk values
  around the starting probability on init

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, I want to add a prediction market data model.
Show me what you're going to do before writing.

Specifically:
- Add a MARKET config section to the existing CONFIG object with:
  IMPACT_SCALE: 0.15, ANIMATE_DURATION: 1200, SPARKLINE_POINTS: 24
- After the CONFIG block, create a const MARKETS array with exactly
  3 market objects as I'll describe. Each has: id, question,
  probability (0-1), yesPrice (cents), noPrice (cents), volume
  (string), history (array)
- Markets to create:
  1. Strait of Malacca traffic normalize before Jul 2026 — prob 0.49,
     yes 54¢, no 47¢, vol $2.1M
  2. VLSFO fuel prices exceed $700/ton by Jun 2026 — prob 0.39,
     yes 42¢, no 62¢, vol $890K
  3. Singapore Port >20% delay rate Q2 2026 — prob 0.31, yes 34¢,
     no 68¢, vol $450K
- After creating MARKETS, write an initMarketHistory() function that
  populates each market's history array with 24 values using a
  random walk starting from the market's probability (±0.03 per step,
  clamped 0.05-0.95)
- Call initMarketHistory() right after initVessels() in the init section
- Do not build any UI yet
```

### What's happening behind the scenes
A random walk means each new value = previous value + small random
change. This produces the jagged-but-trending lines you see on real
prediction market charts, as opposed to random noise (too chaotic) or
a flat line (too boring). Clamping between 0.05-0.95 prevents the
probability from hitting 0% or 100% which would look broken.

### How to verify
Open browser console. Type `MARKETS[0].history`. Should return an
array of 24 numbers between 0.05 and 0.95. Type `MARKETS[0].yesPrice`.
Should return `54`. No console errors on load.

Connects to 2A-2: the shift function reads and writes these same objects.

### Where to look when debugging
- `MARKETS is not defined` → declared inside a function or wrong
  scope. Must be at top level alongside CONFIG.
- History array is empty → `initMarketHistory()` not called, or called
  before MARKETS is defined. Check call order in init section.
- Values outside 0-1 → clamp logic missing or wrong. Check
  `Math.min(0.95, Math.max(0.05, value))`.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (CONFIG block + new MARKETS constant + init section)

---

## Unit 2A-2 — Market shift function

### What this is and why it exists
When a ship is rerouted, the markets need to react. This function takes
`profitDelta` (already calculated in `confirmDrag()`) and translates it
into probability shifts across all 3 markets. Each market shifts
differently — some go up, some go down — to create the feeling of a
real interconnected system responding to a disruption event.

### What it does
- Creates `function shiftMarkets(profitDelta)`:
  - Normalizes profitDelta to a -1 to +1 impact score
    (large negative delta = maximum disruption = larger market moves)
  - Shifts each market's probability by a different amount and direction:
    - Market 1 (normalize traffic): disruption → YES probability goes UP
    - Market 2 (fuel price): disruption → YES probability goes UP
    - Market 3 (port delay): disruption → YES probability goes UP
  - Recalculates yesPrice and noPrice from new probability
    (yesPrice = Math.round(probability * 100), noPrice = 100 - yesPrice - 3)
  - Appends new probability to each market's history array
  - Trims history to last SPARKLINE_POINTS values
- Does NOT update the UI — that's 2B-1

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, after the MARKETS definition, I want to add a
shiftMarkets function. Show me what you're going to do before writing.

Specifically:
- Function signature: function shiftMarkets(profitDelta)
- Normalize profitDelta: impactScore = Math.max(-1, Math.min(1,
  profitDelta / 500000)) — this maps ±$500k profit swing to ±1 impact
- A negative profitDelta (route is worse) = positive disruption impact
  so flip the sign: disruptionLevel = -impactScore
- Shift each market probability by (disruptionLevel * CONFIG.MARKET
  .IMPACT_SCALE * market-specific multiplier):
  Market 0 multiplier: 1.0
  Market 1 multiplier: 0.7
  Market 2 multiplier: 0.5
- Clamp all probabilities between 0.05 and 0.95
- Recalculate: market.yesPrice = Math.round(market.probability * 100)
  market.noPrice = 100 - market.yesPrice - 3
- Push new probability to market.history, trim to CONFIG.MARKET
  .SPARKLINE_POINTS
- Return the array of { id, oldProb, newProb, delta } for each market
  (needed by the UI in the next unit)
```

### What's happening behind the scenes
`profitDelta` is in dollars — it's how much better or worse the new
route is financially. Dividing by $500k gives a dimensionless -1 to +1
score. Multiplying by `IMPACT_SCALE` (0.15) means even a maximum
disruption only moves markets 15% — realistic for a single ship event.
Different multipliers per market make them feel like separate instruments
responding to the same event at different magnitudes.

### How to verify
In browser console:
```javascript
shiftMarkets(-200000)  // simulate a bad reroute
MARKETS[0].probability // should have increased slightly from 0.49
MARKETS[0].history.length // should be 25 (24 init + 1 new)
```
Run it 5 times. Probabilities should drift upward with each negative delta.

Connects to 2B-1: the UI reads the return value to animate price changes.

### Where to look when debugging
- Probability doesn't change → impactScore calculation wrong, or
  disruptionLevel always 0. Log `impactScore` inside the function.
- Prices go above 100 or below 0 → clamp missing on yesPrice/noPrice.
  Add Math.max(1, Math.min(99, ...)) around price calculations.
- History keeps growing → trim line not executing. Check
  `.slice(-CONFIG.MARKET.SPARKLINE_POINTS)` assignment.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (after MARKETS definition)

---

### Subphase 2A complete — what you have
- [ ] MARKETS array with 3 realistic maritime prediction markets
- [ ] Each market has seeded history for sparkline
- [ ] shiftMarkets(profitDelta) correctly shifts probabilities
- [ ] Price recalculation works (yes + no ≈ 97¢, house takes 3¢)
- [ ] History array stays at fixed length

---

# Subphase 2B — Kalshi Overlay UI (3 units)

## Before you start 2B
2A verify gate must be complete. `shiftMarkets(-200000)` works in console.

---

## Unit 2B-1 — Kalshi panel HTML + CSS

### What this is and why it exists
The visual panel that appears when a ship is rerouted. Styled after the
Kalshi dashboard: dark background, clean typography, green YES / red NO
price buttons, probability percentage. Must be legible on a projector
at 90-person scale — larger text than you think you need.

### What it does
- Adds a new `<div id="kalshiOverlay">` to the HTML panel section
- Contains:
  - Header: "PREDICTION MARKETS" + small subtitle "reacting to route change"
  - 3 market rows, each with:
    - Question text (truncated to 1 line)
    - Probability % (large, animatable)
    - YES price button (green) + NO price button (red/dark)
    - Mini sparkline canvas (80px wide, 30px tall)
  - Footer: total volume + "You moved the market" in small text
- CSS: positioned bottom-left (above the existing drag overlay),
  dark background `#0a0a0a`, border `1px solid #1a1a1a`,
  width 320px, slides in from left with CSS transition
  Font sizes: question 11px, probability 22px bold, prices 14px

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, I want to add the Kalshi prediction market overlay panel.
Show me the HTML structure and CSS before writing.

Add HTML after the existing dragOverlay div. The panel id is
"kalshiOverlay". Structure:
- Header div: "PREDICTION MARKETS" (12px, letter-spacing 2px, #888)
  + subtitle "reacting to route change" (10px, #444)
- Three .market-row divs, each containing:
  - .market-question (11px, #ccc, white-space: nowrap, overflow hidden,
    text-overflow ellipsis, max-width 200px)
  - .market-prob (22px bold, white, id="prob-0" / "prob-1" / "prob-2")
  - .market-yes button (id="yes-0" etc, green #16a34a background,
    white text, 14px, 48px wide, border-radius 4px)
  - .market-no button (id="no-0" etc, background #1a1a1a, #ef4444
    text, 14px, 48px wide, border-radius 4px)
  - <canvas class="market-sparkline" id="spark-0" etc,
    width=80 height=30>
- Footer: "Total volume: [id=kalshi-volume]" + "You moved the market."
  (10px, #444)

CSS for #kalshiOverlay:
- position fixed, bottom 20px, left 20px
- width 320px, background #0a0a0a, border 1px solid #222
- padding 16px, border-radius 6px
- display none by default
- when .show class added: display block, with slide-in from left
  using transform translateX(-10px) → translateX(0) transition 0.3s ease
- z-index above dragOverlay (dragOverlay is z-index 1000,
  use 1001 for kalshiOverlay)
```

### What's happening behind the scenes
CSS `transform: translateX` animating to `translateX(0)` on `.show`
creates the slide-in effect. The transition property tells the browser
to animate any change to transform over 0.3 seconds. This is GPU-
accelerated (no layout reflow) so it's smooth even on a busy page.

### How to verify
In browser console: `document.getElementById('kalshiOverlay')
.classList.add('show')` — panel should slide in bottom-left with 3
empty market rows visible. Looks like a terminal/trading interface.
Check it doesn't overlap the dragOverlay (which appears bottom-right
or center — verify position).

Connects to 2B-2: the render function fills in the content.

### Where to look when debugging
- Panel doesn't appear → z-index conflict, or display:none not being
  overridden. Check `.show` rule specificity.
- Panel overlaps dragOverlay → adjust `left` or `bottom` values.
  dragOverlay position is defined around line 293 in index.html.
- Slide animation doesn't work → transition property missing or on
  wrong element. Must be on `#kalshiOverlay`, not `.show`.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (HTML panel section + CSS section)

---

## Unit 2B-2 — Render function + sparkline

### What this is and why it exists
Fills the Kalshi panel with actual market data and draws the sparkline
charts. The sparkline is the key visual — it shows the history of each
market's probability, with the most recent point highlighted to show
where your drag just moved it.

### What it does
- Creates `function renderKalshiOverlay(shiftResults)`:
  - For each of 3 markets: updates `.market-prob` text, `.market-yes`
    and `.market-no` button text
  - Animates the probability number counting up/down over
    `CONFIG.MARKET.ANIMATE_DURATION`ms using `requestAnimationFrame`
  - Draws sparkline on each canvas: thin white line for history,
    last point highlighted as a cyan dot
  - Updates footer volume text
  - Adds `.show` class to `#kalshiOverlay`

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, after the shiftMarkets function, add a
renderKalshiOverlay(shiftResults) function. Show me before writing.

Specifically:
- shiftResults is the array returned by shiftMarkets:
  [{id, oldProb, newProb, delta}, ...]
- For each market (index 0,1,2):
  - Update document.getElementById('prob-' + i).textContent to
    Math.round(MARKETS[i].probability * 100) + '%'
  - Animate the number: use a 60-frame requestAnimationFrame counter
    that interpolates from oldProb to newProb over
    CONFIG.MARKET.ANIMATE_DURATION ms
  - Update yes button text: MARKETS[i].yesPrice + '¢'
  - Update no button text: MARKETS[i].noPrice + '¢'
  - Color the yes button: if newProb > oldProb, flash border #4ade80
    for 1 second, then return to normal
  - Draw sparkline on canvas id "spark-i":
    - Clear canvas
    - Draw line through all points in MARKETS[i].history, scaled to
      canvas height (0 = bottom, 1 = top)
    - Line color: #4ade80 (green) if last point > first point,
      else #ef4444 (red)
    - Draw a 3px cyan circle at the last point
- After updating all 3 markets: add .show class to #kalshiOverlay
- Update #kalshi-volume with combined volume string
```

### What's happening behind the scenes
The sparkline uses the Canvas 2D API — the same one used by the hand
tracking debug canvas in your existing code. `ctx.moveTo / lineTo /
stroke` draws the line; `ctx.arc` draws the dot. Scaling history values
to canvas height: `y = canvas.height - (value * canvas.height)` flips
the y-axis so higher probability = higher on screen.

### How to verify
In browser console:
```javascript
const results = shiftMarkets(-300000)
renderKalshiOverlay(results)
```
Panel slides in. Probabilities show with % sign. Sparklines visible
(thin lines with cyan dot at end). Yes/No prices updated. Looks like
a trading terminal.

Connects to 2B-3: this function gets called from confirmDrag().

### Where to look when debugging
- Sparkline is flat or invisible → history array empty (2A-1 not
  complete) or canvas scaling wrong. Log `MARKETS[0].history` first.
- Animation doesn't run → requestAnimationFrame callback not looping.
  Check that the inner function calls itself until complete.
- Panel shows but prices are NaN → yesPrice/noPrice not calculated in
  shiftMarkets. Verify 2A-2 is complete.

### Libraries & frameworks
None new (Canvas 2D API already used in project).

### Files touched
- `index.html` (after shiftMarkets function)

---

## Unit 2B-3 — Wire to confirmDrag()

### What this is and why it exists
This is the final connection — making the market react when a ship is
actually confirmed rerouted. One function call in confirmDrag(), but
it's its own unit because it's the integration point and needs to be
verified independently.

### What it does
- In `confirmDrag()` (line ~2517), after `addDBEvent(...)`:
  - Calls `const shiftResults = shiftMarkets(dragFinancials.profitDelta)`
  - Calls `renderKalshiOverlay(shiftResults)`
- In `cancelDrag()` / `cleanupDrag()`:
  - Hides kalshiOverlay: `document.getElementById('kalshiOverlay')
    .classList.remove('show')`
- Adds keyboard shortcut `K` to toggle kalshiOverlay manually
  (useful for demo reset)

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, I want to wire the prediction market to confirmDrag().
Show me exactly which lines you'll change before writing.

Specifically:
- In confirmDrag() (around line 2517), after the addDBEvent line,
  add these two lines:
  const shiftResults = shiftMarkets(dragFinancials.profitDelta);
  renderKalshiOverlay(shiftResults);
- In cleanupDrag() (around line 2552), add:
  document.getElementById('kalshiOverlay').classList.remove('show');
- In the keyboard shortcuts section (around line 2712), add:
  if (e.code === 'KeyK') document.getElementById('kalshiOverlay')
  .classList.toggle('show');
- That's all. Do not change any other logic.
```

### What's happening behind the scenes
`confirmDrag()` already has `dragFinancials` available — this object
contains `profitDelta`, which is the dollar difference between old and
new routes. You're passing that single number to `shiftMarkets()` which
translates it to market movements. The data chain is now complete:
hand → ship → money → market.

### How to verify
Full end-to-end test:
1. Open `http://localhost:8000`
2. Press E (EasyHands)
3. Pinch a ship, drag it significantly off course
4. Release pinch
5. Click Confirm Route
6. Kalshi panel slides in with 3 markets showing shifted probabilities
7. Press Escape — panel hides, drag overlay hides
8. Repeat — markets should shift further each time

### Where to look when debugging
- Panel doesn't appear on confirm → confirmDrag not reaching the new
  lines. Add `console.log('shiftMarkets called')` to verify.
- Panel stays visible after cancel → cleanupDrag() missing the
  classList.remove. Check the function was edited, not a copy.
- Market values don't change on second drag → shiftMarkets is
  recalculating but renderKalshiOverlay is reading stale DOM.
  Verify MARKETS array is actually mutating.

### Libraries & frameworks
None new.

### Files touched
- `index.html` (confirmDrag, cleanupDrag, keyboard shortcuts)

---

### Subphase 2B complete — what you have
- [ ] Kalshi panel appears on ship route confirmation
- [ ] 3 markets show with probabilities, Yes¢/No¢ prices, sparklines
- [ ] Probabilities animate when panel appears
- [ ] Panel hides on Escape / cancel
- [ ] K key toggles panel manually
- [ ] Full pinch → drag → confirm → market reaction flow works

---

### Phase 2 complete — verify gate
- [ ] EasyHands pinch → drag → confirm triggers Kalshi panel
- [ ] Each of 3 markets shows distinct probability shift
- [ ] Sparklines visible with cyan dot at current position
- [ ] Yes prices are green, No prices are red
- [ ] "You moved the market." visible in footer
- [ ] Panel hides cleanly on Escape
- [ ] Repeating the action continues shifting markets cumulatively

---

# Phase 3 — Projector Polish
## Legible at 90-person scale

**What you're building:** Visual adjustments to make the demo read
clearly on a large projected display. Bigger text, higher contrast,
cleaner Kalshi panel layout.

**Why it matters:** What looks fine on a 13" laptop screen becomes
unreadable projected at 90 people. The Yes¢/No¢ prices and probability
% are the key numbers — they must be immediately legible from the back
of the room.

**Output:** Same functionality, visually optimized for projection.

**Time allocation:** Sprint 06, 11am–12pm tomorrow.

---

# Subphase 3A — Projection scale (2 units)

## Unit 3A-1 — Kalshi panel projection sizing

### What it does
- Increase `.market-prob` from 22px to 32px
- Increase `.market-yes` / `.market-no` buttons from 14px to 16px,
  height 36px
- Increase `.market-question` from 11px to 13px
- Increase panel width from 320px to 380px
- Add subtle `box-shadow: 0 0 40px rgba(0,0,0,0.8)` to panel
- Make "You moved the market." 12px, color #888 (more visible)

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, adjust the CSS for #kalshiOverlay for projection scale.
Show me exactly which CSS properties you'll change before writing.
Only change font sizes, dimensions, and shadows. Do not restructure
the layout or change any JavaScript.
```

### How to verify
Open panel with K key. Stand 3 meters from your screen. Can you read
the probability percentage and Yes¢/No¢ prices clearly? If yes, done.

---

## Unit 3A-2 — Demo reset shortcut

### What it does
- Adds `R` key override: if kalshiOverlay is visible, pressing R
  resets all MARKETS to their original probabilities and re-renders
  (useful between demo runs without reloading the page)
- Shows a 1-second "RESET" flash on the Kalshi panel header

### Claude Code prompt
```
Read dev-practices.md first.

In index.html, add a market reset function. Show me before writing.

- Function resetMarkets(): resets all MARKETS[i].probability,
  yesPrice, noPrice to their original values (store originals on init)
  and calls initMarketHistory() to reseed sparklines
- In keyboard shortcuts: if e.code === 'KeyR' AND kalshiOverlay
  has class 'show': call resetMarkets() and flash "RESET" on the
  panel header for 1 second
- If kalshiOverlay is NOT showing, KeyR keeps its existing behavior
  (route toggle)
```

### How to verify
Run a full demo (pinch → drag → confirm → markets shift). Press R.
Markets return to starting values. Sparklines reset. Do it twice to
confirm consistency.

---

### Phase 3 complete — final verify gate
- [ ] Kalshi panel readable from 3 meters
- [ ] Full demo flow works: EasyHands → pinch → drag → confirm → markets react
- [ ] R key resets markets without page reload
- [ ] K key toggles panel for manual demo control
- [ ] No console errors
- [ ] Works on `http://localhost:8000`

---

# Sprint Schedule

| Sprint | Time | Phase | Units |
|--------|------|-------|-------|
| 03 | 7–8am | Phase 1 | 1A-1, 1A-2, 1B-1 |
| 04 | 8–9am | Phase 2A | 2A-1, 2A-2 |
| 05 | 9–10am | Phase 2B | 2B-1, 2B-2 |
| 06 | 11am–12pm | 2B-3 + Phase 3 | 2B-3, 3A-1, 3A-2 |
| 07 | 12–1pm | Rehearsal | Run demo 3x, eat |

---

# Agent Mapping Table

| Unit | Agent | Files touched |
|------|-------|---------------|
| 1A-1 | Single agent (whole file) | index.html — CONFIG block |
| 1A-2 | Single agent | index.html — MediaPipe load section |
| 1B-1 | Single agent | index.html — MediaPipe init section |
| 2A-1 | Single agent | index.html — MARKETS constant + init |
| 2A-2 | Single agent | index.html — shiftMarkets function |
| 2B-1 | Single agent | index.html — HTML panels + CSS |
| 2B-2 | Single agent | index.html — renderKalshiOverlay function |
| 2B-3 | Single agent | index.html — confirmDrag, cleanupDrag, keys |
| 3A-1 | Single agent | index.html — CSS only |
| 3A-2 | Single agent | index.html — resetMarkets + keyboard |

---

# Before moving to Phase 2 (master checklist)
- [ ] `python -m http.server 8000` running
- [ ] Phase 1 verify gate fully passed
- [ ] Ships move, EasyHands works, no console errors
- [ ] Camera permission granted on load with no popup on Hand Mode

# The one sentence
**Pinch a ship. Move it off course. Watch the world reprice.**
