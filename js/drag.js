// ================================================================
//  INTERACTIVE SHIP DRAGGING
// ================================================================
let dragMode = false;
let draggingVessel = null;
let dragPreviewLine = null;
let dragOldRouteLine = null;
let dragNewRoute = null;
let dragFinancials = null;
let dragOriginalPos = null;
let dragWasPaused = false;

function toggleDragMode() {
  dragMode = !dragMode;
  document.getElementById('btnDrag').classList.toggle('active', dragMode);

  vessels.forEach(v => {
    if (dragMode) {
      v.marker.dragging.enable();
      v.marker.on('dragstart', onShipDragStart);
      v.marker.on('drag', onShipDrag);
      v.marker.on('dragend', onShipDragEnd);
    } else {
      v.marker.dragging.disable();
      v.marker.off('dragstart', onShipDragStart);
      v.marker.off('drag', onShipDrag);
      v.marker.off('dragend', onShipDragEnd);
      cancelDrag();
    }
  });
}

function onShipDragStart(e) {
  const marker = e.target;
  draggingVessel = vessels.find(v => v.marker === marker);
  if (!draggingVessel) return;

  dragOriginalPos = { lat: marker.getLatLng().lat, lng: marker.getLatLng().lng };
  dragWasPaused = !playing;
  if (playing) togglePlay(); // pause during drag

  // Show old route
  const oldPos = positionOnRoute(draggingVessel.route, draggingVessel.progress);
  const remainingRoute = [];
  for (let p = draggingVessel.progress; p <= 1; p += 0.02) {
    const pt = positionOnRoute(draggingVessel.route, Math.min(p, 1));
    remainingRoute.push([pt.lat, pt.lng]);
  }
  dragOldRouteLine = L.polyline(remainingRoute, {
    color: '#444444', weight: 2.5, opacity: 0.6, dashArray: '6,4'
  }).addTo(map);

  document.getElementById('dragOverlay').classList.add('show');
}

function onShipDrag(e) {
  if (!draggingVessel) return;
  const newLatLng = e.target.getLatLng();

  // Build new route: from drag position through remaining waypoints to destination
  const destRoute = draggingVessel.route;
  const destPoint = destRoute[destRoute.length - 1];

  // Create a route from current drag position to the destination
  const newRoute = buildRouteThrough(newLatLng, destPoint);
  dragNewRoute = newRoute;

  // Draw preview line
  if (dragPreviewLine) map.removeLayer(dragPreviewLine);
  dragPreviewLine = L.polyline(newRoute.map(p => [p[0], p[1]]), {
    color: '#cc0000', weight: 1, opacity: 0.8, dashArray: '4,4',
    className: 'drag-route-preview'
  }).addTo(map);

  // Calculate financials
  dragFinancials = calcRouteFinancials(draggingVessel, newRoute);
  updateDragOverlay(dragFinancials);
}

function onShipDragEnd(e) {
  // Keep overlay showing with confirm/cancel buttons - don't auto-commit
}

function buildRouteThrough(start, end) {
  // Generate intermediate waypoints between start and destination
  const steps = 8;
  const route = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + (end[0] - start.lat) * t;
    const lng = start.lng + (end[1] - start.lng) * t;
    // Add slight curve to make it look like a realistic shipping route
    const curve = Math.sin(t * Math.PI) * 0.15 * (Math.random() - 0.3);
    route.push([lat + curve, lng + curve * 0.5]);
  }
  return route;
}

function updateDragOverlay(fin) {
  const fmt = (n) => n.toFixed(0);
  const fmtH = (h) => h.toFixed(1) + 'h';
  const cls = (delta) => delta <= 0 ? 'drag-better' : 'drag-worse';

  document.getElementById('dragOldDist').textContent = fmt(fin.oldDist) + ' nm';
  document.getElementById('dragNewDist').innerHTML = `<span class="${cls(fin.distDelta)}">${fmt(fin.newDist)} nm</span>`;

  document.getElementById('dragOldTime').textContent = fmtH(fin.oldTime);
  document.getElementById('dragNewTime').innerHTML = `<span class="${cls(fin.timeDelta)}">${fmtH(fin.newTime)}</span>`;

  document.getElementById('dragOldFuel').textContent = fmtUSD(fin.oldFuelCost);
  document.getElementById('dragNewFuel').innerHTML = `<span class="${cls(fin.fuelDelta)}">${fmtUSD(fin.newFuelCost)}</span>`;

  document.getElementById('dragOldProfit').textContent = fmtUSD(fin.oldProfit);
  document.getElementById('dragNewProfit').innerHTML = `<span class="${cls(-fin.profitDelta)}">${fmtUSD(fin.newProfit)}</span>`;

  const netEl = document.getElementById('dragNetImpact');
  const net = fin.profitDelta;
  netEl.innerHTML = `<span class="${net >= 0 ? 'drag-better' : 'drag-worse'}">${net >= 0 ? '+' : ''}${fmtUSD(net)} ${net >= 0 ? '(Better)' : '(Worse)'}</span>`;
}

function confirmDrag() {
  if (!draggingVessel || !dragNewRoute) { cancelDrag(); return; }

  // Apply the new route
  const v = draggingVessel;
  v.route = dragNewRoute;
  v.totalDist = routeLength(dragNewRoute);
  v.progress = 0;
  v.trail = [];
  v.distanceTraveled = 0;

  // Record route change in DB
  dbRouteChangeCount++;
  const record = {
    shipId: v.id, shipName: v.name, timestamp: simElapsed,
    oldDist: dragFinancials.oldDist, newDist: dragFinancials.newDist,
    profitImpact: dragFinancials.profitDelta,
    from: { lat: dragOriginalPos.lat, lng: dragOriginalPos.lng },
    to: { lat: v.marker.getLatLng().lat, lng: v.marker.getLatLng().lng }
  };
  dbPut('routeChanges', record);
  addDBEvent(`Route changed for ${v.name}: ${dragFinancials.profitDelta >= 0 ? '+' : ''}${fmtUSD(dragFinancials.profitDelta)} impact`);

  const profitDelta = dragFinancials.profitDelta;

  cleanupDrag();
  if (!dragWasPaused) togglePlay(); // resume

  const shiftResults = shiftMarkets(profitDelta);
  renderKalshiOverlay(shiftResults);
}

function cancelDrag() {
  if (draggingVessel && dragOriginalPos) {
    draggingVessel.marker.setLatLng([dragOriginalPos.lat, dragOriginalPos.lng]);
  }
  cleanupDrag();
  if (!dragWasPaused && !playing) togglePlay(); // resume
}

function cleanupDrag() {
  if (dragPreviewLine) { map.removeLayer(dragPreviewLine); dragPreviewLine = null; }
  if (dragOldRouteLine) { map.removeLayer(dragOldRouteLine); dragOldRouteLine = null; }
  document.getElementById('dragOverlay').classList.remove('show');
  document.getElementById('kalshiOverlay').classList.remove('show');
  draggingVessel = null;
  dragNewRoute = null;
  dragFinancials = null;
  dragOriginalPos = null;
}
