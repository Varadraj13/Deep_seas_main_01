// ================================================================
//  PHASE 3: PORT PANEL
// ================================================================
let ppChart = null;

function openPortPanel(idx) {
  const p = ports[idx];
  document.getElementById('portPanel').classList.add('open');
  document.getElementById('shipPanel').classList.remove('open');
  selectedShipId = null;

  document.getElementById('ppName').textContent = p.name;
  document.getElementById('ppSub').textContent = `${p.lat.toFixed(2)}\u00B0N, ${p.lng.toFixed(2)}\u00B0E`;

  document.getElementById('ppShipsDay').textContent = p.shipsPerDay;
  document.getElementById('ppCapacity').textContent = p.capacity;
  document.getElementById('ppDwell').textContent = p.avgDwell;

  // Incoming traffic (vessels heading toward this port)
  const incoming = vessels.filter(v => v.destination === p.name).sort((a,b) => {
    const ra = (1-a.progress)*a.totalDist/a.speed;
    const rb = (1-b.progress)*b.totalDist/b.speed;
    return ra - rb;
  }).slice(0, 8);

  document.getElementById('ppIncoming').innerHTML = incoming.length ?
    incoming.map(v => {
      const eta = ((1-v.progress)*v.totalDist/v.speed).toFixed(1);
      return `<div class="pp-ship-item" onclick="openShipPanel(${v.id})">
        <span><span class="pp-ship-dot" style="background:#cc0000"></span>${v.name}</span>
        <span style="color:#444444">${v.cargo.type} // ETA ${eta}H</span>
      </div>`;
    }).join('') : '<div style="color:#444444;font-size:11px;padding:4px">No incoming vessels</div>';

  // Departing traffic (vessels from this port)
  const departing = vessels.filter(v => v.origin === p.name && v.progress < 0.3).slice(0, 6);
  document.getElementById('ppDeparting').innerHTML = departing.length ?
    departing.map(v =>
      `<div class="pp-ship-item" onclick="openShipPanel(${v.id})">
        <span><span class="pp-ship-dot" style="background:#cc0000"></span>${v.name}</span>
        <span style="color:#444444">> ${v.destination}</span>
      </div>`
    ).join('') : '<div style="color:#444444;font-size:11px;padding:4px">No recent departures</div>';

  // Cargo processing
  document.getElementById('ppReceived').textContent = p.received;
  document.getElementById('ppShipped').textContent = p.shipped;
  document.getElementById('ppTransship').textContent = p.transship + '%';
  document.getElementById('ppLocal').textContent = p.local + '%';

  // Commodities
  const maxComm = Math.max(...Object.values(p.commodities));
  document.getElementById('ppCommodities').innerHTML = Object.entries(p.commodities)
    .sort((a,b)=>b[1]-a[1]).map(([name, pct]) =>
      `<div class="pp-commodity-bar">
        <div class="pp-commodity-label">${name}</div>
        <div class="pp-commodity-fill" style="width:${(pct/maxComm)*100}px;background:#cc0000"></div>
        <div class="pp-commodity-val">${pct}%</div>
      </div>`
    ).join('');

  // Economic
  document.getElementById('ppDailyValue').textContent = '$' + p.dailyValue + 'M';
  document.getElementById('ppMfg').textContent = p.mfg + '%';
  document.getElementById('ppConsumer').textContent = p.consumer + '%';

  // Partners
  const maxPartner = Math.max(...Object.values(p.partners));
  document.getElementById('ppPartners').innerHTML = Object.entries(p.partners)
    .sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name, pct]) =>
      `<div class="pp-commodity-bar">
        <div class="pp-commodity-label">${name}</div>
        <div class="pp-commodity-fill" style="width:${(pct/maxPartner)*80}px;background:#cc0000"></div>
        <div class="pp-commodity-val">${pct}%</div>
      </div>`
    ).join('');

  // Port chart
  if (ppChart) ppChart.destroy();
  const ctxPP = document.getElementById('ppChart').getContext('2d');
  ppChart = new Chart(ctxPP, {
    type: 'bar',
    data: {
      labels: Object.keys(p.commodities),
      datasets: [{ data: Object.values(p.commodities), backgroundColor: ['#ef4444','#3b82f6','#22c55e','#a855f7','#f59e0b','#06b6d4','#ec4899'] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: '#444444', font: { size: 8 } }, grid: { display: false } },
                y: { ticks: { color: '#444444', font: { size: 9 } }, grid: { color: '#111111' } } } }
  });
}

function closePortPanel() { document.getElementById('portPanel').classList.remove('open'); if(ppChart){ppChart.destroy();ppChart=null;} }
