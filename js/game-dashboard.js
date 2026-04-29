// ================================================================
//  GAME DASHBOARD — Layer 1.5 (after game-state.js)
//  Pure DOM writer. Reads marketState, never mutates it.
//  Call updateDashboard() after any state change.
// ================================================================

function updateDashboard() {
  const gdProb = document.getElementById('gdProb');
  if (!gdProb) return;
  if (typeof marketState === 'undefined') return;

  // ── Zone 1: Probability ────────────────────────────────────────
  const prob = Math.round(marketState.prob);
  const filled = Math.min(10, Math.round(prob / 10));
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

  gdProb.innerHTML =
    '<div class="gd-prob-value">' + prob + '%</div>' +
    '<div class="gd-prob-bar">' + bar + '</div>';

  gdProb.className = '';
  if (prob > 65)       gdProb.classList.add('prob-red');
  else if (prob < 35)  gdProb.classList.add('prob-green');
  else                 gdProb.classList.add('prob-amber');

  // ── Zone 2: Last Action ────────────────────────────────────────
  const gdLastAction = document.getElementById('gdLastAction');
  if (gdLastAction) {
    if (!marketState.actionLog.length) {
      gdLastAction.innerHTML = '<div class="gd-empty">— NO ACTION YET —</div>';
    } else {
      const last = marketState.actionLog[marketState.actionLog.length - 1];
      const weapon = (typeof weaponLookup === 'function') ? weaponLookup(last.weaponId) : null;
      const sign = last.delta >= 0 ? '↑ +' : '↓ ';
      const delta = Math.abs(last.delta);

      var effectRows = '';
      if (weapon && weapon.sim_trigger_keys) {
        var keys = Object.keys(weapon.sim_trigger_keys);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var v = weapon.sim_trigger_keys[k];
          var display = (typeof v === 'number')
            ? '×' + v
            : '→ ' + String(v).toUpperCase();
          effectRows += '<div class="gd-effect">EFFECT&nbsp;&nbsp;' +
            k.replace(/_/g, ' ') + '&nbsp;' + display + '</div>';
        }
      }

      gdLastAction.innerHTML =
        '<div class="gd-weapon-id">' + last.weaponId + ' · ' +
          (weapon ? weapon.name : last.weaponId) + '</div>' +
        '<div class="gd-cause">CAUSE&nbsp;&nbsp;' + sign + delta + '% prob</div>' +
        effectRows;
    }
  }

  // ── Zone 3: Active Weapons ─────────────────────────────────────
  var gdActive = document.getElementById('gdActive');
  if (gdActive) {
    if (!marketState.activeWeapons.length) {
      gdActive.innerHTML = '<div class="gd-empty">— NONE ACTIVE —</div>';
    } else {
      gdActive.innerHTML = marketState.activeWeapons.map(function(e) {
        return '<div class="gd-active-row">' + e.weaponId +
          ' · ' + e.weapon.name + '</div>';
      }).join('');
    }
  }

  // ── Zone 4: Event Log ──────────────────────────────────────────
  var gdLog = document.getElementById('gdLog');
  if (gdLog) {
    if (!marketState.actionLog.length) {
      gdLog.innerHTML = '<div class="gd-empty">— NO EVENTS —</div>';
    } else {
      var tick = (typeof simTickCount !== 'undefined') ? simTickCount : 0;
      var last3 = marketState.actionLog.slice(-3).reverse();
      gdLog.innerHTML = last3.map(function(e) {
        var sign = e.delta >= 0 ? '+' : '';
        return '<div class="gd-log-row">→ ' + e.weaponId +
          '&nbsp;&nbsp;' + sign + e.delta + '%' +
          '&nbsp;&nbsp;·&nbsp;&nbsp;tick ' +
          String(tick).padStart(4, '0') + '</div>';
      }).join('');
    }
  }
}
