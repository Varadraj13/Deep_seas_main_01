// CONFIG
// ================================================================
const CONFIG = {
  // Collision / spacing (nautical miles)
  COLLISION_DIST_NM: 1.5,

  // Financial model (USD)
  FUEL_PRICE_PER_TON: 620,    // VLSFO spot average
  CREW_COST_PER_HOUR: 250,    // blended crew + ops
  PORT_FEE_BASE:      15000,  // per port call
  INSURANCE_RATE:     0.0003, // fraction of cargo.value per trip

  // Hand tracking (MediaPipe)
  HAND_SMOOTH:     0.35,  // lower = smoother, higher = more responsive
  PINCH_THRESHOLD: 0.07,  // normalised fingertip distance for pinch
  GRAB_RADIUS:     5000,  // metres around cursor; normal hand mode

  // Prediction markets (Phase 2)
  MARKET: {
    IMPACT_SCALE:      0.15,
    ANIMATE_DURATION:  1200,   // ms
    SPARKLINE_POINTS:  24,
  },
};

// DATA ARRAYS
const FLAGS = [
  { country: 'Panama', code: 'PA' }, { country: 'Liberia', code: 'LR' },
  { country: 'Marshall Islands', code: 'MH' }, { country: 'Singapore', code: 'SG' },
  { country: 'Hong Kong', code: 'HK' }, { country: 'Bahamas', code: 'BS' },
  { country: 'Malta', code: 'MT' }, { country: 'Greece', code: 'GR' },
  { country: 'China', code: 'CN' }, { country: 'Japan', code: 'JP' },
  { country: 'Norway', code: 'NO' }, { country: 'Cyprus', code: 'CY' }
];

const OWNERS = [
  'Maersk Line', 'MSC Mediterranean', 'COSCO Shipping', 'CMA CGM Group',
  'Hapag-Lloyd', 'Evergreen Marine', 'ONE (Ocean Network Express)', 'Yang Ming Marine',
  'PIL Pacific', 'Wan Hai Lines', 'ZIM Integrated', 'HMM Co Ltd',
  'Mitsui O.S.K.', 'NYK Line', 'K Line', 'Trafigura Maritime',
  'Teekay Tankers', 'Frontline Ltd', 'Euronav NV', 'MISC Berhad'
];

const FUEL_TYPES = ['VLSFO', 'HFO', 'MGO', 'LNG', 'LSFO', 'HSFO'];

// Cargo database by ship type
const CARGO_DB = {
  tanker: [
    { cargo: 'Crude Oil', unit: 'barrels', qtyRange: [500000, 2000000], valuePerUnit: 75, hazmat: true, class: 'Energy', category: 'mfg' },
    { cargo: 'Refined Petroleum', unit: 'barrels', qtyRange: [200000, 800000], valuePerUnit: 90, hazmat: true, class: 'Energy', category: 'mfg' },
    { cargo: 'Palm Oil', unit: 'tons', qtyRange: [20000, 60000], valuePerUnit: 900, hazmat: false, class: 'Agriculture', category: 'mfg' },
    { cargo: 'Chemicals', unit: 'tons', qtyRange: [10000, 40000], valuePerUnit: 1200, hazmat: true, class: 'Chemicals', category: 'mfg' },
  ],
  container: [
    { cargo: 'Electronics', unit: 'TEU', qtyRange: [4000, 18000], valuePerUnit: 45000, hazmat: false, class: 'Consumer Goods', category: 'consumer' },
    { cargo: 'Textiles & Apparel', unit: 'TEU', qtyRange: [3000, 14000], valuePerUnit: 22000, hazmat: false, class: 'Consumer Goods', category: 'consumer' },
    { cargo: 'Auto Parts', unit: 'TEU', qtyRange: [2000, 10000], valuePerUnit: 35000, hazmat: false, class: 'Industrial', category: 'mfg' },
    { cargo: 'Machinery', unit: 'TEU', qtyRange: [1500, 8000], valuePerUnit: 50000, hazmat: false, class: 'Industrial', category: 'mfg' },
    { cargo: 'Mixed Consumer Goods', unit: 'TEU', qtyRange: [5000, 20000], valuePerUnit: 18000, hazmat: false, class: 'Consumer Goods', category: 'consumer' },
  ],
  cargo: [
    { cargo: 'Steel Products', unit: 'tons', qtyRange: [15000, 50000], valuePerUnit: 800, hazmat: false, class: 'Industrial', category: 'mfg' },
    { cargo: 'Timber', unit: 'tons', qtyRange: [10000, 35000], valuePerUnit: 300, hazmat: false, class: 'Raw Materials', category: 'mfg' },
    { cargo: 'Rice', unit: 'tons', qtyRange: [20000, 60000], valuePerUnit: 400, hazmat: false, class: 'Agriculture', category: 'consumer' },
    { cargo: 'Rubber', unit: 'tons', qtyRange: [8000, 25000], valuePerUnit: 1500, hazmat: false, class: 'Raw Materials', category: 'mfg' },
    { cargo: 'Vehicles', unit: 'units', qtyRange: [500, 4000], valuePerUnit: 25000, hazmat: false, class: 'Consumer Goods', category: 'consumer' },
  ],
  bulk: [
    { cargo: 'Iron Ore', unit: 'tons', qtyRange: [50000, 200000], valuePerUnit: 120, hazmat: false, class: 'Raw Materials', category: 'mfg' },
    { cargo: 'Coal', unit: 'tons', qtyRange: [40000, 180000], valuePerUnit: 90, hazmat: false, class: 'Energy', category: 'mfg' },
    { cargo: 'Grain (Wheat/Corn)', unit: 'tons', qtyRange: [30000, 80000], valuePerUnit: 250, hazmat: false, class: 'Agriculture', category: 'consumer' },
    { cargo: 'Bauxite', unit: 'tons', qtyRange: [30000, 100000], valuePerUnit: 50, hazmat: false, class: 'Raw Materials', category: 'mfg' },
  ],
  lng: [
    { cargo: 'Liquefied Natural Gas', unit: 'cubic meters', qtyRange: [120000, 265000], valuePerUnit: 280, hazmat: true, class: 'Energy', category: 'mfg' },
    { cargo: 'LPG', unit: 'cubic meters', qtyRange: [40000, 84000], valuePerUnit: 250, hazmat: true, class: 'Energy', category: 'mfg' },
  ]
};

