# SKILL: index.html Patterns — Deep Seas / Malacca Simulator
# Read this file before touching index.html.
# All patterns extracted from the real file.
# Last updated: 2026-04-11

## File layout (know where things live before you edit)

```
index.html (~3150 lines)
├── Lines    1 – 376   <head> + <style> (ALL CSS lives here, one block)
├── Lines  378 – 788   <body> HTML structure (panels, overlays, canvases)
├── Lines  790 – 2731  <script> #1: core sim, UI, DB, financials, drag
└── Lines 2734 – 3147  <script> #2: MediaPipe hand tracking (kept separate
                       so an init failure in script #2 cannot break the sim)
```

When adding code, put it in the right section. New CSS → the single
`<style>` block at the top. New panels → before `</body>`. New sim logic
→ script #1 near the related system. New hand-tracking logic → script #2.

## Visual identity (the terminal aesthetic)

```
background:        #080808
panel background:  #0a0a0a
border:            #1a1a1a
subtle border:     #111111
secondary text:    #444444
primary text:      #888888
white emphasis:    #ffffff
accent / action:   #cc0000           ← used for EVERYTHING red
font-family:       Helvetica, Arial, sans-serif
border-radius:     0  (sharp corners only)
text-transform:    uppercase for labels, letter-spacing 1–4px
```

Font size hierarchy:
```
7px  → legend / stat labels / tiny metadata
8px  → field labels, tab buttons, footer text
9px  → buttons, small rows
10px → body text, control font-size
11px → card field values
12px → section headings when prominent
14px → panel titles (ship / port name)
16–22px → big stat values (monospace weight 300)
```

**Rule**: all new UI must conform to this palette and font scale.
No gradients (except the heatmap legend). No shadows (except the
Kalshi panel in Phase 3 which uses `box-shadow: 0 0 40px rgba(0,0,0,0.8)`).
No border-radius.

## Panel structure pattern (copy when adding a new panel)

Real example — `#dragOverlay` (line ~293):
```css
#dragOverlay {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 1002; background: #0a0a0a; color: #888888;
  border-radius: 0; padding: 14px 20px; min-width: 380px;
  border: 1px solid #1a1a1a; display: none;
  font-size: 10px; font-family: Helvetica, Arial, sans-serif;
}
#dragOverlay.show { display: block; }
```

HTML goes before `</body>`:
```html
<div id="dragOverlay">
  <div class="drag-title">ROUTE CHANGE PREVIEW</div>
  ...
</div>
```

Panel z-index layers already in use:
```
999   statusBar, collisionWarning
1000  #controls, #dbStatsPanel, #analyticsPanel
1001  #shipPanel, #portPanel, #kalshiOverlay (Phase 2)
1002  #dragOverlay
9999  #handDebug (always on top)
```

## Button pattern

```html
<button class="btn" id="btnPlay" onclick="togglePlay()">PLAY</button>
```
```css
.btn {
  background: transparent; border: 1px solid #222222;
  color: #666666; padding: 4px 8px; border-radius: 0; cursor: pointer;
  font-size: 9px; transition: all 0.15s; white-space: nowrap;
  letter-spacing: 2px; text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
}
.btn:hover  { border-color: #cc0000; color: #ffffff; }
.btn.active { border-color: #cc0000; color: #cc0000; background: transparent; }
```

Toggling active state from JS:
```javascript
document.getElementById('btnPlay').classList.toggle('active', playing);
```

All buttons use inline `onclick="functionName()"` — keep this consistent.
Do not migrate to `addEventListener` unless explicitly asked.

## Tab pattern (already present on #controls)

```html
<div class="tab-bar">
  <button class="tab-btn active" onclick="switchTab('filter',this)">Filter</button>
  <button class="tab-btn" onclick="switchTab('environ',this)">Env</button>
</div>
<div class="tab-content active" id="tab-filter">...</div>
<div class="tab-content" id="tab-environ">...</div>
```
```javascript
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}
```

## Module-level state pattern

All state is declared as `let` or `const` near its subsystem, not in an
object. Naming is camelCase, boolean flags are `xxxMode` or `xxxOpen`
or `xxxVisible`. Examples from the real file:

```javascript
let playing = true, simSpeed = 5, simElapsed = 0, warningCount = 0;
let showTrails = false, trailLines = [], nightMode = false;
let routeLinesVisible = true, heatmapVisible = false;
let dragMode = false, draggingVessel = null, dragPreviewLine = null;
let handMode = false, handPinch = false, easyHandsMode = false;
let dbPanelOpen = false;
```

