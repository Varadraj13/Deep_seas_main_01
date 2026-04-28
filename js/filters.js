// ================================================================
//  PHASE 6: FILTERING & EXPORT
// ================================================================
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

function updateFilterDropdowns() {
  const flags = [...new Set(vessels.map(v => v.flag.country))].sort();
  const origins = [...new Set(vessels.map(v => v.origin))].sort();
  const dests = [...new Set(vessels.map(v => v.destination))].sort();

  const fFlag = document.getElementById('filterFlag');
  const fOrig = document.getElementById('filterOrigin');
  const fDest = document.getElementById('filterDest');

  const rebuild = (sel, items, label) => {
    const val = sel.value;
    sel.innerHTML = `<option value="">All ${label}</option>` + items.map(i => `<option value="${i}">${i}</option>`).join('');
    sel.value = val;
  };
  rebuild(fFlag, flags, 'Flags');
  rebuild(fOrig, origins, 'Origins');
  rebuild(fDest, dests, 'Dest');
}

function applyFilters() {
  const typeF = document.getElementById('filterType').value;
  const flagF = document.getElementById('filterFlag').value;
  const origF = document.getElementById('filterOrigin').value;
  const destF = document.getElementById('filterDest').value;
  const search = document.getElementById('searchVessel').value.toLowerCase();

  let shown = 0, hidden = 0;
  vessels.forEach(v => {
    let visible = true;
    if (typeF && v.type !== typeF) visible = false;
    if (flagF && v.flag.country !== flagF) visible = false;
    if (origF && v.origin !== origF) visible = false;
    if (destF && v.destination !== destF) visible = false;
    if (search && !v.name.toLowerCase().includes(search) && !v.imo.toLowerCase().includes(search)) visible = false;

    if (visible) { if (!map.hasLayer(v.marker)) v.marker.addTo(map); shown++; }
    else { if (map.hasLayer(v.marker)) map.removeLayer(v.marker); hidden++; }
  });
  document.getElementById('filterResults').textContent = `Showing ${shown} of ${vessels.length} vessels` + (hidden ? ` (${hidden} hidden)` : '');
}

function exportJSON() {
  const data = vessels.map(v => ({
    id: v.id, name: v.name, imo: v.imo, type: v.type, flag: v.flag.country,
    owner: v.owner, callSign: v.callSign, mmsi: v.mmsi,
    specs: { dwt: v.dwt, length: v.sizeMeter, beam: v.beam, draft: v.draft, maxSpeed: v.maxSpeed, fuelType: v.fuelType },
    cargo: v.cargo, origin: v.origin, destination: v.destination,
    position: { lat: v.marker.getLatLng().lat, lng: v.marker.getLatLng().lng },
    speed: v.speed, progress: v.progress, loadFactor: v.loadFactor,
    emissions: { co2Rate: v.co2Rate, totalCO2: v.totalCO2, fuelConsumed: v.totalFuelConsumed }
  }));
  downloadFile(JSON.stringify(data, null, 2), 'hormuz_vessels.json', 'application/json');
  document.getElementById('exportStatus').textContent = 'JSON exported (' + data.length + ' vessels)';
}

function exportCSV() {
  const headers = ['ID','Name','IMO','Type','Flag','Owner','DWT','Length','Beam','Draft','Speed','MaxSpeed','FuelType','Cargo','CargoQty','CargoUnit','CargoValue','Hazmat','Origin','Destination','Lat','Lng','Progress','LoadFactor','CO2_Total','FuelConsumed'];
  const rows = vessels.map(v => {
    const pos = v.marker.getLatLng();
    return [v.id,v.name,v.imo,v.type,v.flag.country,v.owner,v.dwt,v.sizeMeter,v.beam,v.draft,v.speed.toFixed(1),v.maxSpeed,v.fuelType,v.cargo.type,v.cargo.qty,v.cargo.unit,v.cargo.value,v.cargo.hazmat,v.origin,v.destination,pos.lat.toFixed(4),pos.lng.toFixed(4),(v.progress*100).toFixed(1),v.loadFactor.toFixed(2),v.totalCO2.toFixed(2),v.totalFuelConsumed.toFixed(2)];
  });
  const csv = [headers.join(','), ...rows.map(r => r.map(c => typeof c === 'string' && c.includes(',') ? '"'+c+'"' : c).join(','))].join('\n');
  downloadFile(csv, 'hormuz_vessels.csv', 'text/csv');
  document.getElementById('exportStatus').textContent = 'CSV exported (' + rows.length + ' vessels)';
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function saveState() {
  const state = {
    simElapsed, simSpeed, vessels: vessels.map(v => ({
      id: v.id, name: v.name, type: v.type, speed: v.speed, imo: v.imo,
      origin: v.origin, destination: v.destination, progress: v.progress,
      flag: v.flag, owner: v.owner, callSign: v.callSign, mmsi: v.mmsi,
      fuelType: v.fuelType, dwt: v.dwt, beam: v.beam, draft: v.draft,
      sizeMeter: v.sizeMeter, cargo: v.cargo, loadFactor: v.loadFactor,
      totalFuelConsumed: v.totalFuelConsumed, totalCO2: v.totalCO2,
      routeIndex: ROUTES.indexOf(v.route) >= 0 ? ROUTES.indexOf(v.route) : 0
    }))
  };
  localStorage.setItem('hormuz_sim_state', JSON.stringify(state));
  document.getElementById('exportStatus').textContent = 'State saved to localStorage';
}

function loadState() {
  const raw = localStorage.getItem('hormuz_sim_state');
  if (!raw) { document.getElementById('exportStatus').textContent = 'No saved state found'; return; }
  const state = JSON.parse(raw);

  vessels.forEach(v => map.removeLayer(v.marker));
  trailLines.forEach(l => map.removeLayer(l));
  trailLines = []; vessels = []; vesselId = 0;
  simElapsed = state.simElapsed;
  simSpeed = state.simSpeed;
  document.getElementById('speedSlider').value = simSpeed;
  setSpeed(simSpeed);

  state.vessels.forEach(sv => {
    createVessel({
      type: sv.type, route: ROUTES[sv.routeIndex] || ROUTES[0],
      progress: sv.progress, origin: sv.origin, destination: sv.destination
    });
  });

  updateFilterDropdowns();
  document.getElementById('exportStatus').textContent = 'State loaded (' + vessels.length + ' vessels)';
}
