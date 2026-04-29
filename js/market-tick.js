// ================================================================
//  MARKET TICK — Layer 1.5 (after game-state.js)
//  Autonomous 20-second loop: decay fast weapons, drift prob,
//  mean-revert toward 50. Slow weapons deferred to Phase 3.
// ================================================================

const TICK_INTERVAL_MS = 20000;
const TICK_DECAY_SCALE = 20 / 30; // tick is 20s; config rates are per 30s

function marketTick() {
  marketState.tickCount++;

  // ── Decay fast weapons ─────────────────────────────────────────
  let anyRemoved = false;
  for (let i = marketState.activeWeapons.length - 1; i >= 0; i--) {
    const entry = marketState.activeWeapons[i];
    if (entry.weapon.speed !== 'fast') continue;

    const decayPerTick = entry.weapon.decay_per_30s * TICK_DECAY_SCALE;
    entry.remainingDelta += decayPerTick;
    marketState.prob += decayPerTick;

    if (entry.remainingDelta <= 0) {
      marketState.activeWeapons.splice(i, 1);
      anyRemoved = true;
    }
  }

  if (anyRemoved) recomputeSimMultipliers();

  // ── Detect active slow-slow interaction pairs ─────────────────
  const activeIds = new Set(marketState.activeWeapons.map(e => e.weaponId));
  const pairedIds = new Set();
  const activePairs = [];
  for (const ix of WEAPONS_CONFIG.interactions) {
    if (ix.disruptor_id.includes('+') || ix.disruptor_id === 'any' || ix.defender_id.includes('+')) continue;
    if (!activeIds.has(ix.disruptor_id) || !activeIds.has(ix.defender_id)) continue;
    const dW = WEAPONS_CONFIG.weapons.find(w => w.id === ix.disruptor_id);
    const rW = WEAPONS_CONFIG.weapons.find(w => w.id === ix.defender_id);
    if (dW.speed === 'slow' && rW.speed === 'slow') {
      pairedIds.add(ix.disruptor_id);
      pairedIds.add(ix.defender_id);
      activePairs.push(ix);
    }
  }

  // ── Build slow weapons (after onset) — skip paired weapons ────
  for (const entry of marketState.activeWeapons) {
    if (entry.weapon.speed !== 'slow') continue;
    if (pairedIds.has(entry.weaponId)) continue;
    const ticksActive = marketState.tickCount - entry.ticksFiredAt;
    if (ticksActive * 20 >= entry.weapon.onset_s) {
      marketState.prob += entry.weapon.build_per_30s * TICK_DECAY_SCALE;
    }
  }

  // ── Apply interaction net_delta when both partners past onset ─
  for (const ix of activePairs) {
    const dEntry = marketState.activeWeapons.find(e => e.weaponId === ix.disruptor_id);
    const rEntry = marketState.activeWeapons.find(e => e.weaponId === ix.defender_id);
    const dReady = (marketState.tickCount - dEntry.ticksFiredAt) * 20 >= dEntry.weapon.onset_s;
    const rReady = (marketState.tickCount - rEntry.ticksFiredAt) * 20 >= rEntry.weapon.onset_s;
    if (dReady && rReady) {
      marketState.prob += ix.net_delta * TICK_DECAY_SCALE;
    }
  }

  // ── Drift + mean-reversion ─────────────────────────────────────
  const drift = (Math.random() - 0.5) * 4;
  const pull  = (50 - marketState.prob) * 0.05;
  marketState.prob += drift + pull;

  // ── Clamp ──────────────────────────────────────────────────────
  marketState.prob = Math.max(0, Math.min(100, marketState.prob));

  if (typeof updateDashboard === 'function') updateDashboard();
}

function startTick() {
  setInterval(marketTick, TICK_INTERVAL_MS);
}
