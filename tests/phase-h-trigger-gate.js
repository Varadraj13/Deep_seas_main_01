// Phase H — commit-time detection check (pure)
// Run: node tests/phase-h-trigger-gate.js
//
// The system rests in HOLD and never auto-fires. When the operator commits
// (button / Spacebar), evaluateCommit decides whether a single object is
// clearly present and, if so, which one. It fires ONLY when:
//   - top class is not the background/empty class
//   - top confidence >= threshold
//   - top beats the runner-up by >= margin (no two-object tie / person ambiguity)

const { evaluateCommit, TRIGGER_DEFAULTS } = require('../js/trigger-gate.js');

let passed = 0, failed = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log('  PASS', label); passed++; }
  else { console.log('  FAIL', label, detail ? `— ${detail}` : ''); failed++; }
}
const P = (className, probability) => ({ className, probability });
const cfg = TRIGGER_DEFAULTS; // threshold .85, margin .30

console.log('\n── Phase H commit-check tests ────────────────────────\n');

// 1. Clear single object → fire, returns which
console.log('1. Clear single object');
{
  const r = evaluateCommit([P('Broom', 0.95), P('Stool', 0.02)], cfg);
  assert('fires', r.fire === true);
  assert('returns the object class', r.className === 'Broom');
}

// 2. Background / empty → never fire
console.log('\n2. Background / empty scene');
{
  const r = evaluateCommit([P('Background', 0.97), P('Broom', 0.01)], cfg);
  assert('does not fire', r.fire === false);
  assert('reason background', r.reason === 'background');
}

// 3. Two objects tied → blocked, no fire
console.log('\n3. Two-object tie is blocked');
{
  const r = evaluateCommit([P('Broom', 0.52), P('Stool', 0.46)], cfg);
  assert('does not fire', r.fire === false);
  assert('reason is a block (not ok)', r.reason !== 'ok', r.reason);
}

// 4. Confident but small margin (person looks a bit like two things) → no fire
console.log('\n4. High conf, thin margin still blocked');
{
  const r = evaluateCommit([P('Broom', 0.88), P('Cushion', 0.70)], cfg);
  assert('does not fire on thin margin', r.fire === false, r.reason);
}

// 5. Low confidence → no fire
console.log('\n5. Low confidence');
{
  const r = evaluateCommit([P('Broom', 0.70), P('x', 0.05)], cfg);
  assert('does not fire', r.fire === false);
  assert('reason low-confidence', r.reason === 'low-confidence', r.reason);
}

// 6. Empty / missing input → no fire, no crash
console.log('\n6. Empty input');
{
  assert('empty array no fire', evaluateCommit([], cfg).fire === false);
  assert('undefined no fire', evaluateCommit(undefined, cfg).fire === false);
}

// 7. Background regex matches common spellings
console.log('\n7. Background name variants');
{
  assert('"background"', evaluateCommit([P('background', 0.99)], cfg).reason === 'background');
  assert('"Empty"',      evaluateCommit([P('Empty', 0.99)], cfg).reason === 'background');
  assert('"none"',       evaluateCommit([P('none', 0.99)], cfg).reason === 'background');
}

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
