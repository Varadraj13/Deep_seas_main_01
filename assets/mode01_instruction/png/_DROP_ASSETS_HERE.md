# Drop assets here → `assets/mode01_instruction/png/`

Place the files listed below directly in this folder. Filenames must match exactly — the timeline engine (built during the later "stitching" step) will look for these paths.

| Asset ID | Filename | Type | Source | Target screen(s) | How to create | Required | Notes |
|---|---|---|---|---|---|---|---|
| B001 | `slide_01_system.png` | png | Video 02 / p.1 | detector.html | export from PDF | required | System architecture title/argument. |
| B002 | `slide_02_question.png` | png | Video 02 / p.2 | simulator.html + market_state.html | export from PDF | required | Question screen; if slide text is not parsed, export manually. |
| B003 | `slide_03_game_intro.png` | png | Video 02 / p.3 | simulator.html | export from PDF | required | Two players / audience bets / object fires. |
| B004 | `slide_04_game_loop.png` | png | Video 02 / p.4 | market_state.html | export from PDF | required | Probability moves / ships slow / winner condition. |
| B005 | `slide_05_simulation_layer.png` | png | Video 02 / p.5 | simulator.html | export from PDF | required | Simulation layer. |
| B006 | `slide_06_detection_layer.png` | png | Video 02 / p.6 | detector.html | export from PDF | required | Object detection layer. |
| B007 | `slide_07_market_layer.png` | png | Video 02 / p.7 | market_state.html | export from PDF | required | Prediction market layer. |
| B008 | `slide_08_detection_models.png` | png | Video 02 / p.8 | simulator.html | export from PDF | required | Detection models/training data. |
| B009 | `slide_09_lab_space.png` | png | Video 02 / p.9 | detector.html | export from PDF | required | Lab photo / spatial context. |
| B010 | `slide_10_objects.png` | png | Video 02 / p.10 | market_state.html | export from PDF | required | Object set / game pieces. |
| B011 | `instruction_left_watch_simulation.png` | png | generated | simulator.html | create text PNG or HTML text | required | Short instruction: watch simulation. |
| B012 | `qr_prediction_market.png` | png | generated from mobile URL | detector.html | generate QR | required | Scan to enter mobile prediction market. |
| B013 | `instruction_right_place_bet.png` | png | generated | market_state.html | create text PNG or HTML text | required | Short instruction: place bet. |

---
_Generated from the `Asset_Manifest` sheet of `deep_seas_3screen_master_spec_v3_elevenlabs.xlsx`._
