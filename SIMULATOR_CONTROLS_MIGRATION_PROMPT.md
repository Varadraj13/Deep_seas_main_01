# Claude Code Integration Brief — Simulator Controls → Control Center (Phase 01)

## What this is

Annotated review feedback on `simulator.html` (see "Simulator.html - phase 01" screenshot).
Six changes, same pattern already used for the detector migration
(`CLAUDE_CODE_INTEGRATION_PROMPT.md`): `control-center.html` becomes the main operator
console; `simulator.html` becomes primarily a live map/display driven remotely over
`BroadcastChannel`, the same way `detector.html` is already driven by `deepseas-game` /
`hormuz-game` / `hormuz-mode`. Don't rewrite simulation logic — it stays in
`simulator.html` (that's where `marketState`, `map`, and every `js/*.js` layer already
live); only the *controls* relocate.

---

## 1. `simulator.html` changes

**Keep as-is, do not move:**
- `#controls` header block — `STRAIT OF HORMUZ` / `TRAFFIC CONTROL SYS` title + the
  4-stat row (Vessels / Sim Time / Avg Kn / Alerts). Good info, stays on the map page.
- The map itself, vessel markers/panels, drag mode, hand-gesture mode — anything that
  isn't in the list below stays put.

**Remove entirely:**
- `#collisionWarning` bar ("! COLLISION WARNING -- VESSELS IN CLOSE PROXIMITY") — no
  context, delete the element and whatever shows/hides it (check `simulation.js` /
  `bootstrap.js` for the trigger). Remove the now-unused `.collision-warning` CSS rule
  in `css/main.css` too.

**Add:**
- A short caption near the bottom-left of the map explaining what the data actually is.
  Current placeholder text ("This are all the ships moving through the strait of hormuz
  as of last year.") has a grammar error and no real context — replace with something
  that states the data source, scope, and time range (e.g. Strait of Hormuz vessel
  traffic, what a marker represents, and the period it covers). Fix the grammar
  regardless of final copy ("These are...").

**Default boot state (map should open exactly as shown in the screenshot):**
- Confirm `js/map-setup.js`'s `L.map('map', {center:[26.0,57.0], zoom:7, minZoom:5,
  maxZoom:14})` matches the required framing; adjust only if it doesn't.
- Global Fishing Watch must be **ON by default**, no click required. Right now
  `gfwVisible` starts `false` (`js/gfw.js`) and only turns on via the GFW button /
  `Shift+F`. Call the GFW-enable path once during simulation-mode init (mirror what
  `toggleGFW()` does when turning on) so the layer + click handler are live immediately.

**Relocate to `control-center.html` (functionality moves, page keeps working the exact
same way — just remote-controlled):**
- Simulation controls: PLAY/STEP/RST, SPEED slider (`setSpeed`)
- `+ADD` / `-RMV` vessel buttons
- Round controls: START / PAUSE / RESET / END GAME (`round-controller.js`)
- Display toggle row: NGT / TRL / RTE / HT / GFW / DB / DRG / HAND / ESYHD
- Filter / Env / Econ / Data tab bar and all four tab contents (type/flag/origin/dest
  filters, search box, environmental + economic readouts, JSON/CSV/SAVE/LOAD export)
- Legend
- `TACTICAL DETECTION` link
- The Game Dashboard: `#gameDashboard` (Probability / Last Action / Active Weapons /
  Event Log) — currently rendered locally by `updateDashboard()` in
  `js/game-dashboard.js`, fed directly from `marketState` on the same page. This one
  needs a wiring decision — see §3.

Everything in the relocated list keeps calling the same underlying functions that
already exist (`togglePlay()`, `setSpeed()`, `startRound()`, `toggleGFW()`,
`applyFilters()`, `addRandomVessel()`, etc.) — those functions and the simulation state
they touch stay in `simulator.html`. The buttons just move to `control-center.html` and
fire commands across a channel instead of calling the functions directly.

---

## 2. `control-center.html` changes

Add a new panel (e.g. `#simControlsPanel`) styled consistent with the existing chrome
(`.tp-*` classes / IBM Plex Mono, same visual language as `#techPanel`), containing
every control listed above. Keep the existing nav, detection engine, and
`BroadcastChannel('deepseas-game')` wiring untouched.

---

## 3. New channel: `hormuz-controls`

Simulator's control functions are plain JS calls today (`onclick="togglePlay()"`, etc.)
— there's no existing channel for "operator pressed a button." Add one:

