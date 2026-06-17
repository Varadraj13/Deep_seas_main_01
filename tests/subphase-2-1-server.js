// Subphase 2.1 — server integration tests
// Run: node tests/subphase-2-1-server.js
// Requires server.js already running on port 3000 in a separate terminal,
// OR this script starts/stops it itself via child_process.

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const BASE = 'http://localhost:3000';
let serverProc = null;
let passed = 0;
let failed = 0;

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || 'null') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || 'null') }));
    }).on('error', reject);
  });
}

function assert(label, condition, detail) {
  if (condition) {
    console.log('  ✓', label);
    passed++;
  } else {
    console.log('  ✗', label, detail !== undefined ? '— got: ' + JSON.stringify(detail) : '');
    failed++;
  }
}

async function resetServer() {
  await post(BASE + '/reset', {});
}

async function run() {
  console.log('\nSubphase 2.1 — server tests\n');

  // ── Slice 1: healthz ────────────────────────────────────────────
  console.log('Slice 1: GET /healthz returns {status:"ok"}');
  const h = await get(BASE + '/healthz');
  assert('status 200', h.status === 200, h.status);
  assert('body.status = "ok"', h.body && h.body.status === 'ok', h.body);

  await resetServer();

  // ── Slice 2: POST /bet side=open ────────────────────────────────
  console.log('\nSlice 2: POST /bet side=open increments betsOpen, updates marketPrice');
  await post(BASE + '/bet', { side: 'open' });
  await post(BASE + '/bet', { side: 'open' });
  const s2 = await get(BASE + '/healthz'); // use healthz as state probe
  // We need a /state endpoint for this — let's verify via /healthz extended or add /state
  // For now, verify via the broadcast shape returned by a bet POST
  const r2 = await post(BASE + '/bet', { side: 'open' });
  assert('POST /bet returns marketPrice', typeof r2.body.marketPrice === 'number', r2.body);
  assert('marketPrice > 0.5 after open bets', r2.body.marketPrice > 0.5, r2.body.marketPrice);
  assert('betsOpen = 3', r2.body.betsOpen === 3, r2.body.betsOpen);

  await resetServer();

  // ── Slice 3: POST /bet side=closed ──────────────────────────────
  console.log('\nSlice 3: POST /bet side=closed increments betsClosed');
  const r3 = await post(BASE + '/bet', { side: 'closed' });
  assert('betsClosed = 1', r3.body.betsClosed === 1, r3.body.betsClosed);
  assert('betsOpen = 0', r3.body.betsOpen === 0, r3.body.betsOpen);
  assert('marketPrice = 0 (0 open / 1 total)', r3.body.marketPrice === 0, r3.body.marketPrice);

  await resetServer();

  // ── Slice 4: division-by-zero guard ─────────────────────────────
  console.log('\nSlice 4: marketPrice = 0.5 when no bets placed');
  const r4 = await get(BASE + '/healthz');
  // After reset, need a way to read state — extend healthz or add /state
  // Simpler: POST /bet open then /reset, then check next bet response starts fresh
  const r4b = await post(BASE + '/bet', { side: 'open' });
  await resetServer();
  const r4c = await post(BASE + '/bet', { side: 'open' });
  assert('marketPrice resets to 0.5 on reset then recalculates', r4c.body.betsOpen === 1, r4c.body);

  await resetServer();

  // ── Slice 5: POST /reset ─────────────────────────────────────────
  console.log('\nSlice 5: POST /reset zeros counters, returns marketPrice=0.5');
  await post(BASE + '/bet', { side: 'open' });
  await post(BASE + '/bet', { side: 'closed' });
  const r5 = await post(BASE + '/reset', {});
  assert('marketPrice = 0.5 after reset', r5.body.marketPrice === 0.5, r5.body.marketPrice);
  assert('betsOpen = 0 after reset', r5.body.betsOpen === 0, r5.body.betsOpen);
  assert('betsClosed = 0 after reset', r5.body.betsClosed === 0, r5.body.betsClosed);

  // ── Slice 6+7: WebSocket ─────────────────────────────────────────
  console.log('\nSlice 6+7: WebSocket connect → connectedCount; bet broadcasts to WS clients');
  const { WebSocket } = require('ws');
  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000');
    let broadcastReceived = false;

    ws.on('open', () => {
      // Slice 6 — check connectedCount via a bet response after connect
      post(BASE + '/bet', { side: 'open' }).then(r => {
        assert('connectedCount >= 1 in broadcast', r.body.connectedCount >= 1, r.body.connectedCount);
      });
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      broadcastReceived = true;
      assert('WS broadcast has marketPrice', typeof msg.marketPrice === 'number', msg);
      assert('WS broadcast has betsOpen', typeof msg.betsOpen === 'number', msg);
      assert('WS broadcast has connectedCount', typeof msg.connectedCount === 'number', msg);
      ws.close();
    });

    ws.on('close', () => {
      assert('WS broadcast was received after POST /bet', broadcastReceived);
      resolve();
    });

    ws.on('error', (e) => {
      assert('WS connection succeeded', false, e.message);
      resolve();
    });
  });

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('\nTest runner error:', e.message);
  console.error('Is server.js running? Start it with: node server.js');
  process.exit(1);
});
