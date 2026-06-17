const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = process.env.PORT ?? 3000;

// ── State ─────────────────────────────────────────────────────────
const state = {
  marketPrice: 0.5,
  betsOpen: 0,
  betsClosed: 0,
  connectedCount: 0
};

function recompute() {
  const total = state.betsOpen + state.betsClosed;
  state.marketPrice = total === 0 ? 0.5 : state.betsOpen / total;
}

function broadcast() {
  const msg = JSON.stringify({
    marketPrice: state.marketPrice,
    betsOpen: state.betsOpen,
    betsClosed: state.betsClosed,
    connectedCount: state.connectedCount
  });
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
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/bet', (req, res) => {
  const { side } = req.body || {};
  if (side === 'open')   state.betsOpen++;
  if (side === 'closed') state.betsClosed++;
  recompute();
  broadcast();
  res.json({
    marketPrice: state.marketPrice,
    betsOpen: state.betsOpen,
    betsClosed: state.betsClosed,
    connectedCount: state.connectedCount
  });
});

app.post('/reset', (req, res) => {
  state.betsOpen = 0;
  state.betsClosed = 0;
  state.marketPrice = 0.5;
  broadcast();
  res.json({
    marketPrice: state.marketPrice,
    betsOpen: state.betsOpen,
    betsClosed: state.betsClosed,
    connectedCount: state.connectedCount
  });
});

// ── WebSocket ─────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  state.connectedCount++;
  ws.send(JSON.stringify({
    marketPrice: state.marketPrice,
    betsOpen: state.betsOpen,
    betsClosed: state.betsClosed,
    connectedCount: state.connectedCount
  }));
  ws.on('close', () => { state.connectedCount--; });
});

// ── Start ─────────────────────────────────────────────────────────
server.listen(port, () => {
  console.log('server running on port ' + port);
});
