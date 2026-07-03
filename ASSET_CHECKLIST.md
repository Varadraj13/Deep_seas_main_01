# Deep Seas Asset Checklist

Go top to bottom. For each row, drop the file into the named folder using the **exact filename shown**, then check the box. Items marked *(optional)* can be skipped for a first pass. Once every required box below is checked, the stitching step (timeline engine + JSON cues + HTML overlays) can start.

This checklist covers **runtime assets only** — it does not include producer-only files (`assets/audio/raw/` raw ElevenLabs exports, `assets/scripts/` VO text scripts). See each folder's `_DROP_ASSETS_HERE.md` for full manifest detail if needed.

## assets/mode00_intro/png/  (20 files)
- [ ] `slide_01_title.png` — Video 01 / p.1 — Title asset.
- [ ] `slide_03_map.png` — Video 01 / p.3 — Map/interface asset.
- [ ] `slide_04_vessel_density.png` — Video 01 / p.4 — Vessel density / traffic.
- [ ] `slide_09_oil_stock.png` — Video 01 / p.9 — Oil stock consequence media.
- [ ] `slide_03_interface_map.png` — Video 01 / p.3 — Could be same file as slide_03_map.png.
- [ ] `slide_07_hormuz_military.png` — Video 01 / p.7 — Military map.
- [ ] `slide_05_market_text.png` — Video 01 / p.5 — April 2024 / $155M text.
- [ ] `slide_06_doj_article.png` — Video 01 / p.6 — DOJ prediction market article screenshot.
- [ ] `slide_14_timeline.png` — Video 01 / p.14 — Timeline.
- [ ] `slide_10_polymarket_traffic.png` — Video 01 / p.10 — Polymarket chart.
- [ ] `slide_08_news_article.png` — Video 01 / p.8 — News/closure article.
- [ ] `slide_13_why_text.png` — Video 01 / p.13 — Why text.
- [ ] `slide_20_access_mismatch.png` — Video 01 / p.20 — Access mismatch graph.
- [ ] `slide_15_invisibility_text.png` — Video 01 / p.15 — Invisibility quote/text.
- [ ] `slide_18_insider_probability.png` — Video 01 / p.18 — Insider probability graph.
- [ ] `slide_17_two_experiences.png` — Video 01 / p.17 — Two experiences text.
- [ ] `slide_16_vix_fear_graph.png` — Video 01 / p.16 — VIX fear graph.
- [ ] `slide_19_question.png` — Video 01 / p.19 or p.21 — What if system showed you the room?
- [ ] `slide_22_systems_dramaturgy.png` — Video 01 / p.22 — Systems dramaturgy definition.
- [ ] `slide_23_research_questions.png` — Video 01 / p.23 — Research questions.

## assets/mode00_intro/gif/  (3 files, optional)
- [ ] `slide_14_timeline_crop.gif` *(optional)* — Video 01 / p.14 — Animated crop/pan across timeline bands.
- [ ] `slide_10_11_polymarket_flicker.gif` *(optional)* — Video 01 / pp.10-11 — Flicker between Polymarket screenshots.
- [ ] `black_ocean_loop.gif` *(optional)* — generated/stock/abstract — Can be replaced with black screen.

## assets/mode01_instruction/png/  (13 files)
- [ ] `slide_01_system.png` — Video 02 / p.1 — System architecture title/argument.
- [ ] `slide_02_question.png` — Video 02 / p.2 — Question screen; if slide text is not parsed, export manually.
- [ ] `slide_03_game_intro.png` — Video 02 / p.3 — Two players / audience bets / object fires.
- [ ] `slide_04_game_loop.png` — Video 02 / p.4 — Probability moves / ships slow / winner condition.
- [ ] `slide_05_simulation_layer.png` — Video 02 / p.5 — Simulation layer.
- [ ] `slide_06_detection_layer.png` — Video 02 / p.6 — Object detection layer.
- [ ] `slide_07_market_layer.png` — Video 02 / p.7 — Prediction market layer.
- [ ] `slide_08_detection_models.png` — Video 02 / p.8 — Detection models/training data.
- [ ] `slide_09_lab_space.png` — Video 02 / p.9 — Lab photo / spatial context.
- [ ] `slide_10_objects.png` — Video 02 / p.10 — Object set / game pieces.
- [ ] `instruction_left_watch_simulation.png` — generated — Short instruction: watch simulation.
- [ ] `qr_prediction_market.png` — generated from mobile URL — Scan to enter mobile prediction market.
- [ ] `instruction_right_place_bet.png` — generated — Short instruction: place bet.

## assets/audio/  (6 files)
- [ ] `phase01_intro_vo.mp3` — ElevenLabs — Replaces/aliases old mode00_intro_voiceover.mp3 naming; use this in final code.
- [ ] `phase02_mode01_set01.mp3` — ElevenLabs — Set 01 system/question framing.
- [ ] `phase02_mode01_set02.mp3` — ElevenLabs — Set 02 player/audience rules.
- [ ] `phase02_mode01_set03.mp3` — ElevenLabs — Set 03 screen/layer architecture.
- [ ] `phase02_mode01_set04.mp3` — ElevenLabs — Set 04 object/camera/game object rules.
- [ ] `phase02_mode01_set05.mp3` — ElevenLabs — Set 05 QR/betting onboarding.

## data/timelines/  (2 files — informational only, Claude Code generates these during stitching, not a manual drop)
- [ ] `mode00_intro.json` — this workbook / Phase01_Intro — Timeline cue file for intro. *(auto-generated later, no action needed now)*
- [ ] `mode01_instructions.json` — this workbook / Phase02_Mode01 — Timeline cue file for instructions. *(auto-generated later, no action needed now)*

---
_Generated from the `Asset_Manifest` sheet of `deep_seas_3screen_master_spec_v3_elevenlabs.xlsx`. Excludes: superseded audio names (`mode00_intro_voiceover.mp3`, `mode01_rules_voiceover.mp3`), raw ElevenLabs exports, and VO scripts — producer-only, not tracked here._
