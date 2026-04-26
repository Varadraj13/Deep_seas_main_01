// ================================================================
//  SIMULATION ENGINE
// ================================================================
let playing = true, simSpeed = 5, simElapsed = 0, warningCount = 0, simTickCount = 0;

function togglePlay() {
  playing = !playing;
  const btn = document.getElementById('btnPlay');
  btn.textContent = playing ? 'PLAY' : 'PAUSE';
  btn.classList.toggle('active', playing);
}
function stepOnce() {
  if(playing){ playing=false; document.getElementById('btnPlay').textContent='PAUSE'; document.getElementById('btnPlay').classList.remove('active'); }
  updateSim(1/60);
}
function setSpeed(val) { simSpeed=parseInt(val); document.getElementById('speedLabel').textContent=simSpeed+'X'; }

function resetSim() {
  vessels.forEach(v => map.removeLayer(v.marker));
  trailLines.forEach(l => map.removeLayer(l));
  trailLines = []; vessels = []; vesselId = 0; simElapsed = 0; warningCount = 0; simTickCount = 0;
  throughputHistory = []; densityHistory = [];
  portProcessed = {};
  // Reset DB counters
  dbDeliveryCount = 0; dbTotalRevenue = 0; dbTotalProfit = 0;
  dbTotalDistAll = 0; dbTotalFuelAll = 0; dbRouteChangeCount = 0;
  dbProfitHistory = []; dbEvents = []; dbRecordTimer = 0;
  dbClear('deliveries'); dbClear('routeChanges'); dbClear('timeseries'); dbClear('snapshots');
  addDBEvent('Simulation reset');
  // Cancel any active drag
  if (dragMode) { cancelDrag(); toggleDragMode(); }
  initVessels();
  updateFilterDropdowns();
}

function addRandomVessel() {
  createVessel({ progress: Math.random() < 0.5 ? 0 : Math.random() * 0.3 });
  updateFilterDropdowns();
  updateStats();
}
function removeLastVessel() {
  if(!vessels.length) return;
  const v = vessels.pop();
  map.removeLayer(v.marker);
  if (selectedShipId === v.id) closeShipPanel();
}

// Port processing tracking
let portProcessed = {};

