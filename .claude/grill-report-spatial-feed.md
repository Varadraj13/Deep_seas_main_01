# Grill Report — Spatial Feed Visual Changes
Date: 2026-07-01

## Resolved Decisions

### Q1: What does "increase size by 2X" refer to?

**Options:** (a) Add a dot/node at each latitude midpoint sized up 2X, (b) Make the label text 2X bigger (11px → 22px), (c) Both dot and text
**Decision:** Option (b) — label text only, no new circle
**Rationale:** User confirmed the annotation was about text readability, not adding a new visual element.
**Consequence:** `LatitudeField.draw()` gets `textSize(22)` instead of `textSize(11)`. No new geometry added.

---

### Q2: How should "connect all the latitude values with dotted lines" be implemented?

**Options:** (a) All-to-all (190 lines at 20 nodes), (b) Sequential chain/polygon, (c) Nearest-neighbor — each midpoint connects to its closest neighbor
**Decision:** Option (c) — nearest-neighbor
**Rationale:** With 20 latitude fields, nearest-neighbor produces ~20 readable lines vs. 190 chaotic all-to-all lines.
**Consequence:** Each frame, for every LatitudeField midpoint find the one other midpoint closest to it and draw a dotted line between them. Drawn in `sketch.js` draw loop using existing red dashed style.

---

### Q3: Does "reduce speed by half" also scale wander/flock forces?

**Options:** (a) Halve speed limits only (minSpeed 0.3→0.15, maxSpeed 1.3→0.65), (b) Halve everything including wander/flock forces, (c) Halve speed limits + wander force only
**Decision:** Option (a) — speed limits only
**Rationale:** Simpler change; slower speed cap already produces the desired sluggish feel without touching force math.
**Consequence:** `SpatialObject` constructor: `minSpeed=0.15`, `maxSpeed=0.65`. No changes to `wander()` or `flock()`.

---

### Q4: Should "3X size" be a true 3X of the current range?

**Options:** (a) True 3X — 180–390px, intentional heavy overlap, (b) 3X of base only — flat 180px, (c) ~2X in practice — 120–200px
**Decision:** Option (a) — true 3X (180–390px)
**Rationale:** User confirmed 3X explicitly and accepted the overlap as intentional.
**Consequence:** `SpatialObject` constructor: `p.map(engagementValue, 0, 25, 180, 390, true)`. Objects will visually dominate the canvas.

---

### Q5: Should latitude lines become more subtle at 20 count?

**Options:** (a) Keep same visual weight (base alpha 70, same stroke), (b) Dim at rest (base alpha 40), (c) No change needed
**Decision:** Option (a) — same visual weight
**Rationale:** User wants the same impact even with more lines.
**Consequence:** `LatitudeField.draw()` unchanged for alpha/stroke. 20 lines will be visually dense at full weight.

---

## Implementation Plan

### Step 1 — Increase latitude label text size (`latitude-field.js`)
- **Action:** Change `p.textSize(11)` → `p.textSize(22)` in `LatitudeField.draw()`
- **Visible change:** All latitude value labels render at 2X size
- **If skipped:** Labels remain tiny and hard to read

### Step 2 — Increase latitude field count (`sketch.js`)
- **Action:** Change `buildLatitudeFields(p, 7)` → `buildLatitudeFields(p, 20)`
- **Visible change:** 13 additional dashed red lines appear across the canvas
- **If skipped:** Only 7 lines exist, nearest-neighbor web has no impact

### Step 3 — Draw nearest-neighbor connections between latitude midpoints (`sketch.js` or `latitude-field.js`)
- **Action:** In `sketch.js` draw loop, after drawing all latitude fields, compute each field's midpoint, find its nearest neighbor midpoint, draw a dashed line between them (same red dashed style, fixed alpha ~100)
- **Visible change:** A sparse web of dotted lines connects the label positions
- **If skipped:** Latitude fields remain visually isolated from each other

### Step 4 — Halve object speed limits (`spatial-object.js`)
- **Action:** `minSpeed=0.3` → `minSpeed=0.15`, `maxSpeed=1.3` → `maxSpeed=0.65`
- **Visible change:** All objects move noticeably slower
- **If skipped:** Objects move at original speed, defeating the intent

### Step 5 — Triple object image size (`spatial-object.js`)
- **Action:** Change `p.map(engagementValue, 0, 25, 60, 130, true)` → `p.map(engagementValue, 0, 25, 180, 390, true)`
- **Visible change:** All furniture/object images render at 3X size, filling large portions of canvas
- **If skipped:** Objects remain small, annotation intent unmet
