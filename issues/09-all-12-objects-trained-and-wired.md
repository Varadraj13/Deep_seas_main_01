# Phase 9: All 12 objects trained and wired

**Type:** HITL

## What to build

Extend the object detection mapping to cover all 12 weapons. Each physical object maps to a specific weapon ID. Player A (disruptor role) uses 6 objects; Player B (defender role) uses 6 objects. The detector must distinguish between all 12 classes with >70% confidence.

The action mapping table becomes the bridge between physical gesture and game mechanic.

## Acceptance criteria

- [ ] Action mapping table maps 12 distinct object classes to weapon IDs (D01-D06, R01-R06)
- [ ] Mapping respects current player role: if player is defender, only defender objects (R01-R06) trigger
- [ ] All 12 objects reliably detected at >70% confidence in Movement Lab lighting conditions
- [ ] Each detection fires the correct weapon and produces the expected probability shift
- [ ] detector.html displays current player role and which objects are theirs
- [ ] Status bar shows: last detected object, confidence %, weapon fired, delta applied
- [ ] Confidence threshold tunable in config (default 70%)
- [ ] False positive rate acceptable: <5% misclassification between objects
- [ ] If Teachable Machine model needs retraining for new objects, model URL is configurable
- [ ] Test: each of 12 mock detection events triggers correct weapon
- [ ] Test: wrong-role object detection is ignored (defender object during disruptor turn)
- [ ] Manually verified: all 12 physical objects correctly classified and fire correct weapons

## Blocked by

- Blocked by Phase 8 (single object trigger architecture must work first)