function updateSim(dtReal) {
  const dtSim = dtReal * simSpeed;
  const dtHours = dtSim / 60;
  simElapsed += dtSim;
  simTickCount++;

  let activeWarnings = 0;
  const heatPoints = [];

  for (let i = vessels.length - 1; i >= 0; i--) {
    const v = vessels[i];
    const rLen = v.totalDist;
    if (!rLen || isNaN(rLen) || rLen <= 0) { v.totalDist = routeLength(v.route) || 100; continue; }
    if (isNaN(v.speed) || v.speed <= 0) { v.speed = 12; }
    const progressDelta = (v.speed * dtHours) / rLen;
    if (isNaN(progressDelta)) continue;
    const oldProgress = v.progress;
    v.progress += progressDelta;

    // Fuel & emissions accumulation
    const fuelUsed = v.baseFuelRate * dtHours;
    v.totalFuelConsumed += fuelUsed;
    v.totalCO2 += v.co2Rate * dtHours;
    v.distanceTraveled = v.progress * rLen;

    // Speed variation (slight random walk)
    v.speed += (Math.random() - 0.5) * 0.05;
    v.speed = Math.max(v.maxSpeed * 0.6, Math.min(v.maxSpeed * 1.05, v.speed));

    // Record speed history
    if (v.speedHistory.length > 60) v.speedHistory.shift();
    v.speedHistory.push(v.speed);

    if (v.progress >= 1) {
      // Record delivery in DB BEFORE respawning
      recordDelivery(v);

      // Track port processing
      const destPort = ports.find(p => p.name === v.destination);
      if (destPort) {
        const key = destPort.name;
        if (!portProcessed[key]) portProcessed[key] = { count: 0, value: 0, cargo: {} };
        portProcessed[key].count++;
        portProcessed[key].value += v.cargo.value;
        portProcessed[key].cargo[v.cargo.type] = (portProcessed[key].cargo[v.cargo.type] || 0) + v.cargo.qty;
      }

      // Respawn
      v.route = randEl(ROUTES);
      v.totalDist = routeLength(v.route);
      v.progress = 0;
      v.trail = [];
      v.origin = randEl(ORIGINS);
      v.destination = randEl(DESTINATIONS);
      v.distanceTraveled = 0;
      v.totalFuelConsumed = 0;
      v.totalCO2 = 0;
      v.speedHistory = [];
      // New cargo
      const cargoOptions = CARGO_DB[v.type];
      const ci = randEl(cargoOptions);
      v.cargo = { type: ci.cargo, unit: ci.unit, qty: randInt(ci.qtyRange[0], ci.qtyRange[1]),
                  value: 0, hazmat: ci.hazmat, classification: ci.class, category: ci.category, valuePerUnit: ci.valuePerUnit };
      v.cargo.value = v.cargo.qty * v.cargo.valuePerUnit;
      v.loadFactor = 0.55 + Math.random() * 0.4;
    }

    const pos = positionOnRoute(v.route, v.progress);
    if (isNaN(pos.lat) || isNaN(pos.lng)) { v.progress = 0; continue; }
    v.marker.setLatLng([pos.lat, pos.lng]);
    heatPoints.push([pos.lat, pos.lng, 0.6]);

    const el = document.getElementById('ship-icon-' + v.id);
    if (el) {
      const spdEl = el.querySelector('.vdc-speed');
      if (spdEl) spdEl.textContent = v.speed.toFixed(1) + ' KN // ' + Math.round(pos.bearing) + '\u00B0';
    }

    if (showTrails) {
      v.trail.push([pos.lat, pos.lng]);
      if (v.trail.length > 200) v.trail.shift();
    }
  }

  // Collision detection
  for (let i=0; i<vessels.length; i++) {
    for (let j=i+1; j<vessels.length; j++) {
      const a=vessels[i].marker.getLatLng(), b=vessels[j].marker.getLatLng();
      if(dist([a.lat,a.lng],[b.lat,b.lng]) < CONFIG.COLLISION_DIST_NM) activeWarnings++;
    }
  }
  warningCount = activeWarnings;
  document.getElementById('collisionWarning').style.display = activeWarnings > 0 ? 'block' : 'none';

  // Trails
  if (showTrails) {
    trailLines.forEach(l => map.removeLayer(l));
    trailLines = [];
    vessels.forEach(v => {
      if(v.trail.length > 1) trailLines.push(L.polyline(v.trail, { color: '#cc0000', weight: 1, opacity: 0.3 }).addTo(map));
    });
  }

  // Heatmap update
  if (heatmapVisible && heatPoints.length) updateHeatmap(heatPoints);

  // Update ship panel if open
  if (selectedShipId !== null) updateShipPanelLive();

  // Analytics data collection (every ~5 sim-seconds)
  analyticsTimer += dtSim;
  if (analyticsTimer > 5) {
    analyticsTimer = 0;
    recordAnalytics();
  }

  // DB snapshot recording (every ~15 sim-seconds)
  dbRecordTimer += dtSim;
  if (dbRecordTimer > 15) {
    dbRecordTimer = 0;
    recordSnapshot();
    if (dbPanelOpen) updateDBPanel();
  }

  updateStats();
  updateEnvTab();
  updateEconTab();
}

// ================================================================
//  STATS & TABS
// ================================================================
function updateStats() {
  document.getElementById('vesselCount').textContent = vessels.length;
  const hrs = Math.floor(simElapsed / 3600), mins = Math.floor((simElapsed % 3600) / 60);
  document.getElementById('simTime').textContent = String(hrs).padStart(2,'0')+':'+String(mins).padStart(2,'0');
  if(vessels.length) {
    document.getElementById('avgSpeed').textContent = (vessels.reduce((s,v)=>s+v.speed,0)/vessels.length).toFixed(1);
  } else document.getElementById('avgSpeed').textContent = '0';
  document.getElementById('warnings').textContent = warningCount;
  // Status bar update
  var sbTick = document.getElementById('sbTick');
  var sbVessels = document.getElementById('sbVessels');
  var sbFlow = document.getElementById('sbFlow');
  if (sbTick) sbTick.textContent = 'SIM TICK ' + String(simTickCount).padStart(4, '0');
  if (sbVessels) sbVessels.textContent = 'VESSELS ' + vessels.length;
  var flowPct = vessels.length ? Math.min(100, Math.round((vessels.reduce(function(s,v){return s+v.speed;},0) / vessels.length / 15) * 100)) : 0;
  if (sbFlow) sbFlow.textContent = '// MALACCA FLOW ' + flowPct + '%';
}

