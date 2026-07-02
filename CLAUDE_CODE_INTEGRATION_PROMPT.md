# Claude Code Integration Brief — Broadcast Console → detector.html

## What this is

`detector_prototype.dc.html` is a **finished visual + behavioral spec** for the redesign of
`detector.html`'s simulation mode. It was built in a component framework you don't need to
understand or run — **do not load it, do not keep `support.js`**. Your job is to port its
design and behavior into plain HTML/CSS/JS matching this repo's conventions, and to move
the detection engine out of `detector.html` into `control-center.html`.

Treat the prototype as the single source of truth for layout, typography, colors, spacing,
copy, and reaction behavior. Where this brief and the prototype disagree on visuals, the
prototype wins. Where they disagree on wiring, this brief wins.

---

## How to read the prototype file

Open `detector_prototype.dc.html` and read it as a spec, not as runnable code:

- The markup between `<x-dc>` and `</x-dc>` is the page template. Everything is inline-styled —
  lift those styles verbatim into classes/IDs in a `<style>` block (repo convention).
- `{{ name }}` holes are dynamic values. Their sources are in the `class Component` script at
  the bottom — `renderVals()` returns every template input by name.
- `<sc-for list="{{ x }}" as="item">…</sc-for>` = render the block per array item.
- `<sc-if value="{{ x }}">…</sc-if>` = conditional render.
- `style-hover="…"` = `:hover` rules. `<helmet>` contents = `<head>` contents
  (Google Fonts links, `@keyframes`, body reset).
- The `<x-import component-from-global-scope="deck-stage">`-style tags do not appear here;
  ignore any `data-dc-*` attributes.
- The logic class contains the full registries and behaviors: `WEAPONS` (id → name, player,
  delta), `NEWS` (id → alert, sat, angles[4]), `IDLE_ITEMS`, `KEY_MAP`, `applyFire()`,
  `joltTable()`, `tickLiveColumn()`, `idleState()`, clock, and BroadcastChannel wiring.
  Port these as plain functions + module-level state.

---

## The game-state chain (end-to-end — this is the spine of the whole system)

```
camera → TM model predict loop          (control-center.html, moved from old detector.html)
  └→ ≥50% confident, debounced → post {type:'FIRE_WEAPON', weaponId} on 'deepseas-game'
       └→ js/bootstrap.js receiver       (simulator.html — THE game engine; must be open)
            └→ fireWeapon(id) mutates marketState (prob_delta, activeWeapons, decay)
                 └→ broadcastGameState() posts {shipProbability, lane, activeWeapons, round}
                    on 'hormuz-game'
                      ├→ market_screen.html   — odds/market state page updates
                      └→ detector.html        — odds % updates + incident gets REPORTED
```

The broadcast console (detector.html) reads the chain at TWO points:

- **Fast path (news reaction):** `FIRE_WEAPON` events on `deepseas-game` — instant alert/
  ticker/satellite/table reaction, no round-trip wait.
- **Authoritative path (state):** every `hormuz-game` snapshot. `shipProbability` always
  overwrites the odds. Additionally, **diff `activeWeapons` against the previous snapshot**:
  any newly-appeared weaponId that wasn't alerted in the last ~3s → `applyFire(id)`.
  This matters because `simulator.html`'s own local keyboard (bootstrap.js binds `1–6` and
  `Q–Y`, rebound to `a–f` as part of this work) calls `fireWeapon()` directly WITHOUT posting `FIRE_WEAPON` — without the diff,
  incidents fired from the simulator would never be reported on the broadcast console.
  The diff also self-heals a detector opened mid-game.

If `simulator.html` is closed, the detector's optimistic local delta is the only odds
movement and never gets corrected — acceptable for rehearsal, but the installation runs
with the simulator open.

---

## Target architecture (three files touched, one created)

### 1. `detector.html` — rebuilt: the Broadcast Console (display-only)

**Keep byte-identical:**
- The `#video-mode` block (fullscreen `<video id="bgVideo">`) and the `hormuz-mode`
  BroadcastChannel mode-switch script at the bottom. Video mode remains the default boot state;
  `{mode:'simulation'}` shows the broadcast console, `{mode:'video_playback'}` returns to video.

**Replace entirely:** everything inside `#sim-mode`. The old contents (backNav, actionDisplay,
techPanel, retryBtn, old statusBar, the whole TM/tfjs detection script) move out or die:

| Old element | Fate |
|---|---|
| `#backNav` (← HORMUZ SIM) | **Delete.** Broadcast screen is chrome-free. |
| `#actionDisplay` center card | **Delete** — replaced by the weapon-alert panel. |
| `#techPanel` + model dropdown | **Move to `control-center.html`** (see §2). |
| `#cameraWrap` thumbnail | **Replace** with the prototype's camera panel (tap to enable). |
| `#statusBar` (MODEL/PLAYER/ACTION/FPS) | **Delete** — detection telemetry lives in control-center now. The prototype's own bottom status strip replaces it. |
| TM/tfjs CDN scripts + detection JS | **Move to `control-center.html`.** detector.html loads NO ML libraries. |

