// ================================================================
//  DATABASE STATS PANEL
// ================================================================
let dbPanelOpen = false;

function toggleDBPanel() {
  dbPanelOpen = !dbPanelOpen;
  document.getElementById('dbStatsPanel').classList.toggle('show', dbPanelOpen);
  document.getElementById('btnDB').classList.toggle('active', dbPanelOpen);
  if (dbPanelOpen) updateDBPanel();
}

function updateDBPanel() {
  if (!dbPanelOpen) return;

  document.getElementById('dbTotalRev').textContent = fmtUSD(dbTotalRevenue);
  const profitEl = document.getElementById('dbTotalProfit');
  profitEl.textContent = (dbTotalProfit >= 0 ? '+' : '') + fmtUSD(dbTotalProfit);
  profitEl.style.color = dbTotalProfit >= 0 ? '#ffffff' : '#cc0000';

  document.getElementById('dbDeliveries').textContent = dbDeliveryCount;
  document.getElementById('dbTotalDist').textContent = fmtNum(dbTotalDistAll);
  document.getElementById('dbTotalFuelDB').textContent = fmtNum(dbTotalFuelAll);
  document.getElementById('dbRouteChanges').textContent = dbRouteChangeCount;

  // Avg efficiency & cost/nm
  if (dbDeliveryCount > 0) {
    document.getElementById('dbEfficiency').textContent = (dbTotalRevenue / Math.max(dbTotalRevenue - dbTotalProfit, 1)).toFixed(2) + 'x';
    document.getElementById('dbCostPerNm').textContent = '$' + ((dbTotalRevenue - dbTotalProfit) / Math.max(dbTotalDistAll, 1)).toFixed(0);
    document.getElementById('dbRevPerRoute').textContent = fmtUSD(dbTotalRevenue / dbDeliveryCount);
  }

  // Top performing ships (by profit)
  const shipStats = [];
  vessels.forEach(v => {
    if (v.dbStats && v.dbStats.deliveries > 0) {
      shipStats.push({ name: v.name, color: v.color, profit: v.dbStats.totalProfit, deliveries: v.dbStats.deliveries, id: v.id });
    }
  });
  shipStats.sort((a, b) => b.profit - a.profit);
  document.getElementById('dbTopShips').innerHTML = shipStats.slice(0, 5).map(s =>
    `<div class="db-ship-row" onclick="openShipPanel(${s.id})">
      <span class="db-ship-dot" style="background:#cc0000"></span>
      <span style="flex:1">${s.name}</span>
      <span style="color:${s.profit >= 0 ? '#ffffff' : '#cc0000'};font-weight:400">${fmtUSD(s.profit)}</span>
      <span style="color:#444444;margin-left:4px">(${s.deliveries})</span>
    </div>`
  ).join('') || '<div style="color:#444444;font-size:10px">No deliveries yet</div>';

  // Route efficiency ranking
  const routePerf = {};
  vessels.forEach(v => {
    const key = v.origin + '→' + v.destination;
    const fin = calcTripFinancials(v);
    if (!routePerf[key]) routePerf[key] = { count: 0, totalEff: 0 };
    routePerf[key].count++;
    routePerf[key].totalEff += fin.efficiency;
  });
  const routeRanked = Object.entries(routePerf).map(([k, v]) => ({ route: k, efficiency: v.totalEff / v.count, count: v.count }))
    .sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);
  const maxEff = routeRanked.length ? routeRanked[0].efficiency : 1;
  document.getElementById('dbRouteRank').innerHTML = routeRanked.map(r =>
    `<div class="pp-commodity-bar" style="margin-bottom:3px">
      <div class="pp-commodity-label" style="min-width:90px;font-size:9px">${r.route}</div>
      <div class="pp-commodity-fill" style="width:${(r.efficiency/maxEff)*60}px;background:#cc0000"></div>
      <div class="pp-commodity-val" style="font-size:9px">${r.efficiency.toFixed(2)}x</div>
    </div>`
  ).join('') || '<div style="color:#444444;font-size:10px">Calculating...</div>';

  // Profit chart
  if (dbProfitHistory.length > 1) {
    if (dbProfitChart) dbProfitChart.destroy();
    dbProfitChart = new Chart(document.getElementById('dbProfitChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: dbProfitHistory.map((_, i) => i),
        datasets: [{
          data: dbProfitHistory, borderColor: '#cc0000', borderWidth: 1,
          fill: false,
          pointRadius: 0, tension: 0.3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { ticks: { color: '#444444', font: { size: 8 }, callback: v => fmtUSD(v) }, grid: { color: '#111111' } }
        }
      }
    });
  }

  // Events log
  document.getElementById('dbEvents').innerHTML = dbEvents.slice(0, 10).map(e => {
    const hrs = Math.floor(e.time / 3600);
    const mins = Math.floor((e.time % 3600) / 60);
    return `<div style="padding:2px 0;font-size:10px;border-bottom:1px solid #111111">
      <span style="color:#444444">[${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}]</span> ${e.text}
    </div>`;
  }).join('') || '<div style="color:#444444;font-size:10px">No events yet</div>';
}

function exportDBData() {
  Promise.all([dbGetAll('deliveries'), dbGetAll('routeChanges'), dbGetAll('timeseries')]).then(([deliveries, changes, timeseries]) => {
    const data = {
      exportDate: new Date().toISOString(),
      summary: { totalRevenue: dbTotalRevenue, totalProfit: dbTotalProfit, deliveries: dbDeliveryCount, routeChanges: dbRouteChangeCount, totalDistance: dbTotalDistAll, totalFuel: dbTotalFuelAll },
      deliveries, routeChanges: changes, timeseries,
      currentVessels: vessels.map(v => {
        const fin = calcTripFinancials(v);
        return { id: v.id, name: v.name, type: v.type, imo: v.imo, origin: v.origin, destination: v.destination,
          cargo: v.cargo, financials: fin, dbStats: v.dbStats || null };
      })
    };
    downloadFile(JSON.stringify(data, null, 2), 'hormuz_trade_db.json', 'application/json');
    addDBEvent('Database exported');
  });
}