function updateEnvTab() {
  const totals = vessels.reduce((acc,v) => {
    acc.co2 += v.totalCO2; acc.fuel += v.totalFuelConsumed;
    acc.sox += v.soxRate * (v.distanceTraveled / v.speed || 0);
    acc.nox += v.noxRate * (v.distanceTraveled / v.speed || 0);
    if (!acc.byFuel[v.fuelType]) acc.byFuel[v.fuelType] = 0;
    acc.byFuel[v.fuelType] += v.totalFuelConsumed;
    return acc;
  }, { co2:0, sox:0, nox:0, fuel:0, byFuel:{} });
  document.getElementById('envCO2').textContent = fmtNum(totals.co2) + ' t';
  document.getElementById('envSOx').textContent = fmtNum(totals.sox) + ' t';
  document.getElementById('envNOx').textContent = fmtNum(totals.nox) + ' t';
  document.getElementById('envFuel').textContent = fmtNum(totals.fuel) + ' t';

  const fbDiv = document.getElementById('envFuelBreakdown');
  const maxFuel = Math.max(...Object.values(totals.byFuel), 1);
  fbDiv.innerHTML = Object.entries(totals.byFuel).sort((a,b)=>b[1]-a[1]).map(([f,v]) =>
    `<div class="pp-commodity-bar">
      <div class="pp-commodity-label">${f}</div>
      <div class="pp-commodity-fill" style="width:${(v/maxFuel)*100}px;background:#cc0000"></div>
      <div class="pp-commodity-val">${fmtNum(v)}t</div>
    </div>`
  ).join('');
}

function updateEconTab() {
  const totalValue = vessels.reduce((s,v) => s + v.cargo.value, 0);
  const totalTEU = vessels.filter(v=>v.cargo.unit==='TEU').reduce((s,v)=>s+v.cargo.qty, 0);
  const totalOil = vessels.filter(v=>v.cargo.unit==='barrels').reduce((s,v)=>s+v.cargo.qty, 0);
  document.getElementById('econTotal').textContent = fmtUSD(totalValue);
  document.getElementById('econTEU').textContent = fmtNum(totalTEU);
  document.getElementById('econOil').textContent = fmtNum(totalOil);

  // Top corridors
  const corridors = {};
  vessels.forEach(v => {
    const key = v.origin + ' → ' + v.destination;
    if (!corridors[key]) corridors[key] = { count: 0, value: 0 };
    corridors[key].count++;
    corridors[key].value += v.cargo.value;
  });
  const topCorr = Object.entries(corridors).sort((a,b) => b[1].value - a[1].value).slice(0, 5);
  const maxCorrVal = topCorr.length ? topCorr[0][1].value : 1;
  document.getElementById('econCorridors').innerHTML = topCorr.map(([name, data]) =>
    `<div class="pp-commodity-bar">
      <div class="pp-commodity-label" style="min-width:120px;font-size:9px">${name}</div>
      <div class="pp-commodity-fill" style="width:${(data.value/maxCorrVal)*80}px;background:#a855f7"></div>
      <div class="pp-commodity-val" style="font-size:9px">${fmtUSD(data.value)}</div>
    </div>`
  ).join('');
}

// ================================================================
//  DISPLAY TOGGLES
// ================================================================
let showTrails = false, trailLines = [], nightMode = false;
let routeLinesVisible = true, heatmapVisible = false;
let heatLayer = null;

function toggleNight() { nightMode=!nightMode; document.body.classList.toggle('night-mode',nightMode); document.getElementById('btnNight').classList.toggle('active',nightMode); }
function toggleTrails() {
  showTrails=!showTrails; document.getElementById('btnTrails').classList.toggle('active',showTrails);
  if(!showTrails){ trailLines.forEach(l=>map.removeLayer(l)); trailLines=[]; vessels.forEach(v=>v.trail=[]); }
}
function toggleRoutes() {
  routeLinesVisible = !routeLinesVisible;
  document.getElementById('btnRoutes').classList.toggle('active', routeLinesVisible);
  if (routeLinesVisible) { routeLayerNW.addTo(map); routeLayerSE.addTo(map); }
  else { map.removeLayer(routeLayerNW); map.removeLayer(routeLayerSE); }
}

// Simple canvas-based heatmap (no extra library)
let heatCanvas = null, heatCtx = null;
function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  document.getElementById('btnHeat').classList.toggle('active', heatmapVisible);
  document.getElementById('heatLegend').classList.toggle('show', heatmapVisible);
  if (!heatmapVisible && heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
}

function updateHeatmap(points) {
  if (heatLayer) map.removeLayer(heatLayer);
  // Use circle markers as a simple heat effect
  const group = L.layerGroup();
  points.forEach(([lat, lng, intensity]) => {
    L.circleMarker([lat, lng], {
      radius: 18, fillColor: '#ff4500', fillOpacity: 0.12,
      stroke: false, interactive: false
    }).addTo(group);
  });
  heatLayer = group;
  heatLayer.addTo(map);
}
