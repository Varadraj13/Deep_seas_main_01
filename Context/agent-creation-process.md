# Agent Creation & Deployment Process
## A Reusable Framework for AI-Assisted Development

This document captures the exact process used to create and deploy
specialized Claude Code agents for the Subconscious Lens project.
The goal: reduce token consumption, maintain context discipline, and
keep each agent focused on one concern.

---

## Why agents instead of one session

A single Claude Code session that handles everything — backend, frontend,
debugging, reviewing — accumulates context fast. By the time you're on
unit 15, the session has read every file, seen every error, and is
making decisions influenced by everything that came before. This causes:

- **Context drift** — decisions in unit 15 contradict unit 3 because
  too much has happened in between
- **Token bloat** — every operation pays the cost of the entire conversation
  history
- **Cross-contamination** — frontend patterns bleed into backend code
  because both live in the same context
- **Compounding errors** — a misunderstanding from early in the session
  quietly influences everything after it

Specialized agents solve all four problems by keeping contexts narrow,
clean, and purpose-built.

---

## The three-layer architecture

Every project needs three types of agents:

```
┌─────────────────────────────────────────┐
│              YOU                        │
│         Orchestrator                    │
│  The human who coordinates, verifies,   │
│  and decides what gets built next       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ↓                ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Execution  │  │  Execution  │  │   Review    │
│  Agent A    │  │  Agent B    │  │   Agent     │
│  (Backend)  │  │  (Frontend) │  │  (QA)       │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Execution agents** build things. Each one owns a specific domain.
**Review agent** checks things. Read-only. Never writes code.
**You** coordinate. You are always the orchestrator.

---

## Step 1 — Identify the domains in your project

Before creating agents, list every distinct concern in your codebase.
A concern is a group of files and decisions that belong together.

**How to identify a domain:**
Ask — "if I got this wrong, which files would break?"
If the answer is always the same set of files, that's a domain.

**Examples from the Subconscious Lens:**

| Domain | Files owned | Never touches |
|---|---|---|
| Backend | `app.py`, `backend/pipeline/*.py` | `index.html`, `frontend/` |
| Frontend | `index.html` | `app.py`, `backend/` |
| ML Pipeline | `embedder.py`, `trainer.py` | `index.html`, `app.py` endpoints |

**Rule:** if two concerns share no files, they can be separate agents.
If they share files, they should either be the same agent or have a
strict protocol for which agent owns which part of the shared file.

---

## Step 2 — Extract skill files from real code

This is the most important step and the one most people skip.
A skill file is not a description of what you want — it's a codification
of what already exists, extracted from your actual codebase.

**The extraction process:**

1. Open the most important file in each domain
2. Identify every pattern that repeats — how endpoints are structured,
   how errors are handled, how files are read and written, how UI
   sections are built
3. Document each pattern with the actual code, not pseudocode
4. Add a "what NOT to do" section — this is as important as the patterns
   themselves

**The three skill files created for this project:**

```
skills/
├── subconscious-lens-context.md    ← project map (shared by all agents)
├── fastapi-patterns.md             ← extracted from app.py
└── index-html-patterns.md         ← extracted from index.html
```

**What each skill file must contain:**

```
1. Visual/structural identity
   (colors, fonts, naming conventions, file organization)

2. Every repeating pattern with real code examples
   (not pseudocode — actual code from the project)

3. The "what NOT to do" section
   (anti-patterns specific to this codebase)

4. Conventions that aren't obvious
   (why async def is only for uploads, why GET / must be last,
   why atomic writes are required for labels.json)
```

**Token math — why skill files save tokens:**

```
Reading full app.py (200+ lines):     ~3,000 tokens per session
Reading fastapi-patterns.md:          ~2,000 tokens once
Sessions saved across 15 backend units: 15 × 3,000 = 45,000 tokens
Cost of skill file across 15 units:   2,000 tokens
Net saving:                           ~43,000 tokens
```

Multiply across all skill files and all units — the saving is significant.

---

## Step 3 — Write the start prompt for each agent

The start prompt is what you paste at the beginning of every session
for that agent. It does three things:
1. Loads the skill files
2. Defines the agent's role and constraints
3. Establishes the session discipline

**The start prompt template:**

```
Read [skill file 1] and [skill file 2].
These are binding constraints — follow them exactly.

You are the [ROLE] AGENT. Your rules:
- You only touch [specific files/folders]
- You never touch [out of scope files]
- You show me each file/section before writing it
- You wait for my confirmation before moving to the next unit
- When unsure about a pattern, re-read [relevant skill file]
- Build exactly one unit at a time. Stop and wait for
  "verified, continue" before starting the next.

Before we start, confirm you have read both skill files and
list the 3 most important constraints from [skill file].
```

**Why ask it to list constraints:**
This forces Claude Code to actually internalize the skill files rather
than just acknowledging them. If it lists the wrong constraints, you
know it didn't read them properly and you can correct before any code
is written.

---

## Step 4 — Define what each agent owns

Write an explicit ownership table before starting the build.
This prevents the most common agent coordination problem —
two agents both touching the same file and producing conflicts.

**Ownership table format:**

```
| Agent    | Owns                          | Never touches              |
|----------|-------------------------------|----------------------------|
| Backend  | app.py, pipeline/*.py         | index.html, frontend/      |
| Frontend | index.html                    | app.py, pipeline/          |
| Reviewer | Nothing (read-only)           | Everything (read only)     |
```

**The shared file problem:**
Sometimes two agents need to touch the same file. In the Subconscious
Lens, both backend and frontend agents eventually touch `app.py` and
`index.html` in different ways.

Resolution: **one file, one agent, one session at a time.**
The backend agent finishes its changes to `app.py`. You verify.
Then the frontend agent reads the updated `app.py` before touching
`index.html`. Never have two agents working on the same file
simultaneously.

---

## Step 5 — Create the reviewer agent

The reviewer agent is the most underused and most valuable agent.
It never writes code. It only reads and evaluates.

**Reviewer start prompt:**
```
Read [all skill files for the project].

You are the REVIEWER AGENT. Your rules:
- You do not write any code under any circumstances
- You only read and review code I show you
- For each review, check:
  1. Does it follow [skill file A] conventions? List any violations.
  2. Does it follow [skill file B] conventions? List any violations.
  3. Are there security issues? (injections, path traversal, missing validation)
  4. Are there bugs that would break the verify step?
  5. Does it correctly connect to the previous unit's output?
- Return a clear PASS or FAIL with specific line references
- If FAIL, explain exactly what needs to change

Confirm you have read all skill files before we start.
```

**When to use the reviewer:**
- Any unit that writes to a critical data file
- Any unit that handles file uploads (security)
- Any unit that implements a complex algorithm
- Any unit longer than ~50 lines
- Any unit where you're not sure if it's right but the verify step passed

**How to use it:**
```
Review this code from unit [1A-3]. PASS or FAIL?
[paste code]
```

The reviewer catches things the execution agent misses because it has
fresh context and no investment in the code being correct.

---

## Step 6 — Set up the physical workspace

Three terminals. One per execution agent plus one for the reviewer.
Label them clearly so you never paste a backend prompt into a frontend session.

**Terminal setup:**

```
Terminal 1 — Backend Agent
  Label: "BACKEND"
  Skill files: context.md + fastapi-patterns.md + phase docs (backend units)
  Handles: all pipeline files, all app.py endpoints

Terminal 2 — Frontend Agent
  Label: "FRONTEND"
  Skill files: context.md + index-html-patterns.md + phase docs (frontend units)
  Handles: index.html only

Terminal 3 — Reviewer Agent
  Label: "REVIEWER"
  Skill files: all skill files
  Handles: nothing (read-only)
```

**VS Code tip:**
Use the terminal split view — three panes visible simultaneously.
You can see the backend agent working in pane 1, paste its output
into the reviewer in pane 3, and have the frontend agent ready in pane 2.

---

## Step 7 — The coordination workflow

This is the exact sequence for every unit:

```
1. Check the agent mapping table → which agent handles this unit?

2. Open that agent's terminal

3. If new session: paste the start prompt, wait for confirmation

4. Say: "Build unit [ID] as specified in the phase document."

5. Agent explains its plan → READ IT before saying yes
   If the plan looks wrong: correct it before code is written
   If the plan looks right: say "go ahead"

6. Agent writes the code → READ IT before accepting

7. Optional: paste code into reviewer terminal → wait for PASS/FAIL
   If FAIL: tell execution agent what the reviewer found, ask it to fix

8. Run the verify step from the phase document

9. If verify passes: say "verified, continue to [next unit]"
   If verify fails: debug with the execution agent using
   "where to look when debugging" section of the phase doc

10. Repeat from step 4
```

**The single most important discipline:**
Never say "continue" until the verify step passes.
This is the gate that keeps the foundation honest.

---

## Step 8 — Context window management

Even with specialized agents, context accumulates. Manage it actively.

**Monitor with `/context` regularly:**
```
/context
```
Shows: total tokens used, breakdown by category, free space remaining.

**Key numbers to watch:**
- Messages tokens > 80k → run `/compact` before continuing
- Total tokens > 150k → consider starting a fresh session
- "Now using extra usage" warning → run `/compact` immediately

**The `/compact` command:**
```
/compact
```
Summarizes conversation history into a compressed buffer. Frees up
significant context window space. Run it between subphases — after
1A is done, before starting 1B.

**After `/compact`, always re-confirm skill files:**
```
Confirm you still have the constraints from [skill file] active.
List the top 3 rules before we continue.
```
Compaction sometimes softens the skill file constraints. Re-confirming
re-anchors the agent before the next subphase.

**Never paste large files into chat:**
Instead of pasting `app.py` into the conversation, tell the agent:
```
Read backend/app.py directly from disk.
```
Claude Code has filesystem access. Reading from disk costs tool call
tokens, not message tokens. Message tokens are what compounds across
the conversation. Tool call tokens are much cheaper.

---

## Step 9 — When to use one session vs. multiple agents

Not every project needs three terminals. Use the multi-agent setup when:

| Situation | Use |
|---|---|
| Project has 2+ distinct file domains | Multi-agent |
| Build will span multiple sessions | Multi-agent |
| You've had bugs from context drift | Multi-agent |
| Any unit touches security-sensitive code | Reviewer |
| Single-file project | Single session |
| Quick fix or small edit | Single session |
| Exploratory/prototyping work | Single session |

**Rule of thumb:** if the project has more than 10 units, use agents.
If it has more than one file domain, use separate agents per domain.

---

## The skill file creation checklist

Before starting any build, verify each skill file has:

- [ ] Extracted from real code, not invented
- [ ] Every repeating pattern documented with actual code examples
- [ ] "What NOT to do" section present
- [ ] Non-obvious conventions explained with reasoning
- [ ] Short enough to load in one context (under 3,000 tokens ideally)
- [ ] Versioned — if the codebase changes significantly, update the skill file

---

## The agent session checklist

At the start of every agent session:

- [ ] Correct terminal open (backend/frontend/reviewer)
- [ ] Start prompt pasted and agent confirmed skill files
- [ ] Agent listed key constraints correctly
- [ ] Phase document loaded (agent knows which units it's handling)
- [ ] "One unit at a time, wait for verified, continue" rule stated

---

## Token savings summary

| Practice | Tokens saved per unit | Over 24 units |
|---|---|---|
| Skill files vs. reading full files | ~2,000/unit | ~48,000 |
| Narrow agent context | ~3,000/unit | ~72,000 |
| No file pasting | ~1,500/unit | ~36,000 |
| `/compact` between subphases | ~10,000/subphase | ~30,000 |
| **Total estimated saving** | | **~186,000 tokens** |

---

## One sentence summary

**Extract your real patterns into skill files → give each agent
one domain and one set of skill files → verify every unit before
proceeding → compact between subphases → never paste files, read from disk.**

That's the entire system.

---

## Replication checklist for a new project

- [ ] Step 1: Identify domains (what files belong together?)
- [ ] Step 2: Extract skill files from real code (one per domain + one context file)
- [ ] Step 3: Write start prompts for each agent
- [ ] Step 4: Define ownership table (who touches what)
- [ ] Step 5: Set up reviewer agent
- [ ] Step 6: Open three terminals, label them
- [ ] Step 7: Follow the 10-step coordination workflow per unit
- [ ] Step 8: Monitor context with `/context`, compact between subphases
- [ ] Step 9: Re-confirm skill files after every `/compact`
