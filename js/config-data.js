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

const ORIGINS = [
  'Singapore', 'Shanghai', 'Mumbai', 'Karachi', 'Colombo',
  'Rotterdam', 'Houston', 'Busan', 'Tokyo', 'Jeddah',
  'Suez Canal', 'Cape Town', 'Mombasa', 'Chennai', 'Ningbo'
];
const DESTINATIONS = [
  'Jebel Ali', 'Abu Dhabi', 'Bandar Abbas', 'Kuwait City', 'Basra',
  'Ras Tanura', 'Doha', 'Muscat', 'Khor Fakkan', 'Rotterdam',
  'Singapore', 'Shanghai', 'Mumbai', 'Houston', 'Busan'
];

const WAYPOINT_NAMES = [
  'Gulf of Oman Approach', 'Musandam Peninsula', 'TSS South Lane',
  'Hormuz Narrows', 'TSS North Lane', 'Qeshm Channel',
  'Hormuz Island', 'Persian Gulf Entry', 'Khor Fakkan Anchorage',
  'Bandar Abbas Approach', 'Jebel Ali Approach', 'Abu Dhabi Approach',
  'Muscat Fairway Buoy'
];

// SHIPPING LANES — Strait of Hormuz
// Single source of truth for route geometry. Waypoints follow navigable water,
// avoiding the Musandam Peninsula and Qeshm Island.
const SHIPPING_LANES = {
  // Inbound: Gulf of Oman → Persian Gulf (south/Oman TSS lane)
  // Arcs north to lat > 26.4 before entering Musandam lng zone (56.15–56.55).
  // Short segments keep straight-line interpolation in navigable water.
  inbound: [
    [22.5, 60.5],    // SE Gulf of Oman — open water
    [23.0, 60.0],
    [23.4, 59.6],
    [23.8, 59.1],
    [24.2, 58.7],
    [24.5, 58.3],
    [24.8, 57.9],
    [25.1, 57.6],
    [25.3, 57.3],
    [25.5, 57.0],
    [25.57, 56.93],
    [25.65, 56.85],
    [25.72, 56.77],
    [25.8, 56.7],    // arcing north toward narrows
    [25.95, 56.65],
    [26.1, 56.62],
    [26.25, 56.60],  // east of Musandam lng exclusion (lng > 56.55)
    [26.42, 56.58],  // lat > 26.4 ✓ — ready to enter narrows
    [26.47, 56.50],  // south/Oman TSS narrows — lat > 26.4 ✓, clear of both zones
    [26.48, 56.40],
    [26.48, 56.28],  // Qeshm: lat 26.48 < 26.5 ✓
    [26.45, 56.15],  // lat > 26.4 keeps clear of Musandam boundary
    [26.38, 56.05],  // west of Musandam lng zone — lat may drop below 26.4 safely
    [26.32, 55.9],
    [26.25, 55.75],
    [26.1, 55.4],
    [25.95, 55.1],
    [25.9, 54.8],
    [26.0, 54.5],
    [26.1, 54.2],    // deep Gulf — terminus
  ],
  // Outbound: Persian Gulf → Gulf of Oman (north/Iran TSS lane)
  // Stays south of Qeshm (lat < 26.5) until lng > 56.3, then rises into narrows
  // at lat 26.52–26.55. Short segments prevent cutting through coastal features.
  outbound: [
    [26.0, 54.2],    // deep Gulf — start
    [26.1, 54.5],
    [26.1, 54.9],
    [26.15, 55.2],
    [26.2, 55.5],
    [26.25, 55.75],  // south of Qeshm (lat < 26.5) ✓
    [26.3, 56.0],
    [26.38, 56.1],
    [26.42, 56.2],   // south of Qeshm (lat < 26.5) ✓, lat > 26.4 ✓
    [26.42, 56.28],  // south of Qeshm ✓
    [26.43, 56.35],  // lat > 26.4 clears Musandam ✓, south of Qeshm ✓
    [26.43, 56.45],  // narrows — clear of both exclusion zones
    [26.42, 56.55],  // lat > 26.4 ✓
    [26.35, 56.65],  // descend east of Musandam lng zone
    [26.2, 56.8],
    [26.1, 56.9],
    [25.5, 57.1],    // descend immediately clear of Iranian coast
    [25.2, 57.4],
    [24.9, 57.7],    // south of Bandar-e Jask (lat 25.64) ✓
    [24.6, 58.0],
    [24.2, 58.4],
    [23.8, 58.8],
    [23.4, 59.2],
    [23.0, 59.7],
    [22.8, 60.1],    // Gulf of Oman — terminus
  ],
  jitter: {
    openWater: 0.04,
    approach: 0.02,
    strait: 0.008,
  }
};

// ROUTES — Strait of Hormuz
// Inbound (even index): Gulf of Oman → Persian Gulf, south/Oman channel, west-flowing
// Outbound (odd index): Persian Gulf → Gulf of Oman, north/Iran channel, east-flowing
function generateRoutes() {
  const routes = [];
  for (let i = 0; i < 6; i++) {
    routes.push(jitterLane(SHIPPING_LANES.inbound));
    routes.push(jitterLane(SHIPPING_LANES.outbound));
  }
  return routes;
}

function jitterLane(lane) {
  const j = SHIPPING_LANES.jitter;
  return lane.map((p, i) => {
    // No jitter on first/last waypoints (spawn/despawn points)
    if (i === 0 || i === lane.length - 1) return [...p];
    // Determine zone
    const totalLen = lane.length;
    const isOpenWater = i <= 2 || i >= totalLen - 3;
    const isApproach = i === 3 || i === totalLen - 4;
    const amt = isOpenWater ? j.openWater : isApproach ? j.approach : j.strait;
    return [p[0] + (Math.random() - 0.5) * amt, p[1] + (Math.random() - 0.5) * amt];
  });
}

const ROUTES = generateRoutes();
