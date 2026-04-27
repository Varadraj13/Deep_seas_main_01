# SKILL: Domain Patterns — Deep Seas / Malacca Simulator
# Read this file before touching financial, market, or maritime logic.
# Last updated: 2026-04-11

## Domain overview

This project sits at the intersection of three domains:

1. **Maritime traffic** — vessels, shipping lanes, fuel, cargo, ports
2. **Shipping economics** — fuel/crew/port/insurance costs vs freight revenue
3. **Prediction markets (Kalshi-style)** — binary Yes/No contracts priced
   in cents, where `YES + NO ≈ 97¢` (the 3¢ spread is the house edge)

A correct implementation must respect the rules of all three. Code that
is "technically correct" but violates these rules produces output that
looks plausible and is wrong.

## Maritime terminology

| Term | Definition | Where it appears |
|---|---|---|
| **TSS** | Traffic Separation Scheme — the one-way lane pair set by IMO for the Strait of Malacca | route generation, collision avoidance |
| **knots (kn)** | Nautical miles per hour. 1 kn ≈ 1.852 km/h | `vessel.speed`, `baseSpeed` on types |
| **nautical mile (nm)** | 1 nm ≈ 1.852 km. Distances on water are always nm, never km | `oldDist`, `newDist`, `totalDist` |
| **DWT** | Deadweight Tonnage — max cargo + fuel + crew + water a vessel can carry (tons) | `vessel.dwt`, ship panel |
| **LOA / beam / draft** | Length overall / width / underwater depth (meters) | ship panel data card |
| **IMO** | 7-digit unique hull ID assigned by International Maritime Organization | `vessel.imo` |
| **MMSI** | 9-digit radio ID (Maritime Mobile Service Identity) | `vessel.mmsi` |
| **flag** | State of registration. Controls regulatory regime | `vessel.flag` |
| **call sign** | Short radio identifier (e.g. `3FXY9`) | `vessel.callSign` |
| **VLSFO** | Very Low Sulphur Fuel Oil — the post-2020 IMO 0.5% sulphur cap standard | `FUEL_PRICE_PER_TON = 620` |
| **MGO / LNG / HFO** | Marine Gas Oil / Liquefied Natural Gas / Heavy Fuel Oil (pre-2020) | `vessel.fuelType`, emissions calc |
| **hazmat** | IMO dangerous-goods cargo class flag | `cargo.hazmat` |
| **CO2 / SOx / NOx** | Carbon dioxide / sulphur oxides / nitrogen oxides emissions | `totalCO2`, analytics dashboard |
| **load factor** | Fraction of DWT actually carrying paid cargo (0–1) | `vessel.loadFactor` |
| **TEU** | Twenty-foot Equivalent Unit — container count. Only for container ships | display only |
| **progress** | 0–1 along the vessel's current route. ≥1 triggers delivery | `vessel.progress` |
| **port fee** | Flat charge per visit. We use `$15,000 origin + $15,000 destination` | `PORT_FEE_BASE` |

## Financial model — the ground truth

All four cost categories come from `calcTripFinancials()` (line ~2263).
Any agent touching finance code must match these formulas exactly.

```javascript
const FUEL_PRICE_PER_TON  = 620;     // USD, VLSFO spot average
const CREW_COST_PER_HOUR  = 250;     // USD, blended crew + ops
const PORT_FEE_BASE       = 15000;   // USD per port call
const INSURANCE_RATE      = 0.0003;  // fraction of cargo.value, per trip
```

### Total cost (one-way trip)
```
totalCost = fuelCost + crewCost + (PORT_FEE_BASE × 2) + insurance

  fuelCost  = fuelTotal (tons) × FUEL_PRICE_PER_TON
  crewCost  = timeHours × CREW_COST_PER_HOUR
  portFees  = PORT_FEE_BASE × 2   ← origin + destination
  insurance = cargo.value × INSURANCE_RATE
```

### Revenue (one-way trip)
```
freightRevenue = cargo.value × 0.08    ← 8% of cargo value as freight rate
```
This 8% is a project convention, not a real-world number. Do **not**
"correct" it — it calibrates the rest of the balance sheet so that a
normal trip is slightly profitable and a long reroute can flip negative.

### Profit metrics
```
profit       = freightRevenue - totalCost
profitMargin = profit / freightRevenue × 100       (percent)
costPerNm    = totalCost / totalDist                (USD/nm)
revenuePerNm = freightRevenue / totalDist           (USD/nm)
efficiency   = revenuePerNm - costPerNm             (USD/nm)
```

### Route-change delta (`calcRouteFinancials`, line ~2292)
```
profitDelta = newProfit - oldProfit
```

**Sign convention — memorise this**:
- `profitDelta > 0` → the reroute **saves money** (shorter/cheaper)
- `profitDelta < 0` → the reroute **costs money** (longer/more fuel)

`confirmDrag()` at line 2538 formats it with a conditional sign prefix,
and the drag overlay at line 2510 calls `cls(-fin.profitDelta)` to get
red text when the delta is negative — note the **negation**. If you ever
replace `cls()`, preserve that sign flip or the colours invert.

