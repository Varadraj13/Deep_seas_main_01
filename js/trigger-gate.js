// ================================================================
//  TRIGGER GATE — commit-time detection safety check
//  The engine rests in HOLD and never auto-fires. When the operator
//  commits (button / Spacebar), evaluateCommit inspects the current
//  frame's predictions and decides whether ONE object is clearly present.
//  Vision decides WHICH weapon; the operator decides WHEN; this check
//  blocks garbage (empty scene, a person, or two tied objects).
// ================================================================

const TRIGGER_DEFAULTS = {
  threshold: 0.85,   // min confidence for the top class
  margin:    0.30,   // top must beat the runner-up by at least this
  // Any class whose name matches this is "nothing here" — never fires.
  // (Lab Final model names its empty class "0_blank".)
  backgroundRe: /background|empty|none|nothing|idle|blank/i,
};

// predictions: [{ className, probability }] from the TM model.
// returns { fire, className, reason }.
function evaluateCommit(predictions, cfg = TRIGGER_DEFAULTS) {
  if (!predictions || !predictions.length) {
    return { fire: false, className: null, reason: 'no-input' };
  }
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  const second = sorted[1];
  const conf = top.probability;
  const margin = conf - (second ? second.probability : 0);

  if (cfg.backgroundRe.test(top.className)) {
    return { fire: false, className: null, reason: 'background' };
  }
  if (conf < cfg.threshold) {
    return { fire: false, className: null, reason: 'low-confidence' };
  }
  if (margin < cfg.margin) {
    return { fire: false, className: null, reason: 'ambiguous' };
  }
  return { fire: true, className: top.className, reason: 'ok' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { evaluateCommit, TRIGGER_DEFAULTS };
}
