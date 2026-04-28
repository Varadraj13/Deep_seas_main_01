// ================================================================
//  INDEXEDDB - REAL-TIME TRADE DATABASE
// ================================================================
const DB_NAME = 'HormuzTradeDB';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      // Ship snapshots - periodic telemetry
      if (!d.objectStoreNames.contains('snapshots')) {
        const ss = d.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
        ss.createIndex('shipId', 'shipId', { unique: false });
        ss.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // Completed deliveries
      if (!d.objectStoreNames.contains('deliveries')) {
        const dl = d.createObjectStore('deliveries', { keyPath: 'id', autoIncrement: true });
        dl.createIndex('shipId', 'shipId', { unique: false });
        dl.createIndex('timestamp', 'timestamp', { unique: false });
        dl.createIndex('route', 'route', { unique: false });
      }
      // Route changes (drag events)
      if (!d.objectStoreNames.contains('routeChanges')) {
        const rc = d.createObjectStore('routeChanges', { keyPath: 'id', autoIncrement: true });
        rc.createIndex('shipId', 'shipId', { unique: false });
      }
      // Aggregated stats (time series)
      if (!d.objectStoreNames.contains('timeseries')) {
        const ts = d.createObjectStore('timeseries', { keyPath: 'id', autoIncrement: true });
        ts.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => { console.warn('IndexedDB not available, using in-memory fallback'); resolve(null); };
  });
}

// In-memory fallback if IndexedDB isn't available
const memDB = { snapshots: [], deliveries: [], routeChanges: [], timeseries: [] };

function dbPut(store, data) {
  if (!db) { memDB[store].push({ ...data, id: memDB[store].length + 1 }); return; }
  try {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).add(data);
  } catch(e) { memDB[store].push({ ...data, id: memDB[store].length + 1 }); }
}

function dbGetAll(store) {
  return new Promise(resolve => {
    if (!db) { resolve(memDB[store] || []); return; }
    try {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(memDB[store] || []);
    } catch(e) { resolve(memDB[store] || []); }
  });
}

function dbClear(store) {
  if (!db) { memDB[store] = []; return; }
  try { db.transaction(store, 'readwrite').objectStore(store).clear(); } catch(e) {}
}
