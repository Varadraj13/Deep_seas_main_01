# Drop assets here → `assets/audio/`

Place the files listed below directly in this folder. Filenames must match exactly — the timeline engine (built during the later "stitching" step) will look for these paths.

| Asset ID | Filename | Type | Source | Target screen(s) | How to create | Required | Notes |
|---|---|---|---|---|---|---|---|
| A023 | `mode00_intro_voiceover.mp3` | audio | ElevenLabs | detector.html master clock | generate | required | 3:00 target runtime. |
| B014 | `mode01_rules_voiceover.mp3` | audio | ElevenLabs | detector.html master clock | generate | required | 1:40 target runtime. |
| EL001 | `phase01_intro_vo.mp3` | audio | ElevenLabs | detector.html master clock | generate from assets/scripts/phase01_intro_vo.txt; pad/trim to 180s | required | Replaces/aliases old mode00_intro_voiceover.mp3 naming; use this in final code. |
| EL003 | `phase02_mode01_set01.mp3` | audio | ElevenLabs | detector.html | generate from phase02_mode01_set01.txt; pad/trim to 20s | required | Set 01 system/question framing. |
| EL004 | `phase02_mode01_set02.mp3` | audio | ElevenLabs | detector.html | generate from phase02_mode01_set02.txt; pad/trim to 20s | required | Set 02 player/audience rules. |
| EL005 | `phase02_mode01_set03.mp3` | audio | ElevenLabs | detector.html | generate from phase02_mode01_set03.txt; pad/trim to 20s | required | Set 03 screen/layer architecture. |
| EL006 | `phase02_mode01_set04.mp3` | audio | ElevenLabs | detector.html | generate from phase02_mode01_set04.txt; pad/trim to 20s | required | Set 04 object/camera/game object rules. |
| EL007 | `phase02_mode01_set05.mp3` | audio | ElevenLabs | detector.html | generate from phase02_mode01_set05.txt; pad/trim to 20s | required | Set 05 QR/betting onboarding. |

---
_Generated from the `Asset_Manifest` sheet of `deep_seas_3screen_master_spec_v3_elevenlabs.xlsx`._
