# Skills Creation Framework
## A Universal Guide for Any Project

This document is a plug-in framework. Drop it into any project,
answer the diagnostic questions in each section, and it will tell
you exactly what skill files to create, what to put in them, and
how to structure them for maximum effectiveness.

---

## What a skill file actually is

A skill file is a constraint document. It tells an AI agent:
- What patterns already exist in this codebase
- What conventions must be followed
- What is explicitly forbidden
- What the project is and where each piece lives

It is NOT:
- A tutorial
- A wish list of how you want the code to look
- A generic style guide
- Something you invent from scratch

Every skill file must be extracted from real, existing code or
real, existing decisions. A skill file about conventions that don't
exist yet doesn't work — the agent has nothing to anchor to.

---

## The universal skill file types

Every project needs some combination of these six skill file types.
The diagnostic questions in each section tell you whether you need
that type and what to put in it.

```
Type 1 — Project Context       (always needed)
Type 2 — Backend Patterns      (needed if project has a backend)
Type 3 — Frontend Patterns     (needed if project has a frontend)
Type 4 — Data Patterns         (needed if project stores/processes data)
Type 5 — ML/AI Patterns        (needed if project uses models or AI APIs)
Type 6 — Domain Patterns       (needed if project has domain-specific logic)
```

---

---

# TYPE 1 — Project Context Skill File
## Always required. One per project.

This is the file every agent reads regardless of its role.
It answers: "what is this project, what exists, what are we building next?"

---

## Diagnostic questions

Answer these before writing the file:

**1. What does this project do in one sentence?**
Not the vision — the mechanism. What does it actually do right now?
```
Answer: ________________________________
```

**2. What is the project root path?**
```
Answer: ________________________________
```

**3. What are the main folders and what lives in each?**
List every folder that contains code, config, or output.
```
Answer:
folder/ → ________________________________
folder/ → ________________________________
folder/ → ________________________________
```

**4. What is the primary frontend file?**
(The one that actually runs, not scaffolding)
```
Answer: ________________________________
```

**5. What is fully built and working right now?**
List every feature, endpoint, or module that is complete and verified.
```
Answer: ________________________________
```

**6. What is currently being built?**
The active phase or feature.
```
Answer: ________________________________
```

**7. What comes after that?**
The next phase or feature in the queue.
```
Answer: ________________________________
```

**8. What is the data chain?**
The sequence of files/outputs where each one feeds the next.
```
Answer: fileA → fileB → fileC → ...
```

**9. What models or AI APIs are in use?**
Which model, where it's called, what it returns.
```
Answer: ________________________________
```

**10. What are the critical architectural rules?**
The decisions that, if violated, break everything.
Example: "all output files go in outputs/, never anywhere else"
```
Answer:
Rule 1: ________________________________
Rule 2: ________________________________
Rule 3: ________________________________
```

---

## Project context skill file template

```markdown
# SKILL: [Project Name] — Project Context
# Read this file at the start of every session before writing any code.

## What this project is
[One paragraph. Mechanism, not vision.]

## Project root
[Absolute path]

## Folder structure
[Tree showing every relevant folder and what lives in it]

## Key architectural rules
[Numbered list of rules that must never be violated]

## What's already built (do not rebuild or modify unless asked)
[Feature by feature list of completed work]

## What's being built next
[Current phase with files to create and endpoints to add]

## The data chain
[fileA → fileB → fileC with one line explaining each link]

## Models and AI APIs in use
[Table: feature | model | location | what it returns]

## How to run the project
[Exact commands to start the server, install dependencies, etc.]
```

---

---

# TYPE 2 — Backend Patterns Skill File
## Required if: project has a server, API, or backend logic

This file tells the backend agent exactly how to write endpoints,
handle errors, structure files, and follow the project's conventions.

---

## Diagnostic questions

**1. What web framework are you using?**
```
FastAPI / Express / Django / Flask / Rails / other: ________
```

**2. How are endpoints structured in your existing code?**
Open your main server file. Find 3 different endpoint types:
- A simple GET that returns JSON
- A POST that accepts a request body
- A POST that accepts a file upload

Copy these exactly. They become your pattern examples.
```
GET example: ________________________________
POST JSON example: ________________________________
POST file example: ________________________________
```

