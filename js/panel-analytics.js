// ================================================================
//  PHASE 4: ANALYTICS DASHBOARD
// ================================================================
let analyticsOpen = false, analyticsTimer = 0;
let throughputHistory = [], densityHistory = [];
let chartThroughput = null, chartCargo = null, chartDensity = null, chartCorridors = null;

function toggleAnalytics() {
  analyticsOpen = !analyticsOpen;
  document.getElementById('analyticsPanel').classList.toggle('open', analyticsOpen);
  document.querySelector('.ap-toggle').innerHTML = (analyticsOpen ? '&#9660;' : '&#9650;') + ' Analytics Dashboard';
  if (analyticsOpen) initAnalyticsCharts();
}

function recordAnalytics() {
  // Throughput by port destination
  const portCounts = {};
  ports.forEach(p => portCounts[p.name] = vessels.filter(v => v.destination === p.name).length);
  throughputHistory.push(portCounts);
  if (throughputHistory.length > 40) throughputHistory.shift();

  // Density
  densityHistory.push(vessels.length);
  if (densityHistory.length > 60) densityHistory.shift();

  if (analyticsOpen) updateAnalyticsCharts();
}

function initAnalyticsCharts() {
  if (chartThroughput) chartThroughput.destroy();
  if (chartCargo) chartCargo.destroy();
  if (chartDensity) chartDensity.destroy();
  if (chartCorridors) chartCorridors.destroy();

  const portColors = ['#cc0000','#ffffff','#666666','#888888','#444444','#cc0000','#999999','#555555'];

  // Throughput line chart
  chartThroughput = new Chart(document.getElementById('chartThroughput').getContext('2d'), {
    type: 'line',
    data: {
      labels: throughputHistory.map((_,i)=>i),
      datasets: ports.slice(0,4).map((p,i) => ({
        label: p.name, data: throughputHistory.map(h => h[p.name]||0),
        borderColor: portColors[i], borderWidth: 1, pointRadius: 0, tension: 0.3, fill: false
      }))
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#444444',font:{size:8,family:'Helvetica'},boxWidth:6}}},
      scales:{x:{display:false},y:{ticks:{color:'#444444',font:{size:9}},grid:{color:'#111111'}}} }
  });

  // Cargo distribution pie
  const cargoTypes = {};
  vessels.forEach(v => { cargoTypes[v.cargo.classification] = (cargoTypes[v.cargo.classification]||0) + 1; });
  chartCargo = new Chart(document.getElementById('chartCargo').getContext('2d'), {
    type: 'doughnut',
    data: { labels: Object.keys(cargoTypes), datasets: [{ data: Object.values(cargoTypes), backgroundColor: portColors }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#444444',font:{size:8,family:'Helvetica'},boxWidth:6}}}, cutout:'55%' }
  });

  // Density timeline
  chartDensity = new Chart(document.getElementById('chartDensity').getContext('2d'), {
    type: 'line',
    data: { labels: densityHistory.map((_,i)=>i), datasets: [{ data: densityHistory, borderColor: '#cc0000', borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{x:{display:false},y:{ticks:{color:'#444444',font:{size:9}},grid:{color:'#111111'}}} }
  });

  // Trade corridors bar
  const corridors = {};
  vessels.forEach(v => {
    const key = v.origin.substring(0,8) + '→' + v.destination.substring(0,8);
    corridors[key] = (corridors[key]||0) + 1;
  });
  const topC = Object.entries(corridors).sort((a,b)=>b[1]-a[1]).slice(0,6);
  chartCorridors = new Chart(document.getElementById('chartCorridors').getContext('2d'), {
    type: 'bar',
    data: { labels: topC.map(c=>c[0]), datasets: [{ data: topC.map(c=>c[1]), backgroundColor: portColors }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:'#444444',font:{size:8}},grid:{color:'#111111'}},
              y:{ticks:{color:'#444444',font:{size:8,family:'Helvetica'}},grid:{display:false}}} }
  });
}

function updateAnalyticsCharts() {
  if (!chartThroughput) return;
  // Update throughput
  chartThroughput.data.labels = throughputHistory.map((_,i)=>i);
  ports.slice(0,4).forEach((p,i) => {
    chartThroughput.data.datasets[i].data = throughputHistory.map(h => h[p.name]||0);
  });
  chartThroughput.update('none');

  // Update density
  chartDensity.data.labels = densityHistory.map((_,i)=>i);
  chartDensity.data.datasets[0].data = densityHistory;
  chartDensity.update('none');

  // Update cargo pie
  const cargoTypes = {};
  vessels.forEach(v => { cargoTypes[v.cargo.classification] = (cargoTypes[v.cargo.classification]||0) + 1; });
  chartCargo.data.labels = Object.keys(cargoTypes);
  chartCargo.data.datasets[0].data = Object.values(cargoTypes);
  chartCargo.update('none');

  // Update corridors
  const corridors = {};
  vessels.forEach(v => {
    const key = v.origin.substring(0,8) + '→' + v.destination.substring(0,8);
    corridors[key] = (corridors[key]||0) + 1;
  });
  const topC = Object.entries(corridors).sort((a,b)=>b[1]-a[1]).slice(0,6);
  chartCorridors.data.labels = topC.map(c=>c[0]);
  chartCorridors.data.datasets[0].data = topC.map(c=>c[1]);
  chartCorridors.update('none');
}
