# Drop assets here → `assets/audio/raw/`

Place the files listed below directly in this folder. Filenames must match exactly — the timeline engine (built during the later "stitching" step) will look for these paths.

| Asset ID | Filename | Type | Source | Target screen(s) | How to create | Required | Notes |
|---|---|---|---|---|---|---|---|
| EL002 | `phase01_intro_vo_raw.mp3` | audio_raw | ElevenLabs | production only | download/export from ElevenLabs before ffmpeg | required | Raw file is not used at runtime. |
| EL008 | `phase02_mode01_set##_raw.mp3` | audio_raw | ElevenLabs | production only | download/export one raw MP3 per set | required | Use ## = 01 through 05. Raw files are not used at runtime. |

---
_Generated from the `Asset_Manifest` sheet of `deep_seas_3screen_master_spec_v3_elevenlabs.xlsx`._
