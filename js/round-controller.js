// ================================================================
//  ROUND CONTROLLER — Layer 1.5 (after market-tick.js)
//  Full round lifecycle: start, end, pause, resume, reset.
//  Reads marketState; calls pauseTick/resumeTick from market-tick.js.
// ================================================================

const ROUND_DURATION_MS = 600000; // 10 minutes

function startRound() {
  marketState.prob = 50;
  marketState.activeWeapons = [];
  recomputeSimMultipliers();
  marketState.actionLog = [];
  marketState.tickCount = 0;

  marketState.round.number++;
  marketState.round.phase = 'playing';
  marketState.round.winner = null;
  marketState.round.roundStartedAt = Date.now();
  marketState.round.pausedAt = null;
  marketState.round.totalPausedMs = 0;
  marketState.round.firstMoveFlags = { disruptor: false, defender: false };

  if (typeof playing !== 'undefined') playing = true;
  if (typeof resumeTick === 'function') resumeTick();
  if (typeof showFlash === 'function') showFlash('ROUND ' + marketState.round.number + ' — BEGIN');
  if (typeof updateDashboard === 'function') updateDashboard();
}

function endRound() {
  const lane = marketState.simMultipliers.hormuz_lane || 'open';
  const disruptorWins = lane === 'closed';

  const disruptorIdx = marketState.round.roles[0] === 'disruptor' ? 0 : 1;
  const defenderIdx  = 1 - disruptorIdx;

  if (disruptorWins) {
    marketState.round.scores[disruptorIdx]++;
    marketState.round.winner = disruptorIdx === 0 ? 'A' : 'B';
    if (typeof showFlash === 'function') showFlash('ROUND ' + marketState.round.number + ' — DISRUPTOR WINS');
  } else {
    marketState.round.scores[defenderIdx]++;
    marketState.round.winner = defenderIdx === 0 ? 'A' : 'B';
    if (typeof showFlash === 'function') showFlash('ROUND ' + marketState.round.number + ' — DEFENDER WINS');
  }

  if (marketState.round.scores[0] >= 2 || marketState.round.scores[1] >= 2) {
    marketState.round.phase = 'over';
    const gameWinner = marketState.round.scores[0] >= 2 ? 'A' : 'B';
    if (typeof showFlash === 'function') showFlash('GAME OVER — PLAYER ' + gameWinner + ' WINS');
  } else {
    marketState.round.phase = 'roundEnd';
  }

  if (typeof playing !== 'undefined') playing = false;
  if (typeof pauseTick === 'function') pauseTick();
  if (typeof updateDashboard === 'function') updateDashboard();
}

function pauseRound() {
  if (marketState.round.phase !== 'playing') return;
  marketState.round.pausedAt = Date.now();
  if (typeof playing !== 'undefined') playing = false;
  if (typeof pauseTick === 'function') pauseTick();
  if (typeof showFlash === 'function') showFlash('PAUSED');
  const btn = document.getElementById('btnPauseRound');
  if (btn) btn.textContent = 'RESUME';
}

function resumeRound() {
  if (marketState.round.phase !== 'playing') return;
  if (marketState.round.pausedAt !== null) {
    marketState.round.totalPausedMs += Date.now() - marketState.round.pausedAt;
    marketState.round.pausedAt = null;
  }
  if (typeof playing !== 'undefined') playing = true;
  if (typeof resumeTick === 'function') resumeTick();
  if (typeof showFlash === 'function') showFlash('RESUMED');
  const btn = document.getElementById('btnPauseRound');
  if (btn) btn.textContent = 'PAUSE';
}

function togglePauseRound() {
  if (marketState.round.pausedAt !== null) resumeRound();
  else pauseRound();
}

function resetGame() {
  marketState.prob = 50;
  marketState.activeWeapons = [];
  recomputeSimMultipliers();
  marketState.actionLog = [];
  marketState.tickCount = 0;
  marketState.round = {
    phase: 'idle',
    number: 0,
    scores: [0, 0],
    roles: ['disruptor', 'defender'],
    winner: null,
    roundStartedAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    firstMoveFlags: { disruptor: false, defender: false }
  };
  if (typeof playing !== 'undefined') playing = false;
  if (typeof pauseTick === 'function') pauseTick();
  if (typeof showFlash === 'function') showFlash('GAME RESET');
  if (typeof updateDashboard === 'function') updateDashboard();
}
