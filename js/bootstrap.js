// ================================================================
//  INIT
// ================================================================
function initVessels() {
  for (let i = 0; i < 30; i++) createVessel();
}

// Open IndexedDB then init
openDB().then(() => {
  addDBEvent('Trade database initialized');
  addDBEvent('Simulation started with 30 vessels');
});

initVessels();
initMarketHistory();
updateStats();
updateFilterDropdowns();

// Main loop — requestAnimationFrame FIRST so errors can't kill the loop
let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  if (playing) {
    try { updateSim(dt); }
    catch(e) { console.error('[Sim] updateSim error:', e); }
  }
}
requestAnimationFrame(animate);

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'KeyN') toggleNight();
  if (e.code === 'KeyT') toggleTrails();
  if (e.code === 'KeyR') toggleRoutes();
  if (e.code === 'KeyH') toggleHeatmap();
  if (e.code === 'KeyF') toggleGFW();
  if (e.code === 'KeyA') toggleAnalytics();
  if (e.code === 'KeyD') toggleDragMode();
  if (e.code === 'KeyB') toggleDBPanel();
  if (e.code === 'KeyK') document.getElementById('kalshiOverlay').classList.toggle('show');
  if (e.code === 'Escape') { closeShipPanel(); closePortPanel(); cancelDrag(); }
  if (e.code === 'Equal' || e.code === 'NumpadAdd') { simSpeed=Math.min(50,simSpeed+1); document.getElementById('speedSlider').value=simSpeed; setSpeed(simSpeed); }
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') { simSpeed=Math.max(1,simSpeed-1); document.getElementById('speedSlider').value=simSpeed; setSpeed(simSpeed); }
});

// Close panels when clicking map
map.on('click', () => { closeShipPanel(); closePortPanel(); });
