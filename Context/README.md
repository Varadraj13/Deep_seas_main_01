# Skills — Deep Seas / Malacca Simulator
## Master index for agents, skills, and build processes

This folder is the single source of truth for how AI agents build
features on the Malacca simulator / Deep Seas prediction market layer.
Open this file at the start of any session. Everything else branches
from here.

**Project root**: `C:\Users\vvb2112\Test_simulator-main\`
**Primary file**: `index.html` (~3150 lines — HTML + CSS + JS in one)
**Last updated**: 2026-04-11

---

## Folder layout

```
Skills/
├── README.md                          ← you are here
├── DOCUMENTATION.md                   ← full granular phase/unit build guide
├── agent-creation-process.md          ← framework: how to run multi-agent builds
├── skills-creation-framework.md       ← framework: how to author skill files
│
├── skills/                            ← project-specific skill files (loaded by agents)
│   ├── project-context.md             ← Type 1: what the project is, architectural rules
│   ├── index-html-patterns.md         ← Type 3: frontend / HTML / CSS / JS conventions
│   ├── data-patterns.md               ← Type 4: IndexedDB, localStorage, MARKETS schema
│   └── domain-patterns.md             ← Type 6: maritime + finance + prediction market rules
│
└── agents/                            ← agent start prompts + ownership
    ├── phase1-stabilize-agent.md      ← owns units 1A-1, 1A-2, 1B-1
    ├── phase2-market-agent.md         ← owns units 2A-1, 2A-2, 2B-1, 2B-2, 2B-3
    ├── phase3-polish-agent.md         ← owns units 3A-1, 3A-2
    └── reviewer-agent.md              ← read-only QA, never writes code
```

---

## How to use this folder

### Start of every session

1. Pick the agent for the unit you are building (see "Agent → unit
   mapping" below).
2. Open that agent's file in `Skills/agents/`.
3. Copy its **start prompt** into a fresh Claude Code terminal.
4. The prompt tells the agent which skill files to read — those live
   in `Skills/skills/`.
5. Ask the agent to confirm it has read the skill files and to list
   the key constraints back to you. **Do not start building until
   that confirmation is correct.**
6. Tell the agent which unit to build. One unit at a time. Wait for
   verification between units.

### Which agent for which unit

| Unit | Agent | Skill files loaded |
|---|---|---|
| 1A-1 (CONFIG block) | `phase1-stabilize-agent.md` | project-context, index-html-patterns, data-patterns, domain-patterns |
| 1A-2 (MediaPipe timeout) | `phase1-stabilize-agent.md` | same |
| 1B-1 (camera pre-warm) | `phase1-stabilize-agent.md` | same |
| 2A-1 (MARKETS + initMarketHistory) | `phase2-market-agent.md` | same |
| 2A-2 (shiftMarkets) | `phase2-market-agent.md` | same |
| 2B-1 (Kalshi HTML + CSS) | `phase2-market-agent.md` | same |
| 2B-2 (renderKalshiOverlay) | `phase2-market-agent.md` | same |
| 2B-3 (wire into confirmDrag) | `phase2-market-agent.md` | same |
| 3A-1 (Kalshi projection sizing) | `phase3-polish-agent.md` | project-context, index-html-patterns, domain-patterns |
| 3A-2 (resetMarkets + R key) | `phase3-polish-agent.md` | same |
| *any unit under review* | `reviewer-agent.md` | all four skill files |

---

## Ownership table

This project is single-file so there is no hard file-level partition
between agents — but each agent has a time-based ownership window and
a scope inside `index.html` it is allowed to edit.

| Agent | Owns during its phase | Never touches |
|---|---|---|
| **phase1-stabilize-agent** | `CONFIG` block, MediaPipe load section, MediaPipe init section | `MARKETS`, Kalshi overlay, `confirmDrag` body, sim loop, GFW layer |
| **phase2-market-agent** | `CONFIG.MARKET`, `MARKETS`, `initMarketHistory`, `shiftMarkets`, `renderKalshiOverlay`, `#kalshiOverlay` HTML + CSS, `confirmDrag` / `cleanupDrag` tail hooks, keyboard handler | Phase 1 units, sim physics, vessel generation, port data, GFW layer, financial model |
| **phase3-polish-agent** | `#kalshiOverlay` CSS only, `resetMarkets`, R-key override | `shiftMarkets`, `MARKETS`, `renderKalshiOverlay`, any Phase 1/2 body |
| **reviewer-agent** | Nothing — read-only | Every file. Reads everything, writes nothing |

**Shared-file rule**: only one agent may have an editing session
against `index.html` at a time. The orchestrator enforces this by
running only one execution-agent terminal at a time during a given
unit. The reviewer can run concurrently because it is read-only.

---

## The build process (per unit)

This is the ten-step loop the orchestrator runs for every unit:

