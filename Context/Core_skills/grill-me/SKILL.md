---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Documentation requirement

When the grill session is complete (or when the user decides to stop and move to implementation), **always produce a written grill report** and append it to the relevant PRD or planning document. This is not optional -- it is the default output of every grill session.

The report must include:

1. **Every question asked**, numbered sequentially
2. **Options considered** for each question (labeled a/b/c)
3. **The decision made** and which option was chosen
4. **Rationale** -- why this option over the others, in one sentence
5. **Consequences** -- what this decision enables or constrains downstream

Format each entry as:

```
### Q[N]: [Question title]

**Options:** (a) ..., (b) ..., (c) ...
**Decision:** Option [X] -- [one-line summary]
**Rationale:** [Why this over the others]
**Consequence:** [What this enables or constrains]
```

If the grill was scoped to a specific phase or feature, also produce an **implementation plan** that translates the resolved decisions into ordered steps. Each step must include:
- What action is taken (file created, file modified, function added)
- What the user sees on screen after that step (visible change, or "None -- data layer only")
- What breaks if this step is skipped

The report serves as the contract between the design interrogation and the implementation. A developer who reads only the grill report should be able to implement the feature without re-asking any of the resolved questions.
