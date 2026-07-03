// 17-Sequence pre-show — pure controller logic tests
// Run: node tests/sequence-controller-logic.js
// Mirrors tests/phase-h-trigger-gate.js: hand-rolled asserts, no framework.

const {
  resolvePagePath, handoffTargetForRole, activeSequenceForElapsed,
  resolveAssetPath, mediaKindForFile, nextAssetOnError, preshowPageForLivePath
} = require('../js/sequenceController.js');

const fs = require('fs');
const timeline = JSON.parse(fs.readFileSync(__dirname + '/../data/timeline_17seq.json', 'utf8'));
const SEQ = timeline.sequences;

let passed = 0, failed = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log('  PASS', label); passed++; }
  else { console.log('  FAIL', label, detail ? `— ${detail}` : ''); failed++; }
}

console.log('\n── Sequence controller logic tests ───────────────────\n');

// ── 1. resolvePagePath ───────────────────────────────────────────
console.log('1. resolvePagePath (role from URL)');
assert('initial01.html → left',   resolvePagePath('/initial01.html') === 'left');
assert('initial02.html → center', resolvePagePath('/x/initial02.html') === 'center');
assert('initial03.html → right',  resolvePagePath('initial03.html') === 'right');
assert('unknown → null',          resolvePagePath('/simulator.html') === null);

// ── 2. handoffTargetForRole ──────────────────────────────────────
console.log('\n2. handoffTargetForRole');
assert('left → simulator.html',     handoffTargetForRole('left') === 'simulator.html');
assert('center → detector.html',    handoffTargetForRole('center') === 'detector.html');
assert('right → market_screen.html', handoffTargetForRole('right') === 'market_screen.html');
assert('bad role → null',           handoffTargetForRole('nope') === null);

// ── 3. activeSequenceForElapsed (boundaries, all 17) ─────────────
console.log('\n3. activeSequenceForElapsed');
assert('elapsed 0 → seq 1',        activeSequenceForElapsed(SEQ, 0).sequence === 1);
assert('elapsed 7.9 → seq 1',      activeSequenceForElapsed(SEQ, 7.9).sequence === 1);
assert('elapsed 8 → seq 2 (start-inclusive, seq1=[0,8))',
                                    activeSequenceForElapsed(SEQ, 8).sequence === 2);
assert('elapsed 22 → seq 3',       activeSequenceForElapsed(SEQ, 22).sequence === 3);
assert('elapsed 200 → seq 15',     activeSequenceForElapsed(SEQ, 200).sequence === 15);
assert('elapsed 262.9 → seq 17',   activeSequenceForElapsed(SEQ, 262.9).sequence === 17);
assert('elapsed 263 → seq 17 (final end inclusive)',
                                    activeSequenceForElapsed(SEQ, 263).sequence === 17);
assert('elapsed -1 → null',        activeSequenceForElapsed(SEQ, -1) === null);
assert('elapsed 263.1 → null',     activeSequenceForElapsed(SEQ, 263.1) === null);

// every sequence's own start lands on itself; durations sum to 263
console.log('   · each start maps to its own sequence, durations sum to 263');
let durSum = 0, allStartsOk = true;
for (const s of SEQ) {
  durSum += s.duration;
  if (activeSequenceForElapsed(SEQ, s.start).sequence !== s.sequence) allStartsOk = false;
}
assert('every seq.start → that sequence', allStartsOk);
assert('durations sum to 263', durSum === 263, 'got ' + durSum);

// ── 4. resolveAssetPath (space encoded) ──────────────────────────
console.log('\n4. resolveAssetPath (encodeURI the space)');
const folder = timeline.asset_folder; // "assets/complete sequence/ppt exports/"
assert('encodes the folder space',
  resolveAssetPath(folder, 'Slide2.PNG') === encodeURI(folder + 'Slide2.PNG'));
assert('no raw space in result',
  resolveAssetPath(folder, 'Slide 01.mp4').indexOf(' ') === -1,
  resolveAssetPath(folder, 'Slide 01.mp4'));
assert('encodes spaced mp4 filename too',
  resolveAssetPath(folder, 'Slide 01.mp4') === encodeURI(folder + 'Slide 01.mp4'));

// ── 5. mediaKindForFile ──────────────────────────────────────────
console.log('\n5. mediaKindForFile');
assert('.mp4 → video',        mediaKindForFile('Slide 01.mp4') === 'video');
assert('.MP4 (upper) → video', mediaKindForFile('X.MP4') === 'video');
assert('.PNG → image',        mediaKindForFile('Slide2.PNG') === 'image');
assert('.gif → image',        mediaKindForFile('Slide12.gif') === 'image');

// ── 6. nextAssetOnError (fallback chain) ─────────────────────────
console.log('\n6. nextAssetOnError');
const entry = { preferred_file: 'Slide 01.mp4', fallback_file: 'Slide1.PNG' };
assert('from preferred → fallback',
  nextAssetOnError(entry, 'Slide 01.mp4') === 'Slide1.PNG');
assert('from fallback → null (give up)',
  nextAssetOnError(entry, 'Slide1.PNG') === null);
assert('no fallback defined → null',
  nextAssetOnError({ preferred_file: 'X.PNG' }, 'X.PNG') === null);

// ── 7. preshowPageForLivePath (live page → its pre-show page) ─────
console.log('\n7. preshowPageForLivePath (Mode 01 entry)');
assert('simulator.html → initial01.html',
  preshowPageForLivePath('/simulator.html') === 'initial01.html');
assert('detector.html → initial02.html',
  preshowPageForLivePath('/x/detector.html') === 'initial02.html');
assert('market_screen.html → initial03.html',
  preshowPageForLivePath('market_screen.html') === 'initial03.html');
assert('unknown page → null',
  preshowPageForLivePath('/index.html') === null);
// inverse-symmetry: preshow entry then handoff returns to the same live page
['initial01.html', 'initial02.html', 'initial03.html'].forEach(pre => {
  const live = handoffTargetForRole(resolvePagePath(pre));
  assert(pre + ' ↔ ' + live + ' round-trips',
    preshowPageForLivePath(live) === pre);
});

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
