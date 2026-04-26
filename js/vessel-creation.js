// ================================================================
//  VESSEL CREATION (Phase 1 - Enhanced)
// ================================================================
let vessels = [];
let vesselId = 0;

function generateCallSign() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[randInt(0,26)] + letters[randInt(0,26)] + letters[randInt(0,26)] + letters[randInt(0,26)];
}

function createVessel(opts = {}) {
  const types = Object.keys(SHIP_TYPES);
  const type = opts.type || randEl(types);
  const cfg = SHIP_TYPES[type];
  const route = opts.route || randEl(ROUTES);
  const speed = _lerpVal(cfg.speed[0], cfg.speed[1], Math.random());
  const sizeMeter = Math.floor(_lerpVal(cfg.size[0], cfg.size[1], Math.random()));
  const progress = opts.progress != null ? opts.progress : Math.random() * 0.85;
  const name = randEl(SHIP_NAMES_PREFIX) + ' ' + randEl(SHIP_NAMES_SUFFIX);
  const origin = opts.origin || randEl(ORIGINS);
  const destination = opts.destination || randEl(DESTINATIONS);
  const imo = 'IMO ' + (9100000 + randInt(0, 900000));
  const flag = randEl(FLAGS);
  const owner = randEl(OWNERS);
  const fuelType = type === 'lng' ? 'LNG' : randEl(FUEL_TYPES);
  const dwt = randInt(cfg.dwtRange[0], cfg.dwtRange[1]);
  const beam = _lerpVal(cfg.beamRange[0], cfg.beamRange[1], Math.random()).toFixed(1);
  const draft = _lerpVal(cfg.draftRange[0], cfg.draftRange[1], Math.random()).toFixed(1);
  const callSign = generateCallSign();
  const mmsi = ''+randInt(200000000, 799999999);

  // Cargo
  const cargoOptions = CARGO_DB[type];
  const cargoInfo = randEl(cargoOptions);
  const cargoQty = randInt(cargoInfo.qtyRange[0], cargoInfo.qtyRange[1]);
  const cargoValue = cargoQty * cargoInfo.valuePerUnit;
  const loadFactor = 0.55 + Math.random() * 0.4;

  // Fuel consumption & emissions (simplified model)
  const baseFuelRate = (dwt / 50000) * (speed / 14) * 1.8; // tons/hr approx
  const co2Rate = baseFuelRate * 3.114; // tons CO2 per ton fuel
  const soxRate = baseFuelRate * (fuelType === 'VLSFO' ? 0.005 : fuelType === 'LNG' ? 0.0001 : 0.025);
  const noxRate = baseFuelRate * 0.08;

  // Waypoints for route
  const numWaypoints = 3 + randInt(0, 4);
  const wpIndices = [];
  for (let i = 0; i < numWaypoints; i++) wpIndices.push(i / (numWaypoints - 1));
  const waypoints = wpIndices.map((frac, i) => ({
    name: i === 0 ? origin : i === numWaypoints - 1 ? destination : randEl(WAYPOINT_NAMES),
    progress: frac,
    eta: null // computed live
  }));

  const totalDist = routeLength(route);
  const pos = positionOnRoute(route, progress);
  const markerSize = Math.max(8, Math.min(14, sizeMeter / 25));

  const _pulseDelay = vesselId * 137;
  const icon = L.divIcon({
    className: '',
    html: `<div class="vessel-cross" id="ship-icon-${vesselId}" style="animation-delay:${_pulseDelay}ms"><div class="cross-h" style="animation-delay:${_pulseDelay}ms"></div><div class="cross-v" style="animation-delay:${_pulseDelay}ms"></div><div class="vessel-datacard"><div class="vdc-name">${name}</div><div class="vdc-type">${cfg.label} // ${typeof flag === 'object' ? flag.code : flag}</div><div class="vdc-speed">${speed.toFixed(1)} KN // ${Math.round(pos.bearing)}°</div><div class="vdc-imo">IMO: ${imo}</div></div></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6]
  });

  const marker = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 500 }).addTo(map);

  const v = {
    id: vesselId++, name, type, speed, maxSpeed: cfg.speed[1], sizeMeter, imo, origin, destination,
    route, progress, color: cfg.color, label: cfg.label,
    marker, trail: [], markerSize,
    // Phase 1 additions
    flag, owner, callSign, mmsi, fuelType, dwt, beam: parseFloat(beam), draft: parseFloat(draft),
    cargo: { type: cargoInfo.cargo, unit: cargoInfo.unit, qty: cargoQty, value: cargoValue,
             hazmat: cargoInfo.hazmat, classification: cargoInfo.class, category: cargoInfo.category,
             valuePerUnit: cargoInfo.valuePerUnit },
    loadFactor,
    baseFuelRate, co2Rate, soxRate, noxRate,
    waypoints, totalDist,
    speedHistory: [],
    totalFuelConsumed: 0, totalCO2: 0,
    distanceTraveled: progress * totalDist,
  };

  marker.on('click', (e) => { L.DomEvent.stopPropagation(e); openShipPanel(v.id); });
  marker.bindTooltip(v.name, { direction: 'top', offset: [0, -12] });

  // Init DB tracking
  v.dbStats = { deliveries: 0, totalRevenue: 0, totalProfit: 0, totalDist: 0 };

  // If drag mode is on, enable dragging on new vessels
  if (dragMode) {
    marker.dragging.enable();
    marker.on('dragstart', onShipDragStart);
    marker.on('drag', onShipDrag);
    marker.on('dragend', onShipDragEnd);
  }

  vessels.push(v);
  return v;
}
