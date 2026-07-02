// ================================================================
//  GAME BROADCAST — Layer 1.5 (after game-dashboard.js)
//  Opens BroadcastChannel('hormuz-game') and posts a marketState
//  snapshot whenever called. market_screen.html listens on the
//  same channel. Read-only — never mutates marketState.
//  Call broadcastGameState() after any state change.
// ================================================================

let _hormuzChannel = null;
try { _hormuzChannel = new BroadcastChannel('hormuz-game'); } catch(e) {}

function broadcastGameState() {
  if (!_hormuzChannel) return;
  if (typeof marketState === 'undefined') return;

  const r = marketState.round;
  _hormuzChannel.postMessage({
    shipProbability: Math.round(marketState.prob),
    lane: (marketState.simMultipliers && marketState.simMultipliers.hormuz_lane) || 'open',
    activeWeapons: marketState.activeWeapons.map(function(e) { return e.weaponId; }),
    round: {
      phase:  r.phase,
      number: r.number,
      scores: r.scores.slice()
    },
    actionLog: marketState.actionLog.slice(-10)
  });
}