```
1.  Look up the unit in the "which agent for which unit" table above.
2.  Open that agent's terminal. If it's a fresh session, paste the
    start prompt from the agent's file in Skills/agents/.
3.  Wait for the agent to confirm it has read the skill files AND
    listed the key constraints correctly. If the constraints are
    wrong, correct before any code is written.
4.  Say: "Build unit [ID] as specified in Skills/DOCUMENTATION.md."
5.  Agent shows its plan. READ IT. If wrong, correct before code.
    If right, say "go ahead".
6.  Agent writes the code. READ IT before accepting.
7.  Optional but recommended for any unit touching finance, MARKETS,
    or IndexedDB: paste the diff into the reviewer terminal. Wait
    for PASS/FAIL. If FAIL, send the reviewer's notes back to the
    execution agent and loop.
8.  Run the unit's verify step from DOCUMENTATION.md.
9.  If verify passes: say "verified, continue to unit [next]".
    If verify fails: debug using the "where to look when debugging"
    section of the unit in DOCUMENTATION.md.
10. Repeat from step 4.
```

**The gate**: never say "continue" until the verify step passes.
Skipping verify is how Phase 4 debugging sessions get born.

---

## Context management

`index.html` is ~3150 lines. Loading the full file into context costs
roughly 54k tokens. Use the skill files instead — they compress the
file's conventions into ~8k tokens total:

| File | Approx tokens |
|---|---|
| `skills/project-context.md` | ~1,800 |
| `skills/index-html-patterns.md` | ~2,400 |
| `skills/data-patterns.md` | ~2,000 |
| `skills/domain-patterns.md` | ~2,400 |
| **Total across all four** | **~8,600** |

Between subphases, run `/compact` in Claude Code to reclaim context
space, then ask the agent to re-confirm the key constraints from its
skill files (compaction sometimes softens them).

Never paste `index.html` into the chat. Tell the agent:
```
Read index.html directly from disk.
```
File reads cost tool-call tokens, not message tokens, and message
tokens are what compound.

---

## Critical rules that apply to every agent

These are hard constraints enforced by every skill file. Reviewer
will always FAIL a violation:

1. **Single-file app.** No new files, no bundlers, no build step.
   Project must run via `python -m http.server 8000` with zero install.
2. **Never rename `_lerpVal`** back to `lerp` — Chart.js 4.4.1 owns
   the global `lerp`.
3. **MediaPipe loads async.** Never add synchronous
   `<script src=".../mediapipe/...">` tags.
4. **Animation loop is hardened.** `requestAnimationFrame(animate)`
   must be called *before* `updateSim(dt)`, and `updateSim` stays
   wrapped in `try/catch`.
5. **NaN-guard every new `marker.setLatLng()` call.**
6. **Hand coordinate mirror.** `handToLatLng()` keeps its `(1 - nx)`.
7. **Constants live in `CONFIG`** after Phase 1 Unit 1A-1 lands.
   No loose top-level constants.
8. **No new frameworks or CDN scripts** beyond Leaflet, Chart.js,
   and MediaPipe (all already loaded).
9. **`dbPut()` is fire-and-forget.** Never `await` it.
10. **`MARKETS` is never persisted.** Session-only by design.
11. **Kalshi pricing invariant**: `yesPrice + noPrice === 97`.
12. **`profitDelta` sign**: positive saves money, negative costs money.
13. **Terminal palette**: `#080808 / #0a0a0a / #1a1a1a / #888888 / #cc0000`,
    Helvetica/Arial, sharp corners, uppercase labels.
14. **GFW token stays where it is** (line ~1392). Never log, never
    print, never move to a client-side cache.

---

## Reference documents

- **`Skills/DOCUMENTATION.md`** — unit-by-unit build guide with the
  verbatim Claude Code prompts, verify steps, debug notes, and sprint
  schedule. This is the source of truth for *what* each unit does.
- **`Skills/agent-creation-process.md`** — the reusable framework
  used to design the agent architecture for this project. Reference
  this if you're replicating the setup on another project.
- **`Skills/skills-creation-framework.md`** — the reusable framework
  used to design the skill file types (Type 1 Context, Type 3
  Frontend, Type 4 Data, Type 6 Domain). Reference this when adding
  a new skill file.

---

## Extraction test

Before trusting any skill file, answer these five questions from the
skill file alone (no source code). If you can answer all five, the
file is ready. If not, the file needs more content.

1. Where does new frontend code go inside `index.html`?
2. What does a Leaflet divIcon pattern look like in this project?
3. Where do `dbPut()` writes go when IndexedDB is unavailable?
4. What is the Kalshi pricing invariant?
5. What is forbidden? (Any three rules from any of the four files.)

The existing skill files all pass this test as of the last-updated
date at the top.

---

## One sentence

**Pinch a ship. Move it off course. Watch the world reprice.**
