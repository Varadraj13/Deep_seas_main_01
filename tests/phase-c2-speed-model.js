// Phase C2 — prob-driven speed model (pure functions)
// Run: node tests/phase-c2-speed-model.js
//
// Behavior under test (locked via grill):
//   speedFactor = 2 * max(5, 100-prob)/100   → prob0=2.0, prob50=1.0, prob100=0.1 (floor)
//   spawnFactor = min(1.0, speedFactor)      → no thinning at/below prob50
//   flowState   = OPEN / NOMINAL / SLOWING / BLOCKADE bands

const { speedFactorFromProb, spawnFactorFromProb, flowState } = require('../js/speed-model.js');

let passed = 0, failed = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log('  PASS', label); passed++; }
  else { console.log('  FAIL', label, detail ? `— ${detail}` : ''); failed++; }
}
function near(a, b) { return Math.abs(a - b) < 1e-9; }

console.log('\n── Phase C2 speed-model tests ────────────────────────\n');

// ── 1. speedFactor: inverse relation, doubled headroom ───────────
console.log('1. speedFactor = 2 × (100 − prob)/100');
assert('prob 0   → 2.0 (wide open, 2×)',   near(speedFactorFromProb(0), 2.0),   speedFactorFromProb(0));
assert('prob 25  → 1.5',                    near(speedFactorFromProb(25), 1.5),  speedFactorFromProb(25));
assert('prob 50  → 1.0 (today\'s normal)',  near(speedFactorFromProb(50), 1.0),  speedFactorFromProb(50));
assert('prob 75  → 0.5',                    near(speedFactorFromProb(75), 0.5),  speedFactorFromProb(75));

// ── 2. Floor at high disruption ──────────────────────────────────
console.log('\n2. 5%-of-max floor (never fully dead)');
assert('prob 100 → 0.1 (floored, not 0)',  near(speedFactorFromProb(100), 0.1), speedFactorFromProb(100));
assert('prob 98  → 0.1 (floor holds)',     near(speedFactorFromProb(98), 0.1),  speedFactorFromProb(98));

// ── 3. Monotonic: more prob → slower ─────────────────────────────
console.log('\n3. Monotonic decreasing in prob');
assert('speed(30) > speed(60)', speedFactorFromProb(30) > speedFactorFromProb(60));
assert('speed(60) > speed(90)', speedFactorFromProb(60) > speedFactorFromProb(90));

// ── 4. spawnFactor: capped at 1.0, thins only above prob 50 ──────
console.log('\n4. spawnFactor = min(1.0, speedFactor)');
assert('prob 0   → 1.0 (no extra ships)',  near(spawnFactorFromProb(0), 1.0),   spawnFactorFromProb(0));
assert('prob 50  → 1.0 (no thinning)',     near(spawnFactorFromProb(50), 1.0),  spawnFactorFromProb(50));
assert('prob 75  → 0.5 (thins 50%)',       near(spawnFactorFromProb(75), 0.5),  spawnFactorFromProb(75));
assert('prob 100 → 0.1 (floor)',           near(spawnFactorFromProb(100), 0.1), spawnFactorFromProb(100));

// ── 5. flowState word bands ──────────────────────────────────────
console.log('\n5. flowState bands');
assert('prob 10  → OPEN',     flowState(10) === 'OPEN',     flowState(10));
assert('prob 40  → NOMINAL',  flowState(40) === 'NOMINAL',  flowState(40));
assert('prob 65  → SLOWING',  flowState(65) === 'SLOWING',  flowState(65));
assert('prob 85  → BLOCKADE', flowState(85) === 'BLOCKADE', flowState(85));

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