**New `#sim-mode` contents — port 1:1 from the prototype:**
- Headline ticker (top, 108px, Playfair Display serif, marquee cycling the fired weapon's
  4 angles, ◆ separators; idle = `IDLE_ITEMS`)
- Main row: weapon alert panel (`#weaponAlert`, flashWipe animation, 54px Playfair uppercase
  title, weapon name subtitle) · odds panel ("Odds of disruption" + 72px `%`) · camera panel
  (click-to-enable `getUserMedia` thumbnail, `○ OFFLINE` → `● LIVE`)
- Satellite hero (`#satPanel`): dominant image area, striped placeholder + `img: <file>` hint
  when missing, GWN bug, BREAKING flag (white), lower-third with dateline + clock + source
- Bloomberg terminal (`#bloombergTable`): amber `BLOOMBERG PROFESSIONAL` status bar (#F09500),
  header row, data grid, `F1 HELP … F12 CMDTY` amber function footer
- Fonts: Google Fonts `JetBrains Mono` (all UI/data chrome) + `Playfair Display` (all news/
  editorial text). Colors: #080808 bg, #f4f4f4 primary, #888 secondary, #444 receded; red
  ONLY in negative table cells, green only in positive cells.

**Wiring (all in one plain `<script>`):**
```js
const ch = new BroadcastChannel('deepseas-game');   // ONE instance: post + listen
ch.onmessage = e => {
  const m = e.data || {};
  if (m.type === 'FIRE_WEAPON' && m.weaponId) applyFire(m.weaponId);
};
const oddsCh = new BroadcastChannel('hormuz-game');
let prevActive = [];               // weaponIds from the last snapshot
const recentlyAlerted = new Map(); // weaponId -> ts, suppress dupes for ~3s
oddsCh.onmessage = e => {
  const m = e.data || {};
  if (typeof m.shipProbability === 'number') setProb(m.shipProbability); // authoritative
  if (Array.isArray(m.activeWeapons)) {
    m.activeWeapons.filter(id => !prevActive.includes(id)).forEach(id => {
      const t = recentlyAlerted.get(id);
      if (!t || Date.now() - t > 3000) applyFire(id);   // engine-confirmed fire
    });
    prevActive = m.activeWeapons.slice();
  }
};
// applyFire() must record recentlyAlerted.set(id, Date.now()) so the fast path
// (FIRE_WEAPON event) and this diff path never double-report the same fire.
```
- `applyFire(id)`: reads weapon name/player from `WEAPONS_CONFIG` (load `js/weapons-config.js`
  — do NOT duplicate a weapons registry), news from `BROADCAST_NEWS[id]`, swaps ticker angles,
  fires alert flash, sets satellite image, swaps the Bloomberg table (see below), applies an
  optimistic local odds delta (`prob_delta` from WEAPONS_CONFIG) that the next real
  `hormuz-game` broadcast overwrites.
- **Keyboard = real game triggers** (`1–6` → D01–D06, `a–f` → R01–R06, `0`/`Escape` → reset
  the broadcast UI to idle — game state is NOT reset; the engine's decay handles that).
  On keypress: `applyFire(id)` locally AND `ch.postMessage({type:'FIRE_WEAPON',
  weaponId:id})` followed by `ch.postMessage({type:'CURRENT_PLAYER', player: nextTurn})`
  (same hand-off contract as the old detection loop: disruptor fired → defender's turn).
  Note: a BroadcastChannel instance never receives its own posts, so posting and listening
  on the same `ch` instance cannot double-apply.
  ⚠️ **Standardize `1–6` / `a–f` across ALL pages, including simulator.html.** In
  `js/bootstrap.js`: rebind defenders from `KeyQ–KeyY` to `KeyA–KeyF` (a=R01, b=R02, c=R03,
  d=R04, e=R05, f=R06) and delete the Q–Y weapon bindings. This collides with four existing
  sim toggles — move them to Shift+key: `Shift+A` analytics, `Shift+B` DB panel, `Shift+D`
  drag mode, `Shift+F` GFW. All other sim keys (Space, N, H, K, comma, period, +/-, Escape)
  stay put. Keep the existing `e.target.tagName` input guard, and make the new weapon
  bindings ignore Shift-modified presses so the toggles don't also fire weapons.
  Simulator's local fires still call `fireWeapon()` directly (no channel post needed — the
  broadcast console picks them up via the `activeWeapons` diff).
- Clock ticks 1s; live table column jitters every 2.2s (port `tickLiveColumn`).

**Bloomberg table ← `bloomberg-data.js`** (replaces the prototype's self-contained
`COMPANIES`/`genTable` data — keep the prototype's *visual* rendering):
- The file is per-weapon: `bloombergData[weaponId] = {title, compSource, companies:[{name,
  color, base:[9 weekly values]}], reactionNote}` + shared `weekEndingDates` (9 columns).
- It ends with `export { bloombergData, weekEndingDates }` — check how `market_screen.html`
  loads it and match (module import vs. stripping the export to a global). Keep one approach
  consistent across both pages.
- **Idle:** render D01's dataset showing columns 1–8; column 9 (current week) shows a small
  live jitter around column 8's value.
- **On fire:** swap header title + compSource + rows to `bloombergData[weaponId]`; animate
  column 9 from column 8's value to the dataset's column-9 value over ~800ms (count-up tick,
  per the usage comment in the data file). Handle `"ERR"` strings (D06 renders literal `ERR`,
  no number formatting) and D05's all-zero freeze (renders `0.00`, gray).
- Cell colors: `> +0.3` green #22c55e, `< -0.3` red #ef4444, else #666. Last column keeps the
  brighter header + faint white bg per the prototype.

### 2. `control-center.html` — gains the Detection Engine

Move from old `detector.html`, preserving logic exactly:
- The two CDN scripts **with their version-pinning comment** (tfjs@1.3.1 + teachablemachine
  @0.8.5 — do not "upgrade"; the comment explains why).
- `js/weapons-config.js` include, `loadManifest()` → model dropdown → `loadModel(path)` →
  `buildLabelMap()`/`buildConfigTable()` from each model folder's `label-map.json`.
- Webcam + 224×224 predict loop, FPS EMA, `CONFIDENCE_THRESHOLD = 0.50`,
  `FIRE_DEBOUNCE_MS = 8000`, firing block: post `FIRE_WEAPON` per weaponId + `CURRENT_PLAYER`
  hand-off on `deepseas-game`.
- The tech panel UI (`#techPanel`: model status, camera status, FPS, frames, top class,
  confidence, class-probability bars, label map table) + retry button + its own camera
  preview. Restyle to sit within control-center's existing layout; keep the class names
  (`tp-*`) so the moved JS works unchanged.
- Also wire the same 1–6/a–f/0 keyboard handler here — any focused game page can trigger.

### 3. `js/broadcast-news.js` — new file

Extract the prototype's `NEWS` registry (12 weapons × {alert, sat, angles[4]}) and
`IDLE_ITEMS` verbatim into a plain script (repo convention — like `js/weapons-config.js`):
```js
const BROADCAST_NEWS = { D01: {alert:'STRAIT SEALED', sat:'D01_strait_closure.jpg', angles:[…]}, … };
const BROADCAST_IDLE_ITEMS = […];
```
Angle order is meaningful: [direct impact, economic, geopolitical, human].

### 4. Satellite images

`IMAGE_BASE = 'Images/broadcast/'` (create the folder; single const at the top of the
broadcast script so it's trivially changeable). Files named by each entry's `sat` field
(e.g. `D04_drone_strike.jpg`). Missing file → `onerror` → striped placeholder + filename hint,
exactly as the prototype does.

---

## Channel contract (do not invent new messages)

| Channel | Message | Producer → Consumer |
|---|---|---|
| `deepseas-game` | `{type:'FIRE_WEAPON', weaponId}` | control-center detection / any page's keyboard → game engine (`js/bootstrap.js`) + detector broadcast UI |
| `deepseas-game` | `{type:'CURRENT_PLAYER', player}` | fired-by page → game engine |
| `hormuz-game` | `{shipProbability, lane, activeWeapons, round}` | `js/game-broadcast.js` (simulator) → detector odds % + activeWeapons fire-diff, market_screen |
| `hormuz-mode` | `{mode:'video_playback'\|'simulation'}` | control-center → detector mode switch |

---

## Acceptance checklist (verify all before done)

1. `detector.html` boots into video mode; `hormuz-mode` messages toggle video ↔ broadcast console.
2. `detector.html` loads no tfjs/TM scripts, no `support.js`; works served the same way as the other pages.
3. `control-center.html`: model loads (Final_model default), camera starts, class bars move,
   holding a trained object ≥50% fires once (8s debounce).
4. Full chain with `simulator.html` open: fire from control-center → detector reacts
   (ticker angles cycle, alert flash, satellite slot, table swap + 800ms column tick),
   simulator's marketState changes, and the real odds arrive back via `hormuz-game`
   overwriting the optimistic % — detector and market_screen show the same number.
4b. Fire from SIMULATOR's own keyboard (focus simulator, press `1` or `d`): detector still
   reports the incident (via the `activeWeapons` diff) — and does not double-report fires
   that came in as `FIRE_WEAPON` events.
5. Keys 1–6/a–f on either page trigger the same full chain; `0`/`Escape` resets detector to
   idle (ALL CLEAR / idle ticker / D01 idle table / 50% only until next real broadcast).
6. D05 fire → flat frozen column; D06 fire → `ERR` cells render without NaN styling.
7. Camera thumbnail on detector: click enables webcam, `● LIVE`; denial shows `○ DENIED`.
8. Zero red anywhere except negative table cells. BREAKING flag is white.
9. Typography: only two families load — JetBrains Mono + Playfair Display.

Keep `detector_prototype.dc.html` + `support.js` in the repo untouched until visual parity is
confirmed side-by-side, then delete both in a separate commit.
