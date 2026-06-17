const WebSocket = require('ws');
const http = require('http');

let passed = 0, failed = 0;
function pass(id, note) { passed++; console.log('PASS', id, note || ''); }
function fail(id, note) { failed++; console.log('FAIL', id, note || ''); }

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function run() {
  await post('/reset', {});

  // ── Behavior 1: initial broadcast has correct shape ───────────────
  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.on('open', () => pass('s1a', 'connected to ws://localhost:3000'));
    ws.on('error', () => fail('s1a', 'WebSocket failed to open'));

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      typeof msg.marketPrice === 'number' ? pass('s1b', 'marketPrice=' + msg.marketPrice) : fail('s1b', JSON.stringify(msg));
      typeof msg.betsOpen === 'number'    ? pass('s1c', 'betsOpen=' + msg.betsOpen)       : fail('s1c', JSON.stringify(msg));
      typeof msg.connectedCount === 'number' ? pass('s1d', 'connectedCount=' + msg.connectedCount) : fail('s1d', JSON.stringify(msg));
      ws.close();
      clearTimeout(t1);
      resolve();
    });

    const t1 = setTimeout(() => { fail('s1b', 'timeout'); fail('s1c', 'timeout'); fail('s1d', 'timeout'); resolve(); }, 3000);
  });

  // ── Behavior 2: broadcast after bet has updated marketPrice ───────
  await post('/reset', {});

  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000');
    let gotInitial = false;

    ws.on('error', () => { fail('s2a', 'WebSocket failed'); resolve(); });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (!gotInitial) {
        gotInitial = true;
        post('/bet', { side: 'open' });
      } else {
        msg.marketPrice > 0.5
          ? pass('s2a', 'marketPrice after open bet=' + msg.marketPrice)
          : fail('s2a', 'marketPrice not > 0.5: ' + msg.marketPrice);
        ws.close();
        clearTimeout(t2);
        resolve();
      }
    });

    const t2 = setTimeout(() => { fail('s2a', 'timeout — no broadcast after bet'); resolve(); }, 3000);
  });

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