**3. How are errors handled?**
What HTTP codes do you use? What format is the error response?
```
Answer: ________________________________
```

**4. How are file paths constructed?**
Hardcoded? Relative? Using a project root variable?
```
Answer: ________________________________
```

**5. Where do all output files go?**
Is there a single outputs directory? Subfolders per feature?
```
Answer: ________________________________
```

**6. How are imports organized?**
What order? What groupings? What naming conventions?
```
Answer: ________________________________
```

**7. What is explicitly NOT allowed?**
Things that would break the project if an agent did them.
```
Answer:
- Never: ________________________________
- Never: ________________________________
- Never: ________________________________
```

**8. What are the non-obvious conventions?**
Things that look arbitrary but have a specific reason.
Example: "GET / must always be last because it serves the frontend"
```
Answer: ________________________________
```

**9. What security validations are required?**
File upload sanitization? Input validation? Rate limiting?
```
Answer: ________________________________
```

**10. Are there any streaming patterns?**
SSE, WebSockets, long polling? If so, what does the pattern look like?
```
Answer: ________________________________
```

---

## Backend patterns skill file template

```markdown
# SKILL: [Framework] Patterns — [Project Name]
# Read this file before writing any endpoint or backend module.
# All patterns extracted from [main server file].

## File header pattern
[How new modules should be structured at the top]

## Path construction pattern
[How file paths are built — never hardcode, always use X]

## Endpoint patterns

### Simple GET returning JSON
[Real code example from your project]

### POST with request body
[Real code example from your project]

### POST with file upload
[Real code example from your project]

### Streaming endpoint (if applicable)
[Real code example from your project]

## Import organization
[Order, groupings, naming conventions]

## Error handling pattern
[The three levels: 400, 404, 500 — with real examples]

## File read/write pattern
[How JSON files are read and written]

## Security validation pattern
[Filename sanitization, input validation, etc.]

## Directory constants pattern
[Where constants are defined, how they're named]

## Grouping and organization conventions
[How endpoints are grouped, comment separator style, etc.]

## What NOT to do
[Explicit list of forbidden patterns with reasons]
```

---

---

# TYPE 3 — Frontend Patterns Skill File
## Required if: project has a browser-based UI

This file tells the frontend agent exactly how to add UI sections,
handle state, make API calls, and follow the visual conventions.

---

## Diagnostic questions

**1. What frontend technology are you using?**
```
Vanilla HTML/JS / React / Vue / Svelte / other: ________
```

**2. What is the visual identity?**
Open your main frontend file. Extract:
- Background color
- Primary text color
- Accent colors (highlight, warning, error)
- Font family
- Max content width
```
Answer:
background: ________
text: ________
accent: ________
font: ________
max-width: ________
```

**3. How are sections/panels structured?**
Is there a tab system? Accordion? Page routing?
Copy one complete section as the pattern example.
```
Answer: ________________________________
```

**4. How are API calls made?**
fetch? axios? What's the error handling pattern?
Copy one complete API call as the pattern example.
```
Answer: ________________________________
```

**5. How is state managed?**
Module-level variables? A state object? React state?
What naming conventions exist?
```
Answer: ________________________________
```

**6. How are dynamic elements created?**
innerHTML with escaping? createElement? JSX?
```
Answer: ________________________________
```

**7. What CSS patterns exist?**
Where does new CSS go? Class naming convention?
Copy the pattern for a card, a button, a status log.
```
Answer: ________________________________
```

**8. What external libraries are available?**
What CDN scripts are loaded? What npm packages?
```
Answer: ________________________________
```

**9. What is forbidden?**
No external libraries? No frameworks? No inline styles?
```
Answer: ________________________________
```

**10. Where does new code go?**
Where in the file do new CSS rules go?
Where do new HTML sections go?
Where do new JS functions go?
```
Answer: ________________________________
```

---

## Frontend patterns skill file template