const SHIP_TYPES = {
  tanker:    { color: '#ef4444', speed: [10, 15], size: [200, 350], label: 'Tanker', dwtRange: [40000, 320000], beamRange: [32, 60], draftRange: [12, 22] },
  container: { color: '#3b82f6', speed: [14, 22], size: [250, 400], label: 'Container', dwtRange: [30000, 210000], beamRange: [32, 59], draftRange: [12, 16] },
  cargo:     { color: '#22c55e', speed: [10, 16], size: [100, 220], label: 'Cargo', dwtRange: [5000, 80000], beamRange: [18, 36], draftRange: [7, 14] },
  bulk:      { color: '#a855f7', speed: [11, 15], size: [180, 300], label: 'Bulk Carrier', dwtRange: [30000, 400000], beamRange: [28, 65], draftRange: [11, 23] },
  lng:       { color: '#f59e0b', speed: [16, 20], size: [280, 345], label: 'LNG Carrier', dwtRange: [50000, 100000], beamRange: [43, 55], draftRange: [11, 13] },
};

const SHIP_NAMES_PREFIX = ['MV', 'MT', 'MSC', 'CMA CGM', 'OOCL', 'Ever', 'Maersk', 'Yang Ming', 'PIL', 'NYK'];
const SHIP_NAMES_SUFFIX = ['Glory', 'Fortune', 'Star', 'Dragon', 'Phoenix', 'Harmony', 'Venture', 'Spirit', 'Breeze', 'Horizon', 'Pioneer', 'Champion', 'Liberty', 'Pacific', 'Atlantic', 'Orchid', 'Coral', 'Jade', 'Pearl', 'Sapphire', 'Emerald', 'Titan', 'Atlas', 'Voyager', 'Meridian'];

const ORIGINS = ['Shanghai', 'Busan', 'Tokyo', 'Hong Kong', 'Dubai', 'Rotterdam', 'Mumbai', 'Chennai', 'Colombo', 'Jeddah', 'Suez', 'Yokohama', 'Ningbo', 'Shenzhen', 'Kaohsiung', 'Laem Chabang', 'Tanjung Pelepas'];
const DESTINATIONS = ['Singapore', 'Port Klang', 'Rotterdam', 'Dubai', 'Mumbai', 'Shanghai', 'Tokyo', 'Busan', 'Chennai', 'Colombo', 'Jeddah', 'Hamburg', 'Felixstowe', 'Piraeus', 'Antwerp', 'Los Angeles', 'Tanjung Priok'];

const WAYPOINT_NAMES = [
  'Singapore Strait TSS', 'Philip Channel', 'One Fathom Bank',
  'Port Dickson Anchorage', 'Malacca Narrows', 'Klang Approach',
  'Penang Strait North', 'Langkawi Passage', 'Andaman Sea Entry',
  'South Channel Buoy', 'Raffles Lighthouse', 'Sultan Shoal',
  'Horsburgh Lighthouse'
];

// ROUTES
function generateRoutes() {
  const nwBase = [[1.20,103.82],[1.35,103.55],[1.65,103.20],[2.00,102.60],[2.40,101.90],[2.85,101.20],[3.30,100.55],[3.75,100.05],[4.15,99.50],[4.60,98.80],[5.10,98.10],[5.60,97.40],[6.00,96.80]];
  const seBase = [[6.00,96.70],[5.55,97.30],[5.05,98.00],[4.55,98.70],[4.10,99.40],[3.70,99.95],[3.25,100.45],[2.78,101.10],[2.35,101.80],[1.95,102.50],[1.60,103.10],[1.30,103.50],[1.15,103.78]];
  const routes = [];
  for (let i = 0; i < 6; i++) { routes.push(jitterRoute(nwBase, 0.04)); routes.push(jitterRoute(seBase, 0.04)); }
  return routes;
}
function jitterRoute(base, amt) { return base.map((p,i) => (i===0||i===base.length-1) ? [...p] : [p[0]+(Math.random()-0.5)*amt, p[1]+(Math.random()-0.5)*amt]); }
const ROUTES = generateRoutes();
