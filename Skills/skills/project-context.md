# SKILL: Deep Seas / Malacca Simulator — Project Context
# Read this file at the start of every session before writing any code.
# Last updated: 2026-04-11

## What this project is

A single-file, browser-based maritime traffic simulator for the Strait of
Malacca. Leaflet renders a dark map with ~30 animated vessels following
pre-generated TSS shipping lanes. Chart.js renders analytics. MediaPipe
Hands enables a pinch-to-grab gesture that lets a user physically reroute
a ship; the new route is priced against the original using an internal
financial model (fuel, crew, port fees, insurance, freight revenue).
IndexedDB persists deliveries, route changes and time-series snapshots.

The **next phase** (Deep Seas — Prediction Market Layer) overlays a
Kalshi-style prediction market that animates in when `confirmDrag()` fires,
turning the drag gesture into a visible market-moving event. One sentence:
**"Pinch a ship. Move it off course. Watch the world reprice."**

## Project root

`C:\Users\vvb2112\Test_simulator-main\`

## Folder structure

```
Test_simulator-main/
├── index.html                     ← THE ENTIRE APP (HTML + CSS + JS, ~3150 lines)
├── DOCUMENTATION.md               ← Granular phase/unit build guide for Deep Seas
├── DOCUMENTATION_archive.md       ← Original feature README (controls, bug fixes)
├── _test_api.json                 ← Sample GFW 4Wings vessel registry response
├── _report_test.json              ← GFW API error sample (format validation)
├── API integration*.txt           ← Empty placeholder files (0 bytes)
├── .gitattributes                 ← LF normalization
└── Skills/                        ← (this folder) agents, skills, processes
    ├── README.md                  ← Master index — start here
    ├── DOCUMENTATION.md           ← Copy of phase build guide
    ├── agent-creation-process.md  ← Framework (how to run multi-agent builds)
    ├── skills-creation-framework.md ← Framework (how to author skill files)
    ├── skills/                    ← Project-specific skill files (this file lives here)
    └── agents/                    ← Start prompts + ownership rules per agent
```

## Key architectural rules

1. **Single-file app.** Everything ships as `index.html`. Do not split
   into modules, add bundlers, or introduce build steps.
2. **Never rename `lerp`.** Chart.js 4.4.1 UMD overwrites a global `lerp`.
   Our helper is `_lerpVal()`. Any future helper that collides with a
   Chart.js global must be renamed with a `_` prefix.
3. **MediaPipe loads async.** Scripts are injected via `loadScript()`
   promises after `DOMContentLoaded`. Never add synchronous
   `<script src="...mediapipe...">` tags — they block the sim loop.
4. **Animation loop is hardened.** `requestAnimationFrame(animate)` is
   called **before** `updateSim()` and `updateSim` is wrapped in try/catch.
   Do not reorder this — an uncaught error will silently kill the loop.
5. **Position NaN guards.** Any new code that touches `marker.setLatLng`
   must validate `lat/lng` are finite numbers or Leaflet throws.
6. **Hand coordinates are mirrored.** `handToLatLng()` applies `(1 - nx)`
   because the webcam feed is horizontally flipped. Never remove this.
7. **Constants live in one place (after Phase 1).** Phase 1 Unit 1A-1
   consolidates scattered constants into a top-level `const CONFIG = {}`.
   After that unit lands, all new tunables go into `CONFIG`, never loose.
8. **No new frameworks.** React, Vue, Svelte, Tailwind, build tools are
   all forbidden. The project must run via `python -m http.server 8000`
   with zero install steps.

## What's already built (do not rebuild or modify unless asked)

- **Simulation engine**: 30 vessels, 12 pre-generated jittered routes,
  speed-scaled time steps (1x–50x), collision detection, trails.
- **Ship data model**: 5 types (tanker/container/cargo/bulk/lng), 20
  owners, 12 flags, 6 fuel types, 20+ cargo types with hazmat flags,
  IMO/MMSI/call sign/DWT/beam/draft, fuel + emissions (CO2/SOx/NOx).
- **Ship detail panel** with live telemetry, Chart.js speed line and
  cargo doughnut, route timeline.
- **Port system**: 8 ports with throughput, commodities, partners, charts.
- **Analytics dashboard**: throughput / cargo / density / corridor charts.
- **Financial model**: `calcTripFinancials()` and `calcRouteFinancials()`
  compute fuel/crew/port/insurance costs and profit deltas.
- **IndexedDB trade database**: `snapshots`, `deliveries`, `routeChanges`,
  `timeseries` stores with in-memory fallback; stats panel + profit chart.
- **Interactive mouse dragging**: pause → preview new route → confirm/cancel
  overlay showing profit delta.
- **Hand tracking (MediaPipe)**: 1-hand detection, pinch threshold 0.07,
  HAND_SMOOTH 0.35 cursor smoothing, skeleton drawn on debug canvas.
- **EasyHands Mode**: unlimited-range auto-target with cyan line + highlight.
- **GFW (Global Fishing Watch)**: custom GridLayer with HSL→RGB recolor LUT,
  click-to-query nearby vessels via 4Wings API (token embedded in code).
- **Filter/export**: JSON/CSV export, localStorage save/load state.

## What's being built next (Phase 1 → 2 → 3)

See `DOCUMENTATION.md` for the granular unit-by-unit build guide.
Summary:

- **Phase 1 — Stabilize** (3 units)
  - 1A-1 Consolidate constants into `CONFIG` object
  - 1A-2 MediaPipe load timeout + mouse-drag fallback banner
  - 1B-1 Silent camera permission pre-warm on page load
- **Phase 2 — Prediction Market Layer** (5 units)
  - 2A-1 `MARKETS` array with 3 maritime Kalshi markets + `initMarketHistory()`
  - 2A-2 `shiftMarkets(profitDelta)` function
  - 2B-1 Kalshi overlay HTML + CSS (`#kalshiOverlay`)
  - 2B-2 `renderKalshiOverlay()` with sparkline canvas
  - 2B-3 Wire `shiftMarkets` + `renderKalshiOverlay` into `confirmDrag()`
