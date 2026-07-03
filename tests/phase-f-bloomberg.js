// Phase F — bloomberg-data.js contract (wired into detector.html)
// Run: node tests/phase-f-bloomberg.js

const { bloombergData, weekEndingDates } = require('../bloomberg-data.js');

let passed = 0, failed = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log('  PASS', label); passed++; }
  else { console.log('  FAIL', label, detail ? `— ${detail}` : ''); failed++; }
}

console.log('\n── Phase F bloomberg-data tests ──────────────────────\n');

const WEAPONS = ['D01','D02','D03','D04','D05','D06','R01','R02','R03','R04','R05','R06'];
const LIVE = weekEndingDates.length - 1;

console.log('1. Structure');
assert('9 week-ending columns', weekEndingDates.length === 9, weekEndingDates.length);
assert('all 12 weapons present', WEAPONS.every(id => bloombergData[id]));

console.log('\n2. Every weapon has a title + companies with full-length rows');
WEAPONS.forEach(id => {
  const d = bloombergData[id];
  const ok = d && d.title && Array.isArray(d.companies) && d.companies.length >= 2 &&
             d.companies.every(c => Array.isArray(c.base) && c.base.length === weekEndingDates.length);
  assert(`${id} well-formed`, ok);
});

console.log('\n3. Special reaction cases');
assert('D05 live column all 0.0 (freeze)', bloombergData.D05.companies.every(c => c.base[LIVE] === 0.0));
assert('D06 live column all "ERR" (cyber)', bloombergData.D06.companies.every(c => c.base[LIVE] === 'ERR'));

console.log('\n4. Disruptor vs defender live-column direction (sanity)');
assert('D01 median live negative (shipping crash)', bloombergData.D01.companies[0].base[LIVE] < 0);
assert('R01 median live positive (recovery)',       bloombergData.R01.companies[0].base[LIVE] > 0);

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
