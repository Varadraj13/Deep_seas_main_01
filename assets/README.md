# Deep Seas — Asset Folders (3-Screen Pre-Game Sequence)

This folder tree holds the **drop-in assets** for the two pre-game modes defined
in `deep_seas_3screen_master_spec_v3_elevenlabs.xlsx`:

- **Mode 00 — Intro** (`mode00_intro`): ~3:00 narrative opening.
- **Mode 01 — Instructions** (`mode01_instruction`): ~1:40 rules sequence.

Total pre-game runtime target: **4:40**, played across three projector pages.

## How to use this
Every leaf folder contains a **`_DROP_ASSETS_HERE.md`** cheat-sheet listing the
exact filenames expected there (Asset ID, source PDF page, target screen,
required/optional). **Drop each asset into its folder using the exact filename.**
The timeline engine built during the later "stitching" step resolves these paths,
so names must match.

## Structure

```
assets/
  audio/                     final runtime voiceover MP3s (intro + 5 instruction sets)
  audio/raw/                 raw ElevenLabs exports before post-processing (producer-only)
  scripts/                   plain-text VO scripts pasted into ElevenLabs (producer-only)
  mode00_intro/png/          Phase 01 slide exports from EYOS_DEEP SEAS_Video 01.pdf
  mode00_intro/gif/          Phase 01 optional motion loops
  mode01_instruction/png/    Phase 02 slide exports + instruction/QR cards (Video 02.pdf)
  mode01_instruction/gif/    Phase 02 optional loops (likely not needed)
data/
  timelines/                 machine-readable JSON cue files (generated during stitching)
```

## Screen mapping
| Position | Page (this repo) | Spec name | Role |
|---|---|---|---|
| Left | `simulator.html` | `simulator.html` | Simulation / evidence |
| Center | `detector.html` | `detector.html` | Argument + **master audio clock** + QR |
| Right | `market_screen.html` | `market_state.html` | Prediction-market state / media |

## Notes for the later "stitching" step
- **Root mapping:** the spec writes paths under `deep-seas-show/`; in this repo
  that maps to the **repo root** (the three HTML pages already live here and load
  assets root-relative, e.g. `Images/Stool.png`). So assets resolve as
  `assets/...` and `data/...` from root.
- **Filename flag:** the manifest's `Target Screen(s)` column says
  `market_state.html`, but the actual file in this repo is **`market_screen.html`**.
  Reconcile this when wiring the timeline engine.
- **Not created here (code — built during stitching):** `timelineEngine.js`,
  `screenRouter.js`, `syncController.js`, `data/timelines/*.json`,
  `styles/show-timeline.css`, `data/audio_manifest.json`, and the Mode 00/01
  overlays inside the three HTML pages.

_This tree was generated from the `Folder_Structure` and `Asset_Manifest` sheets
of the master spec workbook._
