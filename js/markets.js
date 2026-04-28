// ================================================================
const MARKETS = [
  { id: 'hormuz-jul26',      question: 'Will Strait of Hormuz remain open through Jul 2026?',
    probability: 0.49, yesPrice: 54, noPrice: 47, volume: '$2.1M', history: [] },
  { id: 'fuel-q2',           question: 'Will VLSFO fuel prices exceed $700/ton by Jun 2026?',
    probability: 0.39, yesPrice: 42, noPrice: 62, volume: '$890K', history: [] },
  { id: 'singapore-delay',   question: 'Will Singapore Port report >20% delay rate in Q2 2026?',
    probability: 0.31, yesPrice: 34, noPrice: 68, volume: '$450K', history: [] },
];

function initMarketHistory() {
  MARKETS.forEach(m => {
    let p = m.probability;
    m.history = [];
    for (let i = 0; i < CONFIG.MARKET.SPARKLINE_POINTS; i++) {
      p += (Math.random() - 0.5) * 0.06;
      p = Math.max(0.05, Math.min(0.95, p));
      m.history.push(p);
    }
  });
}

function shiftMarkets(profitDelta) {
  const impactScore = Math.max(-1, Math.min(1, profitDelta / 500000));
  const disruptionLevel = -impactScore; // reverse analogy 
  const multipliers = [1.0, 0.7, 0.5]; // more impact on traffic normalisation than fuel prices, for example
  return MARKETS.map((m, i) => { // returns array of {id, oldProb, newProb, delta} for animation
    const oldProb = m.probability; // simple linear shift with caps at 5% and 95%
    let p = m.probability + disruptionLevel * CONFIG.MARKET.IMPACT_SCALE * multipliers[i];
    p = Math.max(0.05, Math.min(0.95, p));
    m.probability = p;
    m.yesPrice = Math.round(p * 97);
    m.noPrice = 97 - m.yesPrice; //
    m.history.push(p); // add new point to history for sparkline
    m.history = m.history.slice(-CONFIG.MARKET.SPARKLINE_POINTS);
    return { id: m.id, oldProb, newProb: p, delta: p - oldProb };
  });
}  // main goat of the simluation data

function renderKalshiOverlay(shiftResults) {
  for (let i = 0; i < 3; i++) {
    const m = MARKETS[i];
    const r = shiftResults[i];

    // Question text
    document.getElementById('mq-' + i).textContent = m.question;

    // Animate probability number from old to new
    const probEl = document.getElementById('prob-' + i);
    const startTime = performance.now();
    const oldPct = Math.round(r.oldProb * 100);
    const newPct = Math.round(m.probability * 100);
    (function animateProb() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / CONFIG.MARKET.ANIMATE_DURATION);
      probEl.textContent = Math.round(_lerpVal(oldPct, newPct, t)) + '%';
      if (t < 1) requestAnimationFrame(animateProb);
    })();

    // Yes / No prices
    const yesEl = document.getElementById('yes-' + i);
    const noEl = document.getElementById('no-' + i);
    yesEl.textContent = m.yesPrice + '¢';
    noEl.textContent = m.noPrice + '¢';

    // Flash yes border on upward move
    if (r.newProb > r.oldProb) {
      yesEl.style.borderColor = '#16a34a';
      yesEl.style.boxShadow = '0 0 6px rgba(22,163,74,0.4)';
      setTimeout(() => { yesEl.style.borderColor = ''; yesEl.style.boxShadow = ''; }, 1000);
    }

    // Sparkline
    const canvas = document.getElementById('spark-' + i);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (m.history.length > 1) {
      const step = w / (m.history.length - 1);
      ctx.beginPath();
      m.history.forEach((v, j) => {
        const x = j * step;
        const y = h - (v * h);
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = m.history[m.history.length - 1] > m.history[0] ? '#16a34a' : '#cc0000';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Cyan dot at last point
      const lastX = (m.history.length - 1) * step;
      const lastY = h - (m.history[m.history.length - 1] * h);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
    }
  }

  // Volume
  document.getElementById('kalshi-volume').textContent =
    MARKETS.map(m => m.volume).join(' / ') + ' ';

  // Show panel
  document.getElementById('kalshiOverlay').classList.add('show');
}