```markdown
# SKILL: Frontend Patterns — [Project Name]
# Read this file before touching [main frontend file].
# All patterns extracted from real code.

## Visual identity
[Colors, fonts, max-width — exact hex values]

## Section structure pattern
[How a new feature section is added — real HTML example]

## Button pattern
[Real HTML + CSS example]

## Status log pattern
[Real HTML + JS log function example]

## API call patterns

### GET request
[Real fetch example with error handling]

### POST with JSON body
[Real fetch example]

### POST with file upload
[Real fetch example]

### SSE / streaming (if applicable)
[Real EventSource example]

## State variable pattern
[How module-level state is named and organized]

## Dynamic element creation
[How elements are built in JS — createElement vs innerHTML]

## CSS addition pattern
[Where new CSS goes, class naming convention]

## Page load auto-fetch pattern
[How existing data is loaded on startup]

## Security pattern
[escHtml or equivalent — when and how to use it]

## What NOT to do
[Explicit forbidden patterns with reasons]
```

---

---

# TYPE 4 — Data Patterns Skill File
## Required if: project reads/writes files, databases, or persistent state

This file tells agents how data is structured, stored, and accessed.

---

## Diagnostic questions

**1. What data does the project store?**
List every file, database table, or data structure that persists.
```
Answer: ________________________________
```

**2. What is the schema for each data store?**
The exact structure — field names, types, allowed values.
```
Answer: ________________________________
```

**3. How is data read and written?**
JSON files? SQL queries? ORM? Key-value store?
```
Answer: ________________________________
```

**4. What are the integrity requirements?**
Which files must never be corrupted? Which writes must be atomic?
```
Answer: ________________________________
```

**5. What is the data chain?**
How does data flow from input to output?
Which file is produced by which step?
Which file is consumed by which step?
```
Answer: fileA → fileB → fileC
```

**6. What validation is required?**
What makes a record valid? What gets rejected?
```
Answer: ________________________________
```

**7. What are the failure modes?**
What happens if a write fails? If a file is missing?
What is the recovery procedure?
```
Answer: ________________________________
```

---

## Data patterns skill file template

```markdown
# SKILL: Data Patterns — [Project Name]

## Data stores
[List every file/table with its purpose]

## Schema definitions
[Exact structure of each data store with field names and types]

## Read pattern
[How each data store is read — real code example]

## Write pattern
[How each data store is written — real code example]

## Atomic write pattern (for critical files)
[The temp file + rename pattern — real code example]

## Validation pattern
[What gets validated, how, what error is returned]

## The data chain
[Diagram showing how data flows through the system]

## Failure handling
[What to do when each failure mode occurs]
```

---

---

# TYPE 5 — ML/AI Patterns Skill File
## Required if: project uses machine learning models or AI APIs

This file tells agents how models are loaded, called, and cached.

---

## Diagnostic questions

**1. What models or AI APIs does the project use?**
```
Answer: ________________________________
```

**2. How is each model loaded?**
On startup? On first call? Cached after first load?
```
Answer: ________________________________
```

**3. What is the input format for each model?**
Image size? Token format? Batch size?
```
Answer: ________________________________
```

**4. What is the output format for each model?**
What does it return? What shape? What type?
```
Answer: ________________________________
```

**5. How are API calls structured?**
What goes in the system prompt? The user message?
How are images sent? How is the response parsed?
```
Answer: ________________________________
```

**6. What are the cost/latency tradeoffs?**
Which model is used for what? Why that model and not another?
```
Answer: ________________________________
```

**7. How is model output validated?**
What happens if the model returns unexpected format?
```
Answer: ________________________________
```

**8. What caching exists?**
Module-level variables? Redis? File cache?
```
Answer: ________________________________
```

---

## ML/AI patterns skill file template

```markdown
# SKILL: ML/AI Patterns — [Project Name]

## Models in use
[Table: model name | purpose | location | input | output]

## Model loading pattern
[How each model is loaded and cached — real code example]

## Inference pattern
[How a single prediction is made — real code example]

## API call pattern
[How the AI API is called — real code example with prompt structure]

## Output parsing pattern
[How model output is parsed and validated — real code example]

## Error handling for model failures
[What to do when the model returns invalid output]

## Cost/latency decisions
[Which model is used where and why]

## Caching pattern
[How models are kept in memory across calls]
```

---

---

# TYPE 6 — Domain Patterns Skill File
## Required if: project has domain-specific logic, terminology, or rules

This file captures the knowledge that isn't in the code — the domain
concepts that determine whether the code is correct.

---

## Diagnostic questions

**1. What domain does this project operate in?**
Photography, architecture, finance, medicine, etc.
```
Answer: ________________________________
```

