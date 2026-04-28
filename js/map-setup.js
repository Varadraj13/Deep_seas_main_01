const map = L.map('map', { center: [26.0, 57.0], zoom: 7, minZoom: 5, maxZoom: 14, zoomControl: false });
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
map.createPane('labelsPane');
map.getPane('labelsPane').style.zIndex = 650;
map.getPane('labelsPane').style.pointerEvents = 'none';
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { pane: 'labelsPane' }).addTo(map);

// Shipping lane overlays — Strait of Hormuz TSS (from SHIPPING_LANES in config-data.js)
const tssNW = SHIPPING_LANES.inbound;
const tssSE = SHIPPING_LANES.outbound;
let routeLayerNW = L.polyline(tssNW, { color: '#cc0000', weight: 1, opacity: 0.3, dashArray: '6,4' }).addTo(map);
let routeLayerSE = L.polyline(tssSE, { color: '#444444', weight: 1, opacity: 0.3, dashArray: '6,4' }).addTo(map);
let routesVisible = true;

// ================================================================
//  PORT SYSTEM (Phase 3)
// ================================================================
const ports = [
  { name: 'Jebel Ali', lat: 25.01, lng: 55.06, capacity: '22M TEU', shipsPerDay: 120, avgDwell: '2.1 days',
    commodities: { 'Crude Oil': 30, Containers: 25, LNG: 15, Chemicals: 12, Electronics: 10, Machinery: 8 },
    dailyValue: 650, transship: 70, local: 30, received: '900K TEU', shipped: '850K TEU',
    partners: { China: 20, India: 15, USA: 12, 'South Korea': 10, Japan: 9, Germany: 8, UK: 7 }, mfg: 40, consumer: 60 },
  { name: 'Bandar Abbas', lat: 27.17, lng: 56.27, capacity: '14M tons', shipsPerDay: 35, avgDwell: '2.8 days',
    commodities: { 'Crude Oil': 55, Chemicals: 15, Containers: 12, Steel: 8, Machinery: 6, Food: 4 },
    dailyValue: 280, transship: 20, local: 80, received: '8M tons', shipped: '18M tons',
    partners: { China: 30, India: 18, UAE: 15, Turkey: 12, 'South Korea': 8 }, mfg: 75, consumer: 25 },
  { name: 'Abu Dhabi', lat: 24.48, lng: 54.35, capacity: '8M TEU', shipsPerDay: 45, avgDwell: '1.9 days',
    commodities: { 'Crude Oil': 45, LNG: 20, Chemicals: 12, Containers: 10, Steel: 8, Food: 5 },
    dailyValue: 420, transship: 35, local: 65, received: '400K TEU', shipped: '380K TEU',
    partners: { China: 22, India: 16, Japan: 12, 'South Korea': 10, USA: 9 }, mfg: 72, consumer: 28 },
  { name: 'Khor Fakkan', lat: 25.12, lng: 56.36, capacity: '4M TEU', shipsPerDay: 25, avgDwell: '1.5 days',
    commodities: { Containers: 50, Electronics: 20, Machinery: 12, Textiles: 10, Chemicals: 8 },
    dailyValue: 185, transship: 85, local: 15, received: '350K TEU', shipped: '330K TEU',
    partners: { China: 28, India: 18, UAE: 15, 'South Korea': 10, Japan: 8 }, mfg: 30, consumer: 70 },
  { name: 'Muscat', lat: 23.61, lng: 58.59, capacity: '4M TEU', shipsPerDay: 22, avgDwell: '2.4 days',
    commodities: { 'Crude Oil': 30, LNG: 25, Containers: 20, Fish: 10, Chemicals: 8, Food: 7 },
    dailyValue: 140, transship: 40, local: 60, received: '280K TEU', shipped: '260K TEU',
    partners: { China: 20, India: 22, UAE: 18, Japan: 10, 'South Korea': 8 }, mfg: 55, consumer: 45 },
  { name: 'Ras Al Khaimah', lat: 25.80, lng: 55.94, capacity: '2M TEU', shipsPerDay: 12, avgDwell: '2.0 days',
    commodities: { Ceramics: 25, Cement: 20, 'Crude Oil': 15, Containers: 15, Quarry: 12, Chemicals: 8, Steel: 5 },
    dailyValue: 75, transship: 25, local: 75, received: '180K TEU', shipped: '160K TEU',
    partners: { India: 25, China: 18, Oman: 12, UAE: 12, Europe: 10 }, mfg: 68, consumer: 32 },
  { name: 'Sohar', lat: 24.37, lng: 56.65, capacity: '5M tons', shipsPerDay: 18, avgDwell: '2.6 days',
    commodities: { Steel: 30, Aluminum: 25, 'Crude Oil': 15, Chemicals: 12, Fertilizers: 10, LPG: 8 },
    dailyValue: 110, transship: 15, local: 85, received: '120K tons', shipped: '180K tons',
    partners: { China: 22, India: 20, Japan: 15, 'South Korea': 12, UAE: 10 }, mfg: 80, consumer: 20 },
  { name: 'Qeshm', lat: 26.75, lng: 55.92, capacity: '8M tons', shipsPerDay: 15, avgDwell: '3.2 days',
    commodities: { 'Crude Oil': 65, LNG: 15, Chemicals: 8, Fish: 6, Food: 4, Steel: 2 },
    dailyValue: 95, transship: 10, local: 90, received: '5M tons', shipped: '12M tons',
    partners: { China: 35, India: 20, UAE: 15, Turkey: 12, 'South Korea': 8 }, mfg: 88, consumer: 12 },
];

let portMarkers = [];
ports.forEach((p, idx) => {
  const m = L.circleMarker([p.lat, p.lng], { radius: 4, fillColor: '#cc0000', color: '#cc0000', weight: 1, fillOpacity: 0.6 })
    .bindTooltip(p.name, { permanent: false, direction: 'top' })
    .addTo(map);
  m.on('click', () => openPortPanel(idx));
  portMarkers.push(m);
});