**Rule**: new state variables go next to the subsystem that owns them,
declared with `let`, initialized to the correct default. Do not create
a global `state = {}` object.

## Dynamic element creation pattern

### Via Leaflet L.divIcon (vessel markers)
Template literals with inline styles for per-vessel variation:
```javascript
const icon = L.divIcon({
  className: '',
  html: `<div class="vessel-cross" id="ship-icon-${vesselId}" style="animation-delay:${_pulseDelay}ms">
           <div class="cross-h"></div><div class="cross-v"></div>
           <div class="vessel-datacard">
             <div class="vdc-name">${name}</div>
             <div class="vdc-type">${cfg.label} // ${flag.code}</div>
           </div>
         </div>`,
  iconSize: [12, 12], iconAnchor: [6, 6]
});
```

### Via innerHTML into a container (lists, rankings)
Real example from `updateEconTab()`:
```javascript
document.getElementById('econCorridors').innerHTML = topCorr.map(([name, data]) =>
  `<div class="pp-commodity-bar">
    <div class="pp-commodity-label">${name}</div>
    <div class="pp-commodity-fill" style="width:${(data.value/maxCorrVal)*80}px;background:#a855f7"></div>
    <div class="pp-commodity-val">${fmtUSD(data.value)}</div>
  </div>`
).join('');
```

**Rule**: values that come from `vessels`/`ports`/`MARKETS` are safe to
interpolate (we control them). User-supplied strings never enter the
DOM via innerHTML in this project — there is no user text input to
worry about escaping. If you ever add one, escape first.

## Chart.js pattern (always destroy before recreate)

```javascript
if (spSpeedChart) spSpeedChart.destroy();
const ctx = document.getElementById('spSpeedChart').getContext('2d');
spSpeedChart = new Chart(ctx, {
  type: 'line',
  data: { labels: [...], datasets: [{ data: [...], borderColor: '#cc0000',
          borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3 }] },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { ticks: { color: '#444444', font: { size: 9 } },
           grid: { color: '#111111' } }
    }
  }
});
```

Live updates use `chart.update('none')` to skip animation.

## Canvas 2D pattern (debug canvas + upcoming sparklines)

Already used for `handDebug` skeleton drawing. Coordinates run 0,0 at
top-left; flip y for "higher = better" visuals:
```javascript
const y = canvas.height - (value * canvas.height);
```

## Keyboard shortcut pattern (two handlers, do not merge)

Script #1 handles everything except hand modes:
```javascript
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'KeyN') toggleNight();
  // ...
});
```

Script #2 adds its own listener for `KeyG` (Hand) and `KeyE` (EasyHands).
New Phase 2/3 shortcuts (`KeyK`, `KeyR` reset) go into the **script #1**
listener because script #2 may not have loaded yet if MediaPipe failed.

## External libraries already loaded (do not add more)

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
```
MediaPipe is injected dynamically from script #2 via `loadScript()`.

## What NOT to do

1. **Do not add `<script type="module">` or ES imports.** Everything is
   global scope on purpose.
2. **Do not rename `lerp` or create a new global called `lerp`.** Chart.js
   owns that name. Use `_lerpVal()` or a new `_`-prefixed helper.
3. **Do not add a build step** (webpack, vite, tsc, sass). `index.html`
   must remain directly servable.
4. **Do not introduce a CSS framework** (Tailwind, Bootstrap). The palette
   is hand-picked — extend it, don't replace it.
5. **Do not break the script block order.** Script #1 must finish
   initializing vessels and the sim loop before script #2 runs. Script
   #2 reads globals like `vessels`, `map`, `draggingVessel`, `playing`.
6. **Do not add a loose top-level constant outside `CONFIG`** once Phase 1
   Unit 1A-1 lands. Before that unit, match the existing scattered style.
7. **Do not call `marker.setLatLng()` without NaN-guarding** the inputs.
8. **Do not remove the `try/catch` around `updateSim(dt)`** in the
   `animate()` loop — it is the last line of defense against a silent
   freeze.
9. **Do not load fonts from Google Fonts or anywhere else.** Helvetica/Arial
   is deliberate: zero network dependency.
10. **Do not commit the GFW token to a public repo** — it is currently
    embedded at line ~1392. Treat it as a secret during any refactor.
