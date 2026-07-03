# Claude Code Prompt — Deep Seas 17-Sequence Pre-Show (Mode 01)

You are working in an existing, working repo (`Deep_seas_main_01`). This file is
your complete brief — read it fully before writing any code. Two reference
files already sit in this repo's root and are the authoritative source for
sequence data (durations, voiceover text, per-slide filenames):

- `deep_seas_17_sequence_master_spec_variable_timing.xlsx` — the master spec
  workbook. Sheets of interest: `README`, `Master_Timeline`, `Timing_Plan`,
  `Screen_Assignment`, `Asset_Manifest`, `Folder_Structure`,
  `Claude_Code_Architecture`, `Claude_Prompt`. Open it and read these sheets;
  they contain the full 17-sequence timing table, per-screen asset assignments,
  and the original architecture contract this build is based on (with two
  corrections noted below).
- `deep_seas_17_sequence_timeline_variable_timing.json` — the same data as
  machine-readable JSON (17 sequence objects with `start`/`end`/`duration`,
  `voiceover_text`, `audio_file`, `script_file`, and per-screen `left`/`center`/
  `right` objects each with `html`, `slide_no`, `preferred_file`, `fallback_file`,
  `media_type`). This is the file you'll copy into `data/timeline_17seq.json`
  with the edits described below — **read it now**, don't just trust this
  prompt's summary of it.

