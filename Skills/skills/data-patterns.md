# SKILL: Data Patterns — Deep Seas / Malacca Simulator
# Read this file before writing anything that persists or reads state.
# Last updated: 2026-04-11

## Data stores

| Store | Backend | Location | Purpose |
|---|---|---|---|
| `snapshots` | IndexedDB `MalaccaTradeDB` v1 | browser | periodic per-ship telemetry |
| `deliveries` | IndexedDB | browser | completed voyages with financials |
| `routeChanges` | IndexedDB | browser | user-initiated reroute events |
| `timeseries` | IndexedDB | browser | global aggregated snapshot per tick |
| `memDB` | in-memory object | `window` | fallback when IndexedDB is unavailable |
| `malacca_sim_state` | localStorage | browser | manual save/load (exportable vessel state) |
| `MARKETS` (Phase 2) | module-level `const` | `window` | live market probabilities + history |

All browser-side. There is no server, no database, no cloud sync.
Everything is ephemeral except what the user explicitly saves.

## Schema definitions

### IndexedDB — `MalaccaTradeDB` v1 (line ~2188)

```javascript
// snapshots — periodic telemetry (not currently filled per-ship, reserved)
{ id: autoIncrement, shipId, timestamp }
// indexes: shipId, timestamp

// deliveries — one row per completed voyage
{
  id: autoIncrement,
  shipId, shipName, type,
  origin, destination,
  cargo, cargoValue,
  distance, timeHours,
  fuelUsed, fuelCost,
  revenue, profit, profitMargin,
  costPerNm, efficiency,
  timestamp,               // simElapsed seconds
  route                    // "Origin → Destination"
}
// indexes: shipId, timestamp, route

// routeChanges — one row per confirmDrag()
{
  id: autoIncrement,
  shipId, shipName, timestamp,
  oldDist, newDist, profitImpact,
  from: { lat, lng }, to: { lat, lng }
}
// indexes: shipId

// timeseries — global aggregate sample every ~15 sim-seconds
{
  id: autoIncrement,
  timestamp, vesselCount,
  totalRevenue, totalProfit, totalDeliveries,
  avgSpeed, totalCargoValue
}
// indexes: timestamp
```

### localStorage — `malacca_sim_state`

Written by `saveState()`, read by `loadState()`. Schema is whatever
`JSON.stringify` produces from:
```javascript
{
  simElapsed, simSpeed,
  vessels: [
    { id, name, type, speed, imo, origin, destination, progress,
      flag, owner, callSign, mmsi, fuelType, dwt, beam, draft,
      sizeMeter, cargo, loadFactor,
      totalFuelConsumed, totalCO2,
      routeIndex  // index into ROUTES array, NOT the route itself
    }
  ]
}
```
`routeIndex` is used instead of the full route because routes are
regenerated each session via `generateRoutes()`.

### MARKETS (Phase 2 — not yet built)

```javascript
const MARKETS = [
  {
    id: 'hormuz-jul26',
    question: 'Will Strait of Malacca traffic normalize before Jul 2026?',
    probability: 0.49,    // 0-1 range
    yesPrice: 54,         // cents, integer
    noPrice: 47,          // cents, integer. yesPrice + noPrice ≈ 97 (3¢ house)
    volume: '$2.1M',      // display string
    history: []           // 24 floats 0.05-0.95, random-walk seeded
  },
  // ... 2 more
];
```
`initMarketHistory()` seeds `history` with a 24-step random walk bounded
[0.05, 0.95]. `shiftMarkets(profitDelta)` mutates probability and
recomputes prices.

## Read pattern

### From IndexedDB with memDB fallback (line ~2243)
```javascript
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
```
**Rule**: all DB reads return a Promise that **always resolves**, never
rejects. Callers never need try/catch.

### From localStorage
```javascript
const raw = localStorage.getItem('malacca_sim_state');
if (!raw) { /* show message, return */ }
const state = JSON.parse(raw);
```
No try/catch around `JSON.parse` currently — if localStorage is corrupt,
the whole `loadState()` throws. This is acceptable: the failure surfaces
rather than silently loading garbage.