## Prediction market domain (Kalshi-style)

Phase 2 introduces three binary maritime markets. The domain rules:

### Binary contract pricing
```
A market asks a yes/no question.
probability p in [0.05, 0.95]        (clamped — never 0 or 1)

yesPrice = round(p × 97)             (integer cents)
noPrice  = 97 - yesPrice              (integer cents)
```
**Invariant**: `yesPrice + noPrice === 97`. The 3¢ spread is the house
edge. A split of 50/50 is priced 49¢/48¢, not 50¢/50¢. Do not "round up
to 100" — this is wrong and breaks the spread invariant.

### Probability movement on disruption
```
disruption event  →  probability moves AGAINST the resolution
```

The maritime markets ask questions like:
- "Will Strait of Malacca traffic normalise before Jul 2026?"
- "Will bunker fuel average under $650/t in Q3 2026?"
- "Will a named carrier's OTP stay above 85% this month?"

A negative `profitDelta` (a costly reroute = a visible disruption)
**decreases** the Yes probability on every market because the reroute is
evidence that things are getting worse, not normalising. A positive
delta (money-saving reroute = efficient routing) **increases** Yes.

`shiftMarkets(profitDelta)` should:
1. Translate `profitDelta` into a signed `dp` (probability delta) with
   a bounded magnitude — the doc suggests `dp = clamp(profitDelta / 5_000_000, -0.08, +0.08)`
2. Apply `p_new = clamp(p_old + dp, 0.05, 0.95)` to each market
3. Push `p_new` into the market's `history[]` array (sliding window ≤24)
4. Recompute `yesPrice`/`noPrice` from `p_new`
5. Return an array of `{marketId, oldPrice, newPrice, deltaCents}` so
   the overlay renderer can highlight the change

### Market history
The `history[]` array holds up to 24 probabilities for the sparkline.
Older values at index 0, newest at the end. `initMarketHistory()` seeds
it with a random walk bounded `[0.05, 0.95]` so each market starts
with a plausible shape. The random walk is **session-only** — on
reload, a new walk is generated. This is intentional (see Data Patterns
skill file, "Do NOT persist MARKETS").

### Volume field
`market.volume` is a display string like `"$2.1M"`. It is **not** a
number and nothing computes with it. Treat it as a label only.

## Common domain mistakes to avoid

1. **Mixing km and nm.** All distances on water are nautical miles.
   If you see a distance in km anywhere, it is a bug. `totalDist`,
   `oldDist`, `newDist`, `costPerNm` are all in nm.

2. **Dividing by zero on short trips.** A vessel that spawns at its
   destination has `timeHours ≈ 0` and `totalDist ≈ 0`. The existing
   code guards with `totalDist > 0 ? ... : 0`. Any new metric must too.

3. **Forgetting the PORT_FEE_BASE × 2.** Port fees apply at **both**
   origin and destination. `calcRouteFinancials` uses `PORT_FEE_BASE`
   once inside the delta math because fees are equal on both old and
   new routes and cancel out — **do not** "fix" this to `× 2` or the
   delta will double-count.

4. **Treating `profitDelta > 0` as bad.** Positive = better for the
   operator = reroute saved money. The drag overlay UI paints positive
   green and negative red. If you see red on a money-saving reroute,
   you negated the sign somewhere.

5. **Normalising Kalshi prices to 100.** `yesPrice + noPrice = 97`, not
   100. The 3¢ gap is the spread. Don't "fix" it.

6. **Moving the probability towards the event.** A disruption pushes
   probability **away from Yes** on a "will things normalise" question.
   Don't flip this — it inverts the whole market-as-reaction premise.

7. **Using real-world freight rates.** Our 8% is a calibration constant,
   not a market quote. Changing it breaks the economics of every
   already-tuned scenario.

8. **Persisting `MARKETS` to IndexedDB.** Phase 2 markets are
   session-only by design. They reset on reload so the demo starts
   clean every run. See Data Patterns skill file rule #3.

9. **Rounding probability to 2 decimals before pricing.** `Math.round(p * 97)`
   on an un-rounded `p` gives the correct integer cents. Do not round
   `p` first — the double rounding drifts the spread away from 97¢.

10. **Treating "history" as an unbounded log.** The market history is
    a fixed-length sliding window for the sparkline (24 points).
    Don't let it grow unbounded or the sparkline will scale wrong.

## Evaluation criteria (how to know the code is domain-correct)

- A short trip (Singapore → Port Klang, ~250 nm) is slightly profitable
  under stock cargo values (positive `profit`, positive `efficiency`).
- A reroute that adds >20% distance flips `profitDelta` negative.
- After three negative drags in a row, the `hormuz-jul26` market's
  `yesPrice` should have dropped by at least a few cents, not risen.
- `yesPrice + noPrice === 97` for every market at all times.
- `probability` for every market stays in `[0.05, 0.95]`, never outside.
- Resetting the sim (R key in Phase 3) returns all three markets to
  their freshly-seeded `initMarketHistory()` state, not to their
  last-pre-reset values.