**Use the `tdd` skill for this build** (red-green-refactor). This repo already
has a clear TDD convention to follow — see `js/trigger-gate.js` +
`tests/phase-h-trigger-gate.js` for the exact pattern: pure logic functions in
a `js/*.js` file, exported via
`if (typeof module !== 'undefined' && module.exports) { module.exports = {...}; }`
so the same file loads as a browser `<script>` AND via `require()` in Node;
tests are plain Node scripts (`node tests/whatever.js`) using a hand-rolled
`assert(label, cond, detail)` helper that prints `PASS`/`FAIL` — no test
framework is installed (`package.json` has no jest/vitest/mocha; don't add one).
Write the failing tests for the pure logic first, then implement until green.

---

## What this build is

A 263-second (4:23), 17-sequence, three-projector pre-show ("Mode 01") that
plays slide/video assets with voiceover-synced variable timing (NOT a fixed
20-seconds-per-slide loop), then hands off automatically into the existing,
already-working live simulation ("Mode 02": `simulator.html`, `detector.html`,
`market_screen.html` — built across a separate Phases A–I effort, fully
functional, **do not touch these files or any JS/CSS they load**).

`index.html` is the existing control center. It currently switches all three
projector pages between Mode 01 (a looping background video via
`BroadcastChannel('hormuz-mode')` + `#video-mode`/`#sim-mode` divs) and Mode 02
(the live sim). **Do not touch `index.html` either.** This build does not wire
into that existing mode-switch mechanism — it replaces what "Mode 01" *means*
by building three dedicated pages that operators will open directly.

## Architecture: three new standalone pages, zero edits to existing files

| New file | Screen | Role |
|---|---|---|
| `initial01.html` | left projector | plays the sequence; hands off to `simulator.html` |
| `initial02.html` | center projector | **master controller** (owns the clock, has Start/Pause/Resume/Reset/Skip); hands off to `detector.html` |
| `initial03.html` | right projector | plays the sequence; hands off to `market_screen.html` |

**Do not modify** `simulator.html`, `detector.html`, `market_screen.html`,
`index.html`, `index_01.html`, or any existing file under `js/`/`css/`. This is
a from-scratch build of new files only, plus the two data/script folders below.

### Naming reconciliations (the spec and reality disagree — reality wins)

1. **Asset folder.** The workbook/JSON say `assets/sequence_media/`. The real,
   already-populated folder in this repo is:
   **`assets/complete sequence/ppt exports/`** (note the space in "complete
   sequence" — 51 PNGs already exported: `Slide1.PNG` … `Slide51.PNG`). Point
   `data/timeline_17seq.json`'s `asset_folder` field at the real folder, and
   make the asset resolver `encodeURI()` the constructed path so the space
   never causes a 404.
2. **Right-screen filename.** The spec calls the right screen `marketstate.html`.
   The real file is `market_screen.html`. Don't rename anything — `initial03.html`
   maps internally to `market_screen.html` at hand-off time.
3. **Four slides are MP4, not GIF.** `Slide1.mp4`, `Slide3.mp4`, `Slide49.mp4`,
   `Slide51.mp4` replace what the spec/JSON list as `.gif` for those four slide
   numbers (sequence 1 left/right, sequence 17 left/right). Render these as
   `<video autoplay muted loop playsinline>` instead of `<img>`. **`Slide12.gif`
   (sequence 4, right screen) is assumed to remain a GIF** since it wasn't
   mentioned as changed — if that's wrong, it's a one-line JSON fix.

## Files to create

### 1. `data/timeline_17seq.json`
Copy `deep_seas_17_sequence_timeline_variable_timing.json` verbatim, then:
- Change `"asset_folder": "assets/sequence_media/"` → `"assets/complete sequence/ppt exports/"`.
- For the four MP4 slides, change that screen entry's `preferred_file` to
  `"SlideN.mp4"` and `media_type` to `"mp4"`; leave `fallback_file` as the PNG
  (unchanged).
- Leave every other field (`start`, `end`, `duration`, `voiceover_text`,
  `audio_file`, `script_file`, all other `preferred_file`/`fallback_file`
  values) exactly as in the source JSON.
- **Ignore/do not propagate the JSON's per-screen `path` field** — those were
  precomputed against the old `asset_folder` and go stale. The resolver (below)
  reconstructs paths itself from `asset_folder` + `preferred_file`.

### 2. `js/sequenceController.js`
One shared file loaded by all three `initial0X.html` pages. Structure it with
clearly separated **pure functions** (testable via `require()`, no DOM) and a
thin **DOM/browser glue layer** (BroadcastChannel, rendering, controls) — this
split is what makes the TDD loop possible.

**Pure functions to write tests for FIRST (red), then implement (green):**
- `resolvePagePath(pathname) -> role` — maps `'initial01.html'→'left'`,
  `'initial02.html'→'center'`, `'initial03.html'→'right'`.
- `handoffTargetForRole(role) -> filename` — `'left'→'simulator.html'`,
  `'center'→'detector.html'`, `'right'→'market_screen.html'`.
- `activeSequenceForElapsed(sequences, elapsedSeconds) -> sequence | null` —
  given the JSON's `sequences` array and an elapsed-seconds float, return the
  sequence object whose `start <= elapsed < end` (last sequence's `end` is
  inclusive), or `null` if elapsed is negative or beyond the final `end`. Must
  work for **all 17 variable durations** (8, 14, 16, 10, 14, 12, 18, 22, 16,
  12, 12, 18, 10, 18, 6, 22, 35 — summing to 263) — do not hardcode any
  duration; always read `start`/`end` from the data.
- `resolveAssetPath(assetFolder, filename) -> string` — returns
  `encodeURI(assetFolder + filename)`, correctly handling the space in
  `assets/complete sequence/ppt exports/`.
- `mediaKindForFile(filename) -> 'video' | 'image'` — `.mp4` → `'video'`,
  anything else (`.png`, `.gif`, any case) → `'image'`.
- `nextAssetOnError(screenEntry) -> filename | null` — given a screen's
  `{preferred_file, fallback_file}`, returns `fallback_file` (used by the
  resolver's `onerror` handler to swap sources); returns `null` if there's no
  fallback left to try (i.e. the fallback itself already failed).

Export all of these with the same
`if (typeof module !== 'undefined' && module.exports) { module.exports = {...}; }`
guard used in `js/trigger-gate.js`, so `tests/sequence-controller-logic.js` can
`require('../js/sequenceController.js')` and test them exactly like
`tests/phase-h-trigger-gate.js` does for `evaluateCommit`.

**Browser glue (harder to unit-test; verify manually per the checklist below):**
- On load: `fetch('data/timeline_17seq.json')`, detect role via
  `resolvePagePath(location.pathname)`.
- Render the active sequence's asset for this page's role into a full-viewport
  container using `resolveAssetPath` + `mediaKindForFile` (video vs img), with
  `onerror` wired to `nextAssetOnError` for one fallback attempt, then black
  background + (debug-mode-only) "MISSING: <path>" text if the fallback also fails.
- **Master clock — `initial02.html` (center) only.** On Start (user gesture
  required — browsers block autoplaying audio without one), record `t0 =
  Date.now()`. On each tick (`requestAnimationFrame` or ~250ms interval),
  compute `elapsed = (Date.now() - t0) / 1000`, call `activeSequenceForElapsed`.
  On a sequence change, broadcast a cue (see schema below) and also write it to
  `localStorage` — **only on change or a control action, not every tick** (avoid
  write-spam; followers derive live elapsed locally between cues).
- **Sync channel:** `BroadcastChannel('deep-seas-sequence')`, payload:
  ```json
  {"type": "start|pause|resume|reset|skip|cue|complete", "sequence": 1, "elapsed": 12.4, "ts": 1735900000000}
  ```
  `initial01.html`/`initial03.html` are followers only: listen on this channel
  **and** on `window`'s `storage` event (same payload, `deepSeasSequenceState`
  localStorage key) as a fallback, then just render — no independent clock.
- **Controls — `initial02.html` only:** Start / Pause / Resume / Reset / Skip,
  small fixed control bar. Before Start, all three pages already render
  sequence 1's assets (paused/primed) so operators can check framing pre-show.
- **Debug overlay:** `D` key toggles, independently per page (no cross-page
  sync needed) — shows sequence number, timecode, this page's role, the asset
  path currently attempted, and a missing-asset flag.
- **Audio — `initial02.html` only, optional (per spec):** if
  `sequence.audio_file` exists, attempt `new Audio(path)` playback on cue
  change; on any error, fail silently (one grouped console line, not spammy)
  and never delay/block the visual cue. The system must work with zero audio
  files present — none exist yet; they're being generated separately.
- **Hand-off:** when `elapsed >= 263` (the JSON's `total_duration_seconds`) on
  the master, broadcast `{"type":"complete"}`. Every page (master included),
  on receiving `complete`, does a brief fade-to-black (~300–500ms) then
  `window.location.href = handoffTargetForRole(role)` — i.e.
  `initial01.html → simulator.html`, `initial02.html → detector.html`,
  `initial03.html → market_screen.html`. This is a plain navigation; no shared
  DOM or state with the live pages.

### 3. `css/sequenceMode.css`
Used only by the three new pages. Full-viewport container
(`position:fixed; inset:0; background:#000`), `object-fit:contain` for both
`<img>` and `<video>`, opacity-transition fade between cues (~300–500ms),
low-profile fixed control bar (master page only), monospace debug-overlay
panel. Feel free to reuse the existing design tokens from `css/tokens.css`
(`--bg`, `--fg`, `--font-data` for the debug overlay's monospace text, `--red`/
`--green`/`--amber` for control-button accents) by linking `css/tokens.css`
alongside this new stylesheet — don't redefine those values.

### 4. `initial01.html`, `initial02.html`, `initial03.html`
New standalone pages. `<head>`: same Google Fonts import already used
elsewhere + `<link rel="stylesheet" href="css/tokens.css">` (for token
consistency only — no game CSS) + `<link rel="stylesheet" href="css/sequenceMode.css">`.
`<body>`: one full-viewport media container div, plus (on `initial02.html`
only) the control bar and debug overlay markup, plus
`<script src="js/sequenceController.js"></script>` at the end.

### 5. `assets/scripts/seq_01_vo.txt` … `seq_17_vo.txt`
One file per sequence, containing exactly that sequence's `voiceover_text`
from the JSON — nothing else. These get pasted into ElevenLabs separately;
don't create the corresponding `.mp3` files, and don't let their absence break
anything (see the audio-optional behavior above).

## TDD build order

1. Copy/edit `data/timeline_17seq.json` (data first, per `Claude_Code_Architecture`
   sheet's own build order).
2. Write `tests/sequence-controller-logic.js` (Node-runnable, mirrors
   `tests/phase-h-trigger-gate.js`'s style exactly) with **failing** tests for
   all six pure functions above — cover: all 17 sequences' start/end boundaries
   (including the exact boundary values, e.g. elapsed=8 belongs to sequence 2
   not sequence 1, since sequence 1 is `[0,8)`), elapsed before 0 and after 263,
   the MP4 vs image media-kind split, the space-containing asset path, and the
   fallback-then-give-up chain.
3. Implement the pure functions in `js/sequenceController.js` until
   `node tests/sequence-controller-logic.js` is all green.
4. Add the browser glue (BroadcastChannel sync, rendering, controls, debug
   overlay, hand-off) on top of the now-tested pure functions.
5. Build `css/sequenceMode.css` and the three HTML pages.
6. Generate the 17 VO `.txt` files.
7. Run the manual verification checklist below (this part isn't unit-testable
   — it's a real three-window timing/sync check).

## Explicitly out of scope / do not touch

- `simulator.html`, `detector.html`, `market_screen.html`, `index.html`,
  `index_01.html` — zero edits.
- Any existing `js/*.js` or `css/*.css` file — read-only reference at most
  (e.g. `css/tokens.css` for variables).
- `hormuz-mode`, `deepseas-game`, `hormuz-game`, `hormuz-heartbeat`
  BroadcastChannels — don't touch, don't listen on them from the new pages.
- Old `assets/mode00_intro/`, `assets/mode01_instruction/`, `assets/audio/`
  (EL00x-named placeholders), old `data/timelines/` folder from a prior,
  superseded spec — leave as-is, don't delete.
- Wiring `index.html`'s existing mode buttons to open the new pages
  automatically — not required for this build.

## Manual verification (after tests pass and pages are built)

1. Open `initial01.html`, `initial02.html`, `initial03.html` directly in three
   windows/tabs. Confirm all three show sequence 1's assets before pressing
   Start (left/right playing `Slide1.mp4`/`Slide3.mp4` on loop, center showing
   `Slide2.PNG`).
2. Press Start on `initial02.html`; confirm all three advance together through
   all 17 sequences at the correct variable durations (8, 14, 16, 10, 14, 12,
   18, 22, 16, 12, 12, 18, 10, 18, 6, 22, 35s), cross-checked against the debug
   overlay's timecode against the JSON/workbook's `timecode` column.
3. Confirm `Slide49.mp4`/`Slide51.mp4` play at sequence 17, and `Slide12.gif`
   still renders at sequence 4 (right screen).
4. Test Pause / Resume / Reset / Skip from `initial02.html`; confirm all three
   stay in sync.
5. Temporarily rename a real asset file to simulate a missing one; confirm
   graceful PNG/GIF/MP4 fallback, black screen + debug-only warning when both
   preferred and fallback are missing.
6. Let the sequence run to completion (or Skip to the end); confirm all three
   pages navigate cleanly to `simulator.html`/`detector.html`/`market_screen.html`
   respectively, landing in the already-working live game untouched.
7. Confirm the space in `assets/complete sequence/ppt exports/` doesn't break
   any asset load (check the Network tab for 404s from unencoded spaces).
