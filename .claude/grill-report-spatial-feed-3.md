# Grill Report — Spatial Feed Round 3
Date: 2026-07-01

## Resolved Decisions

### Q1: Are trajectory trails a new visual feature?

**Options:** (a) Both trails AND neighbor connections, (b) Right panel only — connections, no trails, (c) Left panel only — trails, no connections
**Decision:** Neither — left panel illustrates desired wandering movement pattern only, not a feature to implement
**Rationale:** User confirmed "the trail shows an example trajectory for each object to go around the canvas."
**Consequence:** No trail/history drawing needed. Focus is entirely on the right panel: distance-based connections between latitude label positions.

---

### Q2: How many neighbors per object?

**Options:** (a) 1 nearest, (b) 2–3 nearest, (c) Distance-based — connect to all within a radius
**Decision:** Option (c) — distance-based radius
**Rationale:** User chose c.
**Consequence:** Connection count varies per label depending on proximity. All pairs within threshold get a line.

---

### Q3: Where do lines attach — object image center or label text position?

**Options:** (a) Object image center, (b) Label text position, (c) Treat as same thing
**Decision:** Label text position (latitude/longitude midpoints) — connections are between latitude field labels, NOT between furniture objects
**Rationale:** User clarified "object image centers should not be connected — this was for the latitude and longitude text."
**Consequence:** The distance-based web replaces the nearest-neighbor midpoint web in sketch.js. Furniture objects remain visually unconnected.

---

### Q4: What distance radius triggers a connection between latitude labels?

**Options:** (a) ~250px sparse, (b) ~400px medium (2–4 connections per label), (c) ~550px dense
**Decision:** Option (b) — 400px radius
**Rationale:** Matches the density visible in the right panel sketch.
**Consequence:** Replace nearest-neighbor loop in sketch.js with a pairwise distance check: if dist(midA, midB) < 400, draw a dashed red line between them.

---

### Line style

**Decision:** Same red dashed style as latitude lines — `stroke(255, 0, 0)`, `strokeWeight(1)`, `setLineDash([4, 8])`, no alpha fade.
**Rationale:** User said "I like the format of the current lines."

---

## Implementation Plan

### Step 1 — Replace nearest-neighbor web with distance-based web (`sketch.js`)
- **Action:** In the draw loop, replace the nearest-neighbor loop with a pairwise loop: for every pair (i, j) where i < j, if distance between midpoints < 400, draw a dashed red line between them
- **Visible change:** Latitude label positions are now connected by a radius-based web — denser where labels cluster, sparse where they're spread out
- **If skipped:** Only nearest-neighbor lines remain, which is sparser and doesn't match the right panel intent