## Write pattern

### dbPut — used by every DB write (line ~2235)
```javascript
function dbPut(store, data) {
  if (!db) { memDB[store].push({ ...data, id: memDB[store].length + 1 }); return; }
  try {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).add(data);
  } catch(e) {
    memDB[store].push({ ...data, id: memDB[store].length + 1 });
  }
}
```

Callers just call `dbPut('deliveries', record)`. No await, no error
handling. The store is guaranteed to receive the row one way or another.

### localStorage write
```javascript
localStorage.setItem('malacca_sim_state', JSON.stringify(state));
document.getElementById('exportStatus').textContent = 'State saved to localStorage';
```

## Atomic / integrity requirements

IndexedDB transactions are atomic by default. No extra pattern required.

The **critical invariant** is that the running counters
`dbDeliveryCount`, `dbTotalRevenue`, `dbTotalProfit`, `dbTotalDistAll`,
`dbTotalFuelAll`, `dbRouteChangeCount` stay in sync with the rows in
IndexedDB. They are incremented at the same time as `dbPut` is called
(see `recordDelivery()` line ~2343). If you ever add a new counter,
update it in the same function that does the `dbPut`.

## The data chain (simulation → DB)

```
animate() (60 fps)
  → updateSim(dt)
     → per vessel: progress += delta
        → on progress ≥ 1:
              recordDelivery(v)
                ├─ dbDeliveryCount++
                ├─ dbTotalRevenue  += fin.freightRevenue
                ├─ dbTotalProfit   += fin.profit
                ├─ dbTotalDistAll  += fin.totalDist
                ├─ dbTotalFuelAll  += fin.fuelTotal
                ├─ dbPut('deliveries', record)
                ├─ v.dbStats.*  mutate
                └─ addDBEvent(...)
     → every 15 sim-seconds:
           recordSnapshot()
              ├─ dbPut('timeseries', agg)
              └─ dbProfitHistory.push(dbTotalProfit)

confirmDrag()
  ├─ dbRouteChangeCount++
  ├─ dbPut('routeChanges', record)
  ├─ addDBEvent(...)
  └─ (Phase 2) shiftMarkets(profitDelta) + renderKalshiOverlay(...)
```

`recordSnapshot()` is also hooked into the Phase 2 wiring point —
market shifts do not go into the IndexedDB, they only live in the
`MARKETS` module-level array (no persistence by design — reset on
page reload).

## Validation

None enforced at the DB layer. Callers are trusted.
Financial values come from `calcTripFinancials` / `calcRouteFinancials`
which use real vessel data, so corruption requires a bug in those
functions rather than bad input.

## Failure handling

| Failure mode | Handler | What happens |
|---|---|---|
| IndexedDB unavailable (private mode, old browser) | `openDB().onerror` | `db` stays null, `memDB` takes over |
| IndexedDB transaction throws | try/catch in `dbPut` | Row goes to `memDB` instead |
| localStorage unavailable | not currently handled | `saveState()` will throw — acceptable |
| `MARKETS` mutated to out-of-range probability | clamp in `shiftMarkets()` | `Math.max(0.05, Math.min(0.95, p))` |
| Running counters out of sync with DB rows | no recovery | treat as bug and fix |
| `resetSim()` called mid-tick | synchronous | all vessels removed, counters zeroed,
  `dbClear('deliveries'/'routeChanges'/'timeseries'/'snapshots')` |

## What NOT to do

1. **Do not introduce a new IndexedDB version** without bumping
   `DB_VERSION` and writing a proper `onupgradeneeded` migration.
2. **Do not `await` `dbPut`.** It is intentionally fire-and-forget to
   avoid adding async coloring to the sim loop.
3. **Do not persist the `MARKETS` array** in Phase 2. The "reset on
   page reload" behaviour is intentional — the demo resets between
   runs. (Use the R key reset, not localStorage.)
4. **Do not store the GFW token in IndexedDB or localStorage.**
5. **Do not add a server round-trip.** Everything is browser-local
   by design.
