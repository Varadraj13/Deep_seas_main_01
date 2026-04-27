# Phase 8: Single object detection trigger

**Type:** HITL

## What to build

Wire the existing detector.html Teachable Machine output to the game layer. One physical object (currently classified as "cushion" or similar) is mapped to D01 Strait Blockade. When the camera sees the object with >70% confidence, it calls `fireWeapon('D01')` which updates marketState, which the simulation reads.

This completes the physical gesture -> digital consequence chain for one weapon. The connection between a human lifting an object and ships stopping in the strait is the core argument made tangible.

## Acceptance criteria

- [ ] detector.html communicates with index.html game layer (via BroadcastChannel, postMessage, or shared WebSocket)
- [ ] Action mapping table in detector.html maps object class "cushion" (or configured object) to weapon ID "D01"
- [ ] When confidence > 70% for mapped object: sends fire command to game layer
- [ ] Debounce: same object held continuously does not re-fire during cooldown
- [ ] fireWeapon('D01') executes in game layer -> probability shifts -> ships slow
- [ ] detector.html displays: "WEAPON FIRED: D01 STRAIT BLOCKADE" confirmation
- [ ] If detector.html is not open, keyboard controls still work as fallback
- [ ] Camera auto-starts on page load (already implemented)
- [ ] Test: mock detection event with confidence 0.75 triggers fireWeapon
- [ ] Test: mock detection event with confidence 0.60 does NOT trigger (below threshold)
- [ ] Test: rapid repeated detections respect cooldown period
- [ ] Manually verified: physical object in front of webcam triggers full chain end-to-end

## Blocked by

- Blocked by Phase 6 (MKTS panel needed to see weapon fire confirmation in-sim)
