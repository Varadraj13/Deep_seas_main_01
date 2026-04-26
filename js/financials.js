// ================================================================
//  FINANCIAL MODEL
// ================================================================
function calcTripFinancials(v) {
  const distRemaining = (1 - v.progress) * v.totalDist;
  const distTraveled = v.progress * v.totalDist;
  const totalDist = v.totalDist;
  const timeHours = totalDist / v.speed;
  const timeRemaining = distRemaining / v.speed;

  const fuelTotal = v.baseFuelRate * timeHours;
  const fuelCost = fuelTotal * CONFIG.FUEL_PRICE_PER_TON;
  const crewCost = timeHours * CONFIG.CREW_COST_PER_HOUR;
  const portFees = CONFIG.PORT_FEE_BASE * 2; // origin + destination
  const insurance = v.cargo.value * CONFIG.INSURANCE_RATE;
  const totalCost = fuelCost + crewCost + portFees + insurance;

  // Revenue: cargo delivery fee (% of cargo value) + freight rate
  const freightRevenue = v.cargo.value * 0.08; // 8% of cargo value as freight charge
  const profit = freightRevenue - totalCost;
  const profitMargin = freightRevenue > 0 ? (profit / freightRevenue * 100) : 0;
  const costPerNm = totalDist > 0 ? totalCost / totalDist : 0;
  const revenuePerNm = totalDist > 0 ? freightRevenue / totalDist : 0;
  const efficiency = costPerNm > 0 ? revenuePerNm / costPerNm : 0;

  return {
    distTraveled, distRemaining, totalDist, timeHours, timeRemaining,
    fuelTotal, fuelCost, crewCost, portFees, insurance, totalCost,
    freightRevenue, profit, profitMargin, costPerNm, revenuePerNm, efficiency
  };
}

function calcRouteFinancials(vessel, newRoute) {
  const newDist = routeLength(newRoute);
  const oldDist = vessel.totalDist;
  const oldRemaining = (1 - vessel.progress) * oldDist;

  // For new route, ship starts from current position to end of new route
  const currentPos = vessel.marker.getLatLng();
  const newRemaining = newDist; // full new route distance from drag point

  const oldTime = oldRemaining / vessel.speed;
  const newTime = newRemaining / vessel.speed;

  const oldFuel = vessel.baseFuelRate * oldTime;
  const newFuel = vessel.baseFuelRate * newTime;
  const oldFuelCost = oldFuel * CONFIG.FUEL_PRICE_PER_TON;
  const newFuelCost = newFuel * CONFIG.FUEL_PRICE_PER_TON;

  const oldCrewCost = oldTime * CONFIG.CREW_COST_PER_HOUR;
  const newCrewCost = newTime * CONFIG.CREW_COST_PER_HOUR;

  const oldTotalCost = oldFuelCost + oldCrewCost + CONFIG.PORT_FEE_BASE;
  const newTotalCost = newFuelCost + newCrewCost + CONFIG.PORT_FEE_BASE;

  const revenue = vessel.cargo.value * 0.08;
  const oldProfit = revenue - (vessel.baseFuelRate * (oldDist/vessel.speed) * CONFIG.FUEL_PRICE_PER_TON + (oldDist/vessel.speed) * CONFIG.CREW_COST_PER_HOUR + CONFIG.PORT_FEE_BASE * 2 + vessel.cargo.value * CONFIG.INSURANCE_RATE);
  const newProfit = revenue - (vessel.baseFuelRate * (newDist/vessel.speed) * CONFIG.FUEL_PRICE_PER_TON + (newDist/vessel.speed) * CONFIG.CREW_COST_PER_HOUR + CONFIG.PORT_FEE_BASE * 2 + vessel.cargo.value * CONFIG.INSURANCE_RATE);

  return {
    oldDist, newDist, distDelta: newDist - oldDist,
    oldTime, newTime, timeDelta: newTime - oldTime,
    oldFuelCost, newFuelCost, fuelDelta: newFuelCost - oldFuelCost,
    oldTotalCost, newTotalCost, costDelta: newTotalCost - oldTotalCost,
    oldProfit, newProfit, profitDelta: newProfit - oldProfit,
    revenue
  };
}

// ================================================================
//  DB RECORDING (called from sim loop)
// ================================================================
let dbRecordTimer = 0;
let dbDeliveryCount = 0;
let dbTotalRevenue = 0;
let dbTotalProfit = 0;
let dbTotalDistAll = 0;
let dbTotalFuelAll = 0;
let dbRouteChangeCount = 0;
let dbProfitHistory = [];
let dbEvents = [];
let dbProfitChart = null;

function recordDelivery(v) {
  const fin = calcTripFinancials(v);
  fin.progress = 1; // completed
  dbDeliveryCount++;
  dbTotalRevenue += fin.freightRevenue;
  dbTotalProfit += fin.profit;
  dbTotalDistAll += fin.totalDist;
  dbTotalFuelAll += fin.fuelTotal;

  const record = {
    shipId: v.id, shipName: v.name, type: v.type,
    origin: v.origin, destination: v.destination,
    cargo: v.cargo.type, cargoValue: v.cargo.value,
    distance: fin.totalDist, timeHours: fin.timeHours,
    fuelUsed: fin.fuelTotal, fuelCost: fin.fuelCost,
    revenue: fin.freightRevenue, profit: fin.profit,
    profitMargin: fin.profitMargin,
    costPerNm: fin.costPerNm, efficiency: fin.efficiency,
    timestamp: simElapsed,
    route: v.origin + ' → ' + v.destination
  };
  dbPut('deliveries', record);

  // Track per-vessel stats
  if (!v.dbStats) v.dbStats = { deliveries: 0, totalRevenue: 0, totalProfit: 0, totalDist: 0 };
  v.dbStats.deliveries++;
  v.dbStats.totalRevenue += fin.freightRevenue;
  v.dbStats.totalProfit += fin.profit;
  v.dbStats.totalDist += fin.totalDist;

  // Add event
  addDBEvent(`${v.name} delivered ${v.cargo.type} to ${v.destination} (${fin.profit >= 0 ? '+' : ''}${fmtUSD(fin.profit)})`);
}

function recordSnapshot() {
  const agg = {
    timestamp: simElapsed,
    vesselCount: vessels.length,
    totalRevenue: dbTotalRevenue,
    totalProfit: dbTotalProfit,
    totalDeliveries: dbDeliveryCount,
    avgSpeed: vessels.length ? vessels.reduce((s,v) => s + v.speed, 0) / vessels.length : 0,
    totalCargoValue: vessels.reduce((s,v) => s + v.cargo.value, 0),
  };
  dbPut('timeseries', agg);
  dbProfitHistory.push(dbTotalProfit);
  if (dbProfitHistory.length > 50) dbProfitHistory.shift();
}

function addDBEvent(text) {
  dbEvents.unshift({ text, time: simElapsed });
  if (dbEvents.length > 30) dbEvents.pop();
}
