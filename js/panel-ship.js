// ================================================================
//  PHASE 2: SHIP DETAIL PANEL
// ================================================================
let selectedShipId = null;
let spSpeedChart = null, spCargoChart = null;

function _setShipSelected(id, sel) {
  var v = vessels.find(function(x) { return x.id === id; });
  if (!v) return;
  var el = document.getElementById('ship-icon-' + v.id);
  if (el) { if (sel) el.classList.add('selected'); else el.classList.remove('selected'); }
}

function openShipPanel(id) {
  if (selectedShipId !== null) _setShipSelected(selectedShipId, false);
  selectedShipId = id;
  _setShipSelected(id, true);
  document.getElementById('shipPanel').classList.add('open');
  document.getElementById('portPanel').classList.remove('open');
  updateShipPanelFull();
}

function closeShipPanel() {
  if (selectedShipId !== null) _setShipSelected(selectedShipId, false);
  selectedShipId = null;
  document.getElementById('shipPanel').classList.remove('open');
  if (spSpeedChart) { spSpeedChart.destroy(); spSpeedChart = null; }
  if (spCargoChart) { spCargoChart.destroy(); spCargoChart = null; }
}

function updateShipPanelFull() {
  const v = vessels.find(x => x.id === selectedShipId);
  if (!v) return;
  const colors = { tanker:'#ef4444', container:'#3b82f6', cargo:'#22c55e', bulk:'#a855f7', lng:'#f59e0b' };

  document.getElementById('spName').textContent = v.name;
  document.getElementById('spBadge').textContent = v.label;
  document.getElementById('spBadge').style.background = 'transparent';
  document.getElementById('spImo').textContent = v.imo + ' // ' + v.flag.country + ' (' + v.flag.code + ')';

  // Identity
  document.getElementById('spFlag').textContent = v.flag.country + ' ' + v.flag.code;
  document.getElementById('spOwner').textContent = v.owner;
  document.getElementById('spCallSign').textContent = v.callSign;
  document.getElementById('spMMSI').textContent = v.mmsi;

  // Technical
  document.getElementById('spDWT').textContent = fmtNum(v.dwt) + ' t';
  document.getElementById('spLength').textContent = v.sizeMeter + ' m';
  document.getElementById('spBeam').textContent = v.beam + ' m';
  document.getElementById('spDraft').textContent = v.draft + ' m';
  document.getElementById('spMaxSpeed').textContent = v.maxSpeed + ' kn';
  document.getElementById('spFuelType').textContent = v.fuelType;

  // Cargo
  document.getElementById('spCargoType').textContent = v.cargo.type;
  document.getElementById('spCargoQty').textContent = fmtNum(v.cargo.qty) + ' ' + v.cargo.unit;
  document.getElementById('spCargoValue').textContent = fmtUSD(v.cargo.value);
  document.getElementById('spHazmat').textContent = v.cargo.hazmat ? 'YES - HAZMAT' : 'None';
  document.getElementById('spHazmat').className = 'sp-field-value' + (v.cargo.hazmat ? ' hazmat' : '');
  document.getElementById('spCargoClass').textContent = v.cargo.classification;
  document.getElementById('spLoadBar').style.width = (v.loadFactor * 100) + '%';
  document.getElementById('spLoadBar').style.background = '#cc0000';

  // Route
  document.getElementById('spOrigin').textContent = v.origin;
  document.getElementById('spDest').textContent = v.destination;

  // Build timeline
  const tl = document.getElementById('spTimeline');
  tl.innerHTML = v.waypoints.map((wp, i) => {
    const cls = v.progress >= wp.progress ? (v.progress > wp.progress + 0.05 ? 'done' : 'active') : '';
    return `<div class="sp-route-wp ${cls}"><strong>${wp.name}</strong><br><span style="color:#444444;font-size:10px">${(wp.progress*100).toFixed(0)}% of route</span></div>`;
  }).join('');

  // Create charts
  initShipCharts(v);
  updateShipPanelLive();
}

function updateShipPanelLive() {
  const v = vessels.find(x => x.id === selectedShipId);
  if (!v) return;
  const pos = positionOnRoute(v.route, v.progress);

  document.getElementById('spSpeed').textContent = v.speed.toFixed(1);
  document.getElementById('spHeading').textContent = pos.bearing.toFixed(0) + '\u00B0';
  document.getElementById('spFuelRate').textContent = v.baseFuelRate.toFixed(2);

  const distTrav = v.progress * v.totalDist;
  const distRem = (1 - v.progress) * v.totalDist;
  const etaHours = distRem / v.speed;
  document.getElementById('spDistTrav').textContent = distTrav.toFixed(0) + ' nm';
  document.getElementById('spDistRem').textContent = distRem.toFixed(0) + ' nm';
  document.getElementById('spETA').textContent = etaHours.toFixed(1) + ' hrs';
  document.getElementById('spProgress').textContent = (v.progress * 100).toFixed(1) + '%';

  // Emissions
  document.getElementById('spCO2').textContent = v.co2Rate.toFixed(2) + ' t';
  document.getElementById('spSOx').textContent = v.soxRate.toFixed(3) + ' t';
  document.getElementById('spNOx').textContent = v.noxRate.toFixed(3) + ' t';
  document.getElementById('spTripCO2').textContent = v.totalCO2.toFixed(1) + ' t';

  // Update speed chart data
  if (spSpeedChart && v.speedHistory.length > 1) {
    spSpeedChart.data.labels = v.speedHistory.map((_,i) => i);
    spSpeedChart.data.datasets[0].data = v.speedHistory;
    spSpeedChart.update('none');
  }
}

function initShipCharts(v) {
  if (spSpeedChart) spSpeedChart.destroy();
  if (spCargoChart) spCargoChart.destroy();

  const ctxSpeed = document.getElementById('spSpeedChart').getContext('2d');
  spSpeedChart = new Chart(ctxSpeed, {
    type: 'line',
    data: { labels: v.speedHistory.map((_,i)=>i), datasets: [{ data: v.speedHistory, borderColor: '#cc0000', borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true, ticks: { color: '#444444', font: { size: 9 } }, grid: { color: '#111111' } } } }
  });

  // Cargo breakdown doughnut
  const ctxCargo = document.getElementById('spCargoChart').getContext('2d');
  spCargoChart = new Chart(ctxCargo, {
    type: 'doughnut',
    data: {
      labels: ['Loaded (' + (v.loadFactor*100).toFixed(0) + '%)', 'Available'],
      datasets: [{ data: [v.loadFactor*100, (1-v.loadFactor)*100], backgroundColor: ['#cc0000', '#1a1a1a'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { color: '#666666', font: { size: 10 }, boxWidth: 10 } } }, cutout: '65%' }
  });
}