**2. What domain-specific terms appear in the code?**
List every variable name, function name, or concept that requires
domain knowledge to understand.
```
Answer: ________________________________
```

**3. What are the domain rules that code must follow?**
Rules that aren't obvious from the code itself but would make it
wrong if violated.
Example: "unintentional = 1, intentional = 0 in label encoding
because unintentional is what we want to detect"
```
Answer: ________________________________
```

**4. What would a technically correct but domain-wrong solution look like?**
Things an agent might build that work technically but are wrong
for the domain.
```
Answer: ________________________________
```

**5. What is the evaluation criterion for correctness?**
How do you know if the output is right? Not technically right —
domain right.
```
Answer: ________________________________
```

---

## Domain patterns skill file template

```markdown
# SKILL: Domain Patterns — [Project Name]

## Domain overview
[What field this project operates in, one paragraph]

## Key terminology
[Every domain term that appears in code, with definition]

## Domain rules
[Rules that determine correctness beyond technical correctness]

## Label encoding and conventions
[How domain concepts map to code — especially numbers and booleans]

## Evaluation criteria
[How to know if the output is domain-correct, not just technically correct]

## Common domain mistakes
[Things that would be technically correct but domain wrong]
```

---

---

# The skill file creation workflow

## Step 1 — Audit your project

Before creating any skill files, open your codebase and spend 20 minutes
reading. Look for:
- Patterns that repeat more than twice
- Conventions that aren't obvious
- Files that every feature touches
- Rules that if broken would cascade into failures

Write these down. They become the content of your skill files.

## Step 2 — Determine which types you need

Answer this for each type:

| Type | Need it if... |
|---|---|
| Project Context | Always |
| Backend Patterns | Project has a server or API |
| Frontend Patterns | Project has a browser UI |
| Data Patterns | Project reads/writes persistent data |
| ML/AI Patterns | Project uses models or AI APIs |
| Domain Patterns | Project has non-obvious domain logic |

## Step 3 — Answer the diagnostic questions

For each skill file type you need, answer every diagnostic question
in that section. Don't skip questions — the ones that feel obvious
are often the most important to document.

## Step 4 — Fill the templates

Use your diagnostic answers to fill each template. Replace every
placeholder with real content from your project. Never leave a
placeholder unfilled — if you can't fill it, the skill file isn't
ready yet.

## Step 5 — The extraction test

Before using a skill file, run this test:
Read the skill file as if you've never seen the project before.
Can you answer these questions from the skill file alone?

- [ ] Where does new backend code go?
- [ ] What does an endpoint look like?
- [ ] Where do output files go?
- [ ] What is forbidden?
- [ ] What files exist and what do they do?

If you can't answer all five, the skill file is incomplete.

## Step 6 — Update skill files when the codebase changes

A skill file that describes old conventions is worse than no skill file —
it actively misleads agents. Update skill files when:
- A new pattern is established
- A convention changes
- A new file or module is added
- A new model or API is integrated

Add a "last updated" line at the top of each skill file.

---

## The skill file quality checklist

Before using any skill file in a build:

- [ ] Extracted from real code, not invented
- [ ] Every pattern has a real code example, not pseudocode
- [ ] "What NOT to do" section present
- [ ] Non-obvious conventions explained with reasoning
- [ ] Under 3,000 tokens (fits cleanly in context)
- [ ] Passes the extraction test (5 questions above)
- [ ] Last updated date present

---

## Token budget per skill file

Keep skill files lean. A skill file that's too long costs as many
tokens as reading the source file directly — defeating the purpose.

| Skill file type | Target token count |
|---|---|
| Project Context | 800 – 1,200 tokens |
| Backend Patterns | 1,500 – 2,500 tokens |
| Frontend Patterns | 1,500 – 2,500 tokens |
| Data Patterns | 500 – 1,000 tokens |
| ML/AI Patterns | 500 – 1,000 tokens |
| Domain Patterns | 300 – 700 tokens |
| **Total across all files** | **< 8,000 tokens** |

If a skill file exceeds its budget: cut examples to the most important
one per pattern, move edge cases to comments in the code itself, and
remove anything that can be inferred from the code directly.

---

## One sentence summary

**Audit your real code → identify what repeats and what's non-obvious →
answer the diagnostic questions → fill the templates with real examples →
test with the extraction checklist → keep them under token budget →
update them when the codebase changes.**
