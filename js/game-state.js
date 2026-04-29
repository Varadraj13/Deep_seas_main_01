// ================================================================
//  GAME STATE — Layer 1.5
//  Single source of truth for market probability and sim multipliers.
//  Simulation reads from this; nothing writes to it except game modules.
// ================================================================

const SIM_DEFAULTS = {
  speed_mult: 1.0,
  spawn_rate_mult: 1.0,
  hormuz_lane: 'open'
};

const marketState = {
  prob: 50,
  tickCount: 0,
  activeWeapons: [],
  simMultipliers: { ...SIM_DEFAULTS },
  actionLog: []
};

function weaponLookup(id) {
  return WEAPONS_CONFIG.weapons.find(w => w.id === id) || null;
}

// Recompute simMultipliers from scratch based on activeWeapons.
// Numeric keys: Math.min (most restrictive wins).
// String/boolean flag keys: defender always overrides disruptor.
function recomputeSimMultipliers() {
  const fresh = { ...SIM_DEFAULTS };

  for (const entry of marketState.activeWeapons) {
    const keys = entry.weapon.sim_trigger_keys;
    for (const [key, val] of Object.entries(keys)) {
      if (typeof val === 'number') {
        fresh[key] = (key in fresh) ? Math.min(fresh[key], val) : val;
      } else {
        if (entry.weapon.player === 'defender') {
          fresh[key] = val;
        } else if (!(key in fresh) || fresh[key] === SIM_DEFAULTS[key]) {
          fresh[key] = val;
        }
      }
    }
  }

  // Remove keys that no longer have an active weapon writing them
  for (const k of Object.keys(marketState.simMultipliers)) {
    if (!(k in fresh)) delete marketState.simMultipliers[k];
  }
  Object.assign(marketState.simMultipliers, fresh);
}

function fireWeapon(id) {
  if (marketState.activeWeapons.some(e => e.weaponId === id)) return;

  const weapon = weaponLookup(id);
  if (!weapon) return;

  marketState.prob = Math.max(0, Math.min(100, marketState.prob + weapon.prob_delta));

  marketState.activeWeapons.push({ weaponId: id, weapon, firedAt: Date.now(), remainingDelta: weapon.prob_delta, ticksFiredAt: marketState.tickCount });

  recomputeSimMultipliers();

  marketState.actionLog.push({
    weaponId: id,
    delta: weapon.prob_delta,
    timestamp: Date.now()
  });

  if (typeof updateDashboard === 'function') updateDashboard();
}
