# Deep Seas — System Architecture (as built)

This reflects the actual code in the repo, not the PRD's planned end-state. Where they diverge, that's called out.

## Three independent HTML entry points

There is no build system and no server (except the optional, unbuilt audience server in the PRD). Each `.html` file is a standalone page loaded straight from `file://` or a static server, and pages talk to each other only via the browser's `BroadcastChannel` API — no shared backend, no shared process.

```
┌──────────────────┐   BroadcastChannel    ┌──────────────────┐
│  detector.html    │  'deepseas-game'      │   index.html      │
│  (Teachable       │ ─────────────────────▶│   (main sim +     │
│   Machine webcam  │   {type:'FIRE_WEAPON', │    game layer)    │
│   object detector) │    weaponId}          │                    │
└──────────────────┘                        └──────────────────┘
                                                       │
                                              (planned, not built)
                                              BroadcastChannel
                                              'hormuz-game'
                                                       ▼
                                             ┌──────────────────┐
                                             │ market_screen.html│
                                             │ (wall projection, │
                                             │  currently standalone,│
                                             │  hardcoded dummy   │
                                             │  data + setInterval)│
                                             └──────────────────┘
```

- `detector.html` runs a Teachable Machine image model against the webcam, maps the detected class to a weapon ID via a per-model `label-map.json` (joined against `weapons-config.js` at load time), and posts `{type:'FIRE_WEAPON', weaponId}` on channel `deepseas-game`.
- `index.html` listens on that channel in `js/bootstrap.js:69-74` and calls `fireWeapon(id)`. Keyboard keys 1-6 / Q,W,E,R,T,Y are a fallback path into the same `fireWeapon()` function (`js/bootstrap.js:36-48`).
- `market_screen.html` is **not yet wired up** — it still runs its own `setInterval` loop with fabricated numbers. The PRD's Phase 5c/7 plan is to have `index.html` broadcast `marketState` snapshots on a `hormuz-game` channel and have `market_screen.html` listen, but that channel and listener don't exist in code yet.

## index.html — script load order (the real dependency graph)

Everything in `index.html` is plain `<script src>` tags, loaded in this order, top to bottom. There's no module system, so order *is* the dependency graph — later files assume earlier globals already exist.

```
Layer 1   config-data.js  → markets.js → utils.js
                                              (static data: ports, routes, cargo, helpers)

Layer 1.5 weapons-config.js → game-state.js → market-tick.js → round-controller.js → game-dashboard.js
                                              (the game layer — see below)

Layer 2   map-setup.js
                                              (Leaflet map, port markers, TSS lane overlays)

Layer 3   gfw.js
                                              (Global Fishing Watch density overlay)

Layer 4   financials.js → vessel-creation.js → simulation.js
                                              (fuel/crew/freight costs, vessel factory,
                                               the requestAnimationFrame sim loop)

Layer 5   database.js
                                              (IndexedDB persistence for deliveries/snapshots)

Layer 6   panel-ship.js → panel-port.js → panel-analytics.js → panel-db.js
                                              (click-to-open detail panels, all read-only
                                               views over sim/financial state)

Layer 7   drag.js → filters.js
                                              (mouse ship-dragging + route preview;
                                               JSON/CSV export, save/load sim state)

Layer 8   hand-gesture.js
                                              (MediaPipe Hands — pinch-to-grab ships)

Layer 9   bootstrap.js
                                              (wires up requestAnimationFrame loop, keyboard
                                               shortcuts, BroadcastChannel receiver — last
                                               because it calls functions from every layer above)
```

## The game layer (Layer 1.5) — the part actually relevant to the PRD's thesis

This is the only part of the architecture that didn't exist in the original maritime simulator; it's the "game" bolted onto the "simulation."

```
weapons-config.js          static data only
  WEAPONS_CONFIG = { weapons: [...12 weapons], interactions: [...8 pairs] }
  generated from Context/docs/effect_matrix_v4.xlsx by scripts/parse_effect_matrix.py
        │
        ▼
game-state.js               SINGLE SOURCE OF TRUTH
  marketState = { prob, tickCount, activeWeapons, simMultipliers, actionLog, round{} }
  fireWeapon(id)             - writes prob += weapon.prob_delta (clamped 0-100)
                             - pushes entry to activeWeapons
                             - calls recomputeSimMultipliers()
                             - calls showFlash() + updateDashboard()
  recomputeSimMultipliers()  - rebuilds simMultipliers from scratch every call:
                                SIM_DEFAULTS + every activeWeapons[].sim_trigger_keys
                                (numeric conflicts: Math.min; flag conflicts: defender wins)
        │
        ├─── read by ───▶ simulation.js (updateSim/updateStats: effective ship speed,
        │                  spawn-rate gating, "PROB XX%" status bar text)
        │
        ▼
market-tick.js              AUTONOMOUS LOOP (setTimeout chain, 20s, pause-aware)
  marketTick()  every 20s:  - decays each 'fast' active weapon's remainingDelta
                            - detects active slow+slow interaction pairs, applies
                              their net_delta instead of summing independently
                            - builds 'slow' weapons once past onset_s
                            - applies Brownian drift + mean-reversion toward 50
                            - clamps prob, calls updateDashboard()
  pauseTick()/resumeTick()  - honors remaining time on the in-flight timeout
        │
        ▼
round-controller.js         ROUND LIFECYCLE (reads/writes marketState.round)
  startRound()   reset prob/weapons/tick → round.phase='playing', resumeTick()
  endRound()     read marketState.simMultipliers.hormuz_lane (closed→disruptor wins,
                 open→defender wins) → update round.scores → pauseTick()
                 best-of-3: 2 wins → round.phase='over'
  pauseRound()/resumeRound()  toggle via pauseTick/resumeTick, track totalPausedMs
  endGameNow()   operator hard-stop — declares winner from current hormuz_lane,
                 does NOT touch scores (declaration, not a scoring event)
  resetGame()    full reset of marketState + round back to idle
        │
        ▼
game-dashboard.js            PURE DOM WRITER, READ-ONLY
  updateDashboard()  renders #gameDashboard from marketState only — probability bar,
                     last-action card, active-weapons list, event log. Never mutates state.
```

**Single-source-of-truth rule (enforced by convention, not by code):** `marketState` is written only by `fireWeapon()`, `marketTick()`, and the round-controller functions. Everything else — `simulation.js`, `game-dashboard.js`, the status bar — only reads it.

**Two timescales:** player actions (`fireWeapon`, instant) vs. the 20-second `marketTick` (autonomous drift/decay/build). This split is the PRD's core design idea — fast writes are agency, slow writes are systemic drift.

## What's built vs. what's still PRD-only

| Piece | Status |
|---|---|
| Game state, weapon firing, decay/drift tick, interactions, round controller | Built and unit-tested (`tests/phase-0{1,2,3,4,5,5a}-*.html`) |
| Ship speed visibly responding to weapons (lerp, Avg Kn, HORMUZ FLOW) | Code written, **unverified in browser** (Phase 5b) |
| Live activity feed (`#activityFeed`, `js/game-feed.js`) | **Not built** — no such file exists yet |
| `market_screen.html` live data via BroadcastChannel | **Not built** — page is still standalone with dummy data |
| MKTS in-sim panel (`issues/06`), audience server + client (`issues/11`) | **Not built** |
| Strait of Hormuz geography (map center, ports, routes) | Done, but TSS lane waypoints still route ships across the Musandam Peninsula (geographically wrong — needs correction) |

For the fuller phase-by-phase narrative (why each decision was made), see `prd_body.md` at the repo root.
