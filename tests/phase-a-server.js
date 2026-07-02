// Phase A — server.js contract tests
// Run: node tests/phase-a-server.js
// Expects server running on localhost:3000 (node server.js in another terminal)

const http = require('http');
const { WebSocket } = require('ws');

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log('  PASS', label);
    passed++;
  } else {
    console.log('  FAIL', label, detail ? `— ${detail}` : '');
    failed++;
  }
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n── Phase A server tests ──────────────────────────────\n');

  // ── 1. Reset gives seeded state ──────────────────────────────
  console.log('1. /reset seeds market at $50/$50');
  const r = await post('/reset', {});
  assert('marketPrice is 0.5',      r.marketPrice === 0.5);
  assert('betsOpen$ is 50',         r.betsOpen$ === 50,         JSON.stringify(r));
  assert('betsClosed$ is 50',       r.betsClosed$ === 50,       JSON.stringify(r));
  assert('transactions is empty',   Array.isArray(r.transactions) && r.transactions.length === 0);
  assert('byName is empty object',  typeof r.byName === 'object' && Object.keys(r.byName).length === 0);

  // ── 2. First bet doesn't pin to 100% ─────────────────────────
  console.log('\n2. First bet moves price without pinning to extreme');
  const b1 = await post('/bet', { side: 'open', name: 'Alice' });
  assert('marketPrice < 1',         b1.marketPrice < 1,         `got ${b1.marketPrice}`);
  assert('marketPrice > 0.5',       b1.marketPrice > 0.5,       `got ${b1.marketPrice}`);
  assert('betsOpen$ is 100',        b1.betsOpen$ === 100,        JSON.stringify(b1));
  assert('betsClosed$ still 50',    b1.betsClosed$ === 50,       JSON.stringify(b1));

  // ── 3. Transaction log records name + side + amount ──────────
  console.log('\n3. Transaction log');
  assert('transactions has 1 entry',         b1.transactions.length === 1);
  assert('transaction name is Alice',        b1.transactions[0].name === 'Alice');
  assert('transaction side is open',         b1.transactions[0].side === 'open');
  assert('transaction amount is 50',         b1.transactions[0].amount === 50);
  assert('transaction has ts',               typeof b1.transactions[0].ts === 'number');

  // ── 4. byName totals ─────────────────────────────────────────
  console.log('\n4. byName totals');
  assert('byName.Alice exists',              typeof b1.byName['Alice'] === 'object');
  assert('Alice open$ is 50',               b1.byName['Alice'].open$ === 50);
  assert('Alice closed$ is 0',              b1.byName['Alice'].closed$ === 0);

  // ── 5. Second bettor accumulates separately ───────────────────
  console.log('\n5. Second bettor');
  const b2 = await post('/bet', { side: 'closed', name: 'Bob' });
  assert('byName has 2 entries',             Object.keys(b2.byName).length === 2);
  assert('Bob closed$ is 50',               b2.byName['Bob'].closed$ === 50);

  // ── 6. Same name accumulates ──────────────────────────────────
  console.log('\n6. Same name bets again');
  const b3 = await post('/bet', { side: 'open', name: 'Alice' });
  assert('Alice open$ is now 100',           b3.byName['Alice'].open$ === 100);
  assert('transactions has 3 entries',       b3.transactions.length === 3);

  // ── 7. Anonymous bet (no name) still works ────────────────────
  console.log('\n7. Anonymous bet (no name field)');
  const b4 = await post('/bet', { side: 'closed' });
  assert('bet accepted without name',        typeof b4.marketPrice === 'number');

  // ── 8. WS initial message includes full state ─────────────────
  console.log('\n8. WS initial message');
  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      assert('WS has marketPrice',       typeof msg.marketPrice === 'number');
      assert('WS has betsOpen$',         typeof msg.betsOpen$ === 'number');
      assert('WS has betsClosed$',       typeof msg.betsClosed$ === 'number');
      assert('WS has transactions',      Array.isArray(msg.transactions));
      assert('WS has byName',            typeof msg.byName === 'object');
      assert('WS has connectedCount',    typeof msg.connectedCount === 'number');
      ws.close();
      resolve();
    });
    ws.on('error', (e) => { assert('WS connects', false, e.message); resolve(); });
  });

  // ── Summary ───────────────────────────────────────────────────
  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
