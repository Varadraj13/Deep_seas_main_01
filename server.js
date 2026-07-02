const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = process.env.PORT ?? 3000;

const BET_AMOUNT = 50;
const SEED = 50;
const MAX_TRANSACTIONS = 50;

// ── State ─────────────────────────────────────────────────────────
const state = {
  marketPrice: 0.5,
  'betsOpen$': SEED,
  'betsClosed$': SEED,
  connectedCount: 0,
  transactions: [],   // rolling [{name, side, amount, ts}]
  byName: {}          // {name: {open$, closed$}}
};

function recompute() {
  const total = state['betsOpen$'] + state['betsClosed$'];
  state.marketPrice = total === 0 ? 0.5 : state['betsOpen$'] / total;
}

function snapshot() {
  return {
    marketPrice:    state.marketPrice,
    'betsOpen$':    state['betsOpen$'],
    'betsClosed$':  state['betsClosed$'],
    connectedCount: state.connectedCount,
    transactions:   state.transactions,
    byName:         state.byName
  };
}

function broadcast() {
  const msg = JSON.stringify(snapshot());
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ── Middleware ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Routes ────────────────────────────────────────────────────────
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.post('/bet', (req, res) => {
  const { side, name } = req.body || {};
  const bettor = (name || '').trim() || 'Anonymous';

  if (side === 'open')   state['betsOpen$']   += BET_AMOUNT;
  if (side === 'closed') state['betsClosed$'] += BET_AMOUNT;

  // Transaction log (rolling cap)
  state.transactions.push({ name: bettor, side, amount: BET_AMOUNT, ts: Date.now() });
  if (state.transactions.length > MAX_TRANSACTIONS) state.transactions.shift();

  // Per-name totals
  if (!state.byName[bettor]) state.byName[bettor] = { 'open$': 0, 'closed$': 0 };
  if (side === 'open')   state.byName[bettor]['open$']   += BET_AMOUNT;
  if (side === 'closed') state.byName[bettor]['closed$'] += BET_AMOUNT;

  recompute();
  broadcast();
  res.json(snapshot());
});

app.post('/reset', (req, res) => {
  state['betsOpen$']   = SEED;
  state['betsClosed$'] = SEED;
  state.transactions   = [];
  state.byName         = {};
  recompute();
  broadcast();
  res.json(snapshot());
});

// ── WebSocket ─────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  state.connectedCount++;
  ws.send(JSON.stringify(snapshot()));
  ws.on('close', () => { state.connectedCount--; });
});

// ── Start ─────────────────────────────────────────────────────────
server.listen(port, () => console.log('server running on port ' + port));
