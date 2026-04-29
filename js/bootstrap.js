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
  // Disruptors: keys 1–6
  if (e.code === 'Digit1' && typeof fireWeapon === 'function') fireWeapon('D01');
  if (e.code === 'Digit2' && typeof fireWeapon === 'function') fireWeapon('D02');
  if (e.code === 'Digit3' && typeof fireWeapon === 'function') fireWeapon('D03');
  if (e.code === 'Digit4' && typeof fireWeapon === 'function') fireWeapon('D04');
  if (e.code === 'Digit5' && typeof fireWeapon === 'function') fireWeapon('D05');
  if (e.code === 'Digit6' && typeof fireWeapon === 'function') fireWeapon('D06');
  // Defenders: keys Q–Y
  if (e.code === 'KeyQ' && typeof fireWeapon === 'function') fireWeapon('R01');
  if (e.code === 'KeyW' && typeof fireWeapon === 'function') fireWeapon('R02');
  if (e.code === 'KeyE' && typeof fireWeapon === 'function') fireWeapon('R03');
  if (e.code === 'KeyR' && typeof fireWeapon === 'function') fireWeapon('R04');
  if (e.code === 'KeyT' && typeof fireWeapon === 'function') fireWeapon('R05');
  if (e.code === 'KeyY' && typeof fireWeapon === 'function') fireWeapon('R06');
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'KeyN') toggleNight();
  if (e.code === 'Period') toggleTrails();
  if (e.code === 'Comma') toggleRoutes();
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

// BroadcastChannel receiver — listens for weapon fire events from detector.html.
// Keyboard shortcut (Digit1) remains as fallback if detector is not open.
const gameChannel = new BroadcastChannel('deepseas-game');
gameChannel.onmessage = function(e) {
  if (e.data && e.data.type === 'FIRE_WEAPON' && typeof fireWeapon === 'function') {
    fireWeapon(e.data.weaponId);
  }
};
