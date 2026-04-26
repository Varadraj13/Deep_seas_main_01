const map = L.map('map', { center: [2.5, 101.5], zoom: 7, minZoom: 5, maxZoom: 14, zoomControl: false });
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
map.createPane('labelsPane');
map.getPane('labelsPane').style.zIndex = 650;
map.getPane('labelsPane').style.pointerEvents = 'none';
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { pane: 'labelsPane' }).addTo(map);

// Shipping lane overlays
const tssNW = [[1.17,103.85],[1.25,103.65],[1.60,103.30],[2.00,102.60],[2.40,101.90],[2.80,101.20],[3.30,100.50],[3.80,100.00],[4.20,99.50],[4.80,98.50],[5.40,97.80],[5.80,97.20]];
const tssSE = [[1.10,103.80],[1.18,103.60],[1.52,103.25],[1.92,102.55],[2.32,101.85],[2.72,101.15],[3.22,100.45],[3.72,99.95],[4.12,99.45],[4.72,98.45],[5.32,97.75],[5.72,97.15]];
let routeLayerNW = L.polyline(tssNW, { color: '#cc0000', weight: 1, opacity: 0.3, dashArray: '6,4' }).addTo(map);
let routeLayerSE = L.polyline(tssSE, { color: '#444444', weight: 1, opacity: 0.3, dashArray: '6,4' }).addTo(map);
let routesVisible = true;

// ================================================================
//  PORT SYSTEM (Phase 3)
// ================================================================
const ports = [
  { name: 'Singapore', lat: 1.26, lng: 103.84, capacity: '37M TEU', shipsPerDay: 140, avgDwell: '1.5 days',
    commodities: { Electronics: 28, 'Crude Oil': 22, Containers: 18, Chemicals: 12, LNG: 10, Machinery: 10 },
    dailyValue: 850, transship: 85, local: 15, received: '1.2M TEU', shipped: '1.1M TEU',
    partners: { China: 24, Malaysia: 14, Indonesia: 12, 'South Korea': 10, Japan: 9, USA: 8, India: 7 }, mfg: 45, consumer: 55 },
  { name: 'Port Klang', lat: 3.00, lng: 101.39, capacity: '14M TEU', shipsPerDay: 55, avgDwell: '2.1 days',
    commodities: { 'Palm Oil': 25, Electronics: 20, Rubber: 15, Timber: 12, Containers: 18, Chemicals: 10 },
    dailyValue: 320, transship: 52, local: 48, received: '450K TEU', shipped: '420K TEU',
    partners: { China: 22, Singapore: 16, Japan: 11, USA: 9, India: 8, Thailand: 7 }, mfg: 58, consumer: 42 },
  { name: 'Penang', lat: 5.42, lng: 100.35, capacity: '1.5M TEU', shipsPerDay: 18, avgDwell: '2.5 days',
    commodities: { Electronics: 35, Rubber: 15, 'Palm Oil': 14, Machinery: 12, Textiles: 10, Rice: 8, Steel: 6 },
    dailyValue: 95, transship: 30, local: 70, received: '120K TEU', shipped: '100K TEU',
    partners: { China: 20, Japan: 15, USA: 12, Singapore: 10, India: 8 }, mfg: 62, consumer: 38 },
  { name: 'Belawan', lat: 3.78, lng: 98.68, capacity: '0.8M TEU', shipsPerDay: 12, avgDwell: '3.0 days',
    commodities: { 'Palm Oil': 35, Rubber: 20, Coffee: 10, Timber: 15, Tobacco: 8, Fish: 7, Cocoa: 5 },
    dailyValue: 45, transship: 15, local: 85, received: '80K TEU', shipped: '90K TEU',
    partners: { Singapore: 22, China: 18, India: 12, Malaysia: 10, Japan: 8 }, mfg: 72, consumer: 28 },
  { name: 'Dumai', lat: 1.68, lng: 101.45, capacity: '50M tons', shipsPerDay: 8, avgDwell: '1.8 days',
    commodities: { 'Crude Oil': 45, 'Palm Oil': 30, Petroleum: 15, Chemicals: 5, Coal: 3, Gas: 2 },
    dailyValue: 120, transship: 10, local: 90, received: '15M tons', shipped: '22M tons',
    partners: { Singapore: 30, China: 20, Japan: 15, 'South Korea': 10, India: 8 }, mfg: 88, consumer: 12 },
  { name: 'Malacca City', lat: 2.19, lng: 102.24, capacity: '0.2M TEU', shipsPerDay: 5, avgDwell: '2.8 days',
    commodities: { Fish: 25, 'Palm Oil': 20, Rubber: 15, Timber: 12, Rice: 10, Containers: 10, Textiles: 8 },
    dailyValue: 15, transship: 8, local: 92, received: '25K TEU', shipped: '20K TEU',
    partners: { Singapore: 25, Indonesia: 20, Thailand: 12, China: 10 }, mfg: 55, consumer: 45 },
  { name: 'Johor Bahru', lat: 1.46, lng: 103.76, capacity: '1.0M TEU', shipsPerDay: 15, avgDwell: '2.0 days',
    commodities: { Electronics: 22, 'Palm Oil': 18, Petrochemicals: 15, Containers: 15, Vehicles: 12, Machinery: 10, Textiles: 8 },
    dailyValue: 65, transship: 35, local: 65, received: '85K TEU', shipped: '80K TEU',
    partners: { Singapore: 28, China: 18, Japan: 12, Indonesia: 10, USA: 8 }, mfg: 52, consumer: 48 },
  { name: 'Batam', lat: 1.05, lng: 104.03, capacity: '0.5M TEU', shipsPerDay: 10, avgDwell: '1.6 days',
    commodities: { Electronics: 40, Machinery: 20, Containers: 15, Textiles: 10, Chemicals: 8, Metals: 7 },
    dailyValue: 55, transship: 40, local: 60, received: '60K TEU', shipped: '55K TEU',
    partners: { Singapore: 35, China: 15, Japan: 12, Malaysia: 10, USA: 8 }, mfg: 65, consumer: 35 },
];

let portMarkers = [];
ports.forEach((p, idx) => {
  const m = L.circleMarker([p.lat, p.lng], { radius: 4, fillColor: '#cc0000', color: '#cc0000', weight: 1, fillOpacity: 0.6 })
    .bindTooltip(p.name, { permanent: false, direction: 'top' })
    .addTo(map);
  m.on('click', () => openPortPanel(idx));
  portMarkers.push(m);
});