- **Phase 3 — Projector Polish** (2 units)
  - 3A-1 Enlarge Kalshi CSS for 3-meter legibility
  - 3A-2 `resetMarkets()` + R-key reset shortcut

## The data chain

```
Webcam frame
  → MediaPipe Hands (landmarks)
  → isPinchingHand() (pinch boolean)
  → handToLatLng() (mirrored map coords)
  → chooseVessel() / grabVessel()
  → draggingVessel.marker.setLatLng() + buildRouteThrough()
  → calcRouteFinancials() → dragFinancials.profitDelta
  → confirmDrag()
  → shiftMarkets(profitDelta)            ← Phase 2 adds this link
  → renderKalshiOverlay(shiftResults)     ← Phase 2 adds this link
  → IndexedDB: routeChanges store (existing)
```

Parallel persistent chain:
```
updateSim tick → recordDelivery() on progress ≥ 1 → dbPut('deliveries')
              → recordSnapshot() every ~15s     → dbPut('timeseries')
```

## Libraries and APIs in use

| Library | Version | Source | Purpose |
|---|---|---|---|
| Leaflet | 1.9.4 | unpkg | Map, markers, polylines, tooltip |
| Leaflet.heat | 0.2.0 | unpkg | (loaded but we use our own circle-marker heat) |
| Chart.js | 4.4.1 | jsDelivr | Analytics + ship panel charts |
| MediaPipe Hands | latest | jsDelivr (async) | Hand landmark detection |
| MediaPipe Camera Utils | latest | jsDelivr (async) | Webcam capture loop |
| MediaPipe Drawing Utils | latest | jsDelivr (async) | (we draw skeleton manually) |
| GFW 4Wings API | v3 | gateway.api.globalfishingwatch.org | Vessel density tiles + registry |

No AI/LLM APIs are called. `GFW_TOKEN` is embedded in `index.html` line ~1392.

## How to run the project

```bash
# From the project root:
python -m http.server 8000
# Then open: http://localhost:8000
```

Must be served over `http://localhost` (not `file://`) or `getUserMedia`
and IndexedDB silently fail. Keep the server running in a separate
terminal throughout every build session.
