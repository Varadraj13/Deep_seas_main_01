// ================================================================
//  SPEED MODEL — prob-driven vessel speed & spawn
//  Pure functions. Ship speed is an inverse function of marketState.prob:
//  higher disruption probability → slower ships. Every weapon that moves
//  prob moves speed proportionally, so all weapon combinations behave
//  consistently (no per-weapon speed_mult tuning).
//
//  Locked design (grill 2026-07-02):
//   - speed% of open = max(5, 100 - prob)     (5% floor, never fully dead)
//   - open speed = 2× nominal, so prob 50 = today's normal, prob 0 = 2×
//   - spawn tracks the same factor, capped at 1.0 (no thinning at/below prob 50)
// ================================================================

// Speed multiplier applied to a vessel's raw speed. Range 0.1 .. 2.0.
//   prob 0 → 2.0 (strait wide open), prob 50 → 1.0 (nominal), prob 100 → 0.1 (floor)
function speedFactorFromProb(prob) {
  const pctOfMax = Math.max(5, 100 - prob);  // 5..100, floor keeps a slight drift
  return 2 * pctOfMax / 100;                  // doubled headroom → 0.1..2.0
}

// Spawn-survival multiplier for arriving vessels. Shares the speed factor
// but is capped at 1.0 so ships only thin under disruption (prob > 50).
function spawnFactorFromProb(prob) {
  return Math.min(1.0, speedFactorFromProb(prob));
}

// Human-readable condition label for the strait, driven by prob.
function flowState(prob) {
  if (prob <= 25) return 'OPEN';
  if (prob < 55)  return 'NOMINAL';
  if (prob < 75)  return 'SLOWING';
  return 'BLOCKADE';
}

// Headline banner state for the strait, driven by prob. Returns the display
// string, the color tone, and the flow % (=100−prob, floored at 5).
function straitStatus(prob) {
  const state = flowState(prob);
  const flowPct = Math.max(5, Math.round(100 - prob));
  const MAP = {
    OPEN:     { headline: 'STRAIT OPEN',      tone: 'open'     },
    NOMINAL:  { headline: 'TRAFFIC NOMINAL',  tone: 'nominal'  },
    SLOWING:  { headline: 'TRAFFIC SLOWING',  tone: 'slowing'  },
    BLOCKADE: { headline: 'STRAIT BLOCKADED', tone: 'blockade' },
  };
  return { state, flowPct, ...MAP[state] };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { speedFactorFromProb, spawnFactorFromProb, flowState, straitStatus };
}