```js
// control-center.html — on every control interaction:
const controlsChannel = new BroadcastChannel('hormuz-controls');
controlsChannel.postMessage({ type: 'TOGGLE_PLAY' });
controlsChannel.postMessage({ type: 'SET_SPEED', value });
controlsChannel.postMessage({ type: 'START_ROUND' });
controlsChannel.postMessage({ type: 'TOGGLE_GFW' });
controlsChannel.postMessage({ type: 'APPLY_FILTERS', filters: {...} });
// etc. — one message type per relocated control action
```

```js
// simulator.html — single listener, dispatches to the existing functions:
const controlsChannel = new BroadcastChannel('hormuz-controls');
controlsChannel.onmessage = e => {
  const m = e.data || {};
  switch (m.type) {
    case 'TOGGLE_PLAY':  togglePlay();       break;
    case 'SET_SPEED':    setSpeed(m.value);  break;
    case 'START_ROUND':  startRound();       break;
    case 'TOGGLE_GFW':   toggleGFW();        break;
    // ...
  }
};
```

**Game Dashboard data problem (needs solving, not just copy-paste):** `updateDashboard()`
reads `marketState` directly, which only exists on `simulator.html`. `control-center.html`
can't render Probability/Last Action/Active Weapons/Event Log without that data crossing
a channel. The existing `hormuz-game` broadcast (`js/game-broadcast.js`) only sends
`{shipProbability, lane, activeWeapons, round}` — not enough for "Last Action" (needs
cause/effect detail) or "Event Log" (needs history). Extend `broadcastGameState()` to also
include a slice of `marketState.actionLog` (e.g. `actionLog.slice(-10)`), then port
`updateDashboard()`'s rendering logic to `control-center.html` so it renders from the
`hormuz-game` snapshot instead of a local `marketState`. Keep the simulator's own
`#gameDashboard` DOM removed (or, if you'd rather leave it as an on-page debug view,
that's fine — just make sure control-center.html's copy is the one that's authoritative
and doesn't drift).

---

## Channel contract addition

| Channel | Message | Producer → Consumer |
|---|---|---|
| `hormuz-controls` (new) | `{type:'TOGGLE_PLAY'\|'SET_SPEED'\|'START_ROUND'\|'PAUSE_ROUND'\|'RESET_GAME'\|'END_GAME'\|'ADD_VESSEL'\|'REMOVE_VESSEL'\|'TOGGLE_NIGHT'\|'TOGGLE_TRAILS'\|'TOGGLE_ROUTES'\|'TOGGLE_HEAT'\|'TOGGLE_GFW'\|'TOGGLE_DB'\|'TOGGLE_DRAG'\|'TOGGLE_HAND'\|'TOGGLE_EASYHANDS'\|'APPLY_FILTERS'\|'EXPORT_JSON'\|'EXPORT_CSV'\|'SAVE_STATE'\|'LOAD_STATE', ...payload}` | `control-center.html` → `simulator.html` |
| `hormuz-game` (existing, payload extended) | `{shipProbability, lane, activeWeapons, round, actionLog}` | `js/game-broadcast.js` (simulator) → `control-center.html` game dashboard, `detector.html` odds, `market_screen.html` |

---

## Acceptance checklist

1. `simulator.html` opens at zoom 7 / center `[26.0, 57.0]` with GFW tiles already
   visible — no click needed.
2. `#collisionWarning` element and its CSS/trigger code are gone from the codebase, not
   just hidden.
3. Bottom-left caption is present, grammatically correct, and actually explains the
   dataset (source + time range).
4. `STRAIT OF HORMUZ` / `TRAFFIC CONTROL SYS` header + 4 stat tiles remain on
   `simulator.html`, unchanged.
5. `control-center.html` has a working panel for: Simulation (Play/Step/Reset/Speed),
   +ADD/-RMV, Round (Start/Pause/Reset/End Game), Display toggles (all 9), Filter/Env/
   Econ/Data tabs, Legend, Tactical Detection link, and the Game Dashboard
   (Probability/Last Action/Active Weapons/Event Log) — all functioning identically to
   how they worked on `simulator.html` before the move.
6. With both pages open (like the existing detector/control-center pair): every control
   pressed on `control-center.html` visibly changes `simulator.html`'s map/simulation in
   real time, and the Game Dashboard on `control-center.html` reflects the same
   probability/log data `simulator.html`'s engine is producing.
7. `simulator.html` still works standalone if `control-center.html` isn't open (map,
   markers, ship/port panels, drag mode, hand gesture mode, keyboard weapon firing) —
   only the removed chrome (collision bar) and relocated controls are gone from its DOM.
8. No regressions to the existing `deepseas-game` / `hormuz-game` / `hormuz-mode` chains
   used by `detector.html` / `market_screen.html`.

Use the TDD skill while building this (`Context/Core_skills/tdd`) — red/green/refactor
per relocated control, verifying the `hormuz-controls` message round-trip before moving
to the next one.
