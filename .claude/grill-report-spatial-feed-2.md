# Grill Report — Spatial Feed Round 2
Date: 2026-07-01

## Resolved Decisions

### Q1: Which "lines" does "skip the interaction" refer to?

**Options:** (a) LatitudeField edge-to-edge dashed lines — crossing detection triggers pulse + flash, (b) Nearest-neighbor midpoint web — no interaction code exists
**Decision:** Option (a) — remove LatitudeField crossing detection entirely
**Rationale:** Only the LatitudeField lines have active interaction code; the midpoint web has none.
**Consequence:** Remove the `field.intersects / onFieldCross / illuminate` block in `sketch.js`. `illumination` in LatitudeField will always stay 0, making alpha effectively constant without further changes.

---

### Q2: Scope of "no fades — same colour"?

**Options:** (a) LatitudeField lines/labels only, (b) Everything — LatitudeField + ConnectionManager proximity lines, (c) LatitudeField + nearest-neighbor web only
**Decision:** Option (b) — all lines hold constant colour
**Rationale:** "All the dotted lines" implies every red line on canvas; consistent colour is the intent.
**Consequence:** ConnectionManager `draw()` uses fixed alpha (100) instead of age-based fade. LatitudeField alpha is already constant once crossing detection is removed (illumination=0 always).

---

### Q3: How to spread latitude fields evenly?

**Options:** (a) Evenly spaced perimeter slots, (b) Grid-jittered midpoints, (c) Minimum distance rejection sampling on midpoints
**Decision:** Option (c) — rejection sampling
**Rationale:** Simpler to implement than grid-jitter, still random-feeling, guarantees no clustering.
**Consequence:** `buildLatitudeFields` in `sketch.js` adds a retry loop: if a new field's midpoint is within `minDist` of any existing midpoint, regenerate it. `minDist = CANVAS_SIZE / 5` (~216px for 1080px canvas).

---

### Q4/Q5: Object movement — clustering vs. independent wandering?

**Options:** (a) Remove cohesion, keep separation, (b) Reduce cohesion multiplier, (c) Remove flock entirely
**Decision:** Option (a) — remove cohesion, keep separation
**Rationale:** Separation keeps objects from piling up; removing cohesion means nothing pulls them together, so each wanders independently.
**Consequence:** In `SpatialObject.flock()`, delete the cohesion vector and its `acc.add` call. Separation logic unchanged.

---

### Q6: How far should objects roam?

**Options:** (a) Shrink margin to 3% — soft boundary, ~94% canvas use, (b) Wrap at edges, (c) No containment at all
**Decision:** Option (a) — 3% margin
**Rationale:** Keeps all large (3X) objects always visible while dramatically expanding territory vs. the current 15% margin.
**Consequence:** `containWithinBounds` margin changes from `canvasSize * 0.15` → `canvasSize * 0.03`. Object spawn zone also expands to 3%–97% to match.

---

## Implementation Plan

### Step 1 — Remove crossing detection (`sketch.js`)
- **Action:** Delete the `for (const field of latitudeFields)` block that calls `field.intersects`, `obj.onFieldCross()`, `field.illuminate()`
- **Visible change:** Objects no longer flash red when crossing latitude lines; lines no longer brighten
- **If skipped:** Lines still illuminate and objects still pulse, contradicting the "no interaction" request

### Step 2 — Fix ConnectionManager alpha to constant (`connection-manager.js`)
- **Action:** Replace `p.map(age, 0, this.lifespanMs, 160, 0, true)` with a fixed `alpha = 100`
- **Visible change:** Proximity lines between nearby objects stay visible indefinitely at constant alpha instead of fading out
- **If skipped:** Object proximity lines still fade, violating "no fades"

### Step 3 — Minimum-distance latitude field placement (`sketch.js`)
- **Action:** In `buildLatitudeFields`, after computing each new field's midpoint, reject and retry if it falls within `CANVAS_SIZE / 5` of any existing midpoint
- **Visible change:** 20 latitude lines are visibly spread across the whole canvas with no obvious clusters
- **If skipped:** Fields can still cluster in corners/regions

### Step 4 — Remove cohesion from flock (`spatial-object.js`)
- **Action:** Delete cohesion vector, count variable, and `this.acc.add(cohesion)` from `SpatialObject.flock()`
- **Visible change:** Objects stop drifting toward each other; each explores its own path
- **If skipped:** Objects still cluster, defeating the "independent creature" intent

### Step 5 — Expand canvas coverage (`spatial-object.js`)
- **Action:** (a) Change spawn zone from `canvasSize * 0.15 / 0.85` → `canvasSize * 0.03 / 0.97`. (b) Change `containWithinBounds` margin from `canvasSize * 0.15` → `canvasSize * 0.03`
- **Visible change:** Objects spawn across nearly the full canvas and roam freely to edges
- **If skipped:** Objects remain confined to the 70% central zone, coverage feels cramped
