// ================================================================
//  GAME DASHBOARD — Layer 1.5 (after game-state.js)
//  Pure DOM writer into the merged #controls dashboard grid.
//  Reads marketState, never mutates it. Call after any state change.
// ================================================================

function updateDashboard() {
  if (typeof marketState === 'undefined') return;

  // ── Probability row + slim color-coded bar ─────────────────────
  const prob = Math.round(marketState.prob);
  const tone = prob > 65 ? '#ef4444' : prob < 35 ? '#22c55e' : '#f59e0b';
  const valEl = document.getElementById('gdProbValue');
  if (!valEl) return; // dashboard not on this page
  valEl.textContent = prob + '%';
  valEl.style.color = tone;
  const barEl = document.getElementById('gdProbBar');
  if (barEl) { barEl.style.width = prob + '%'; barEl.style.background = tone; }

  // ── Last Action ────────────────────────────────────────────────
  const la = document.getElementById('gdLastAction');
  if (la) {
    if (!marketState.actionLog.length) {
      la.textContent = '— none yet —';
    } else {
      const last = marketState.actionLog[marketState.actionLog.length - 1];
      const weapon = (typeof weaponLookup === 'function') ? weaponLookup(last.weaponId) : null;
      const sign = last.delta >= 0 ? '+' : '';
      la.textContent = last.weaponId + ' · ' + (weapon ? weapon.name : '') +
        ' (' + sign + last.delta + '%)';
    }
  }

  // ── Active Weapons ─────────────────────────────────────────────
  const aw = document.getElementById('gdActive');
  if (aw) {
    aw.textContent = marketState.activeWeapons.length
      ? marketState.activeWeapons.map(function(e) { return e.weaponId; }).join(' ')
      : '— none —';
  }
}
