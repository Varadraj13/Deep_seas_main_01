# Deep Seas — Show Implementation Plan

## Context

Deep Seas is a multi-screen live installation: a physical object placed in a floor zone is
detected by a vision model, which "fires a weapon" that moves a single probability number,
which ripples out to a projected ship simulation, a broadcast news console, a prediction-market
display, and audience phones. A design-review board (the PDF) specified UI/UX changes per page;
a prior fact-check found the logical spine is sound but several weapon effects are dead, the
audience path has an origin bug, and market/audience screens run on fake data.

This plan turns the board + fact-check into an ordered, testable implementation. Constraints
locked with the user:
- **Runway: < 1 week** → ship a bulletproof must-have core first; polish is explicitly stretch.
- **Betting model: fixed $50 per tap, unlimited taps, no per-person balance.** Market price =
  YES$ / total$. Payout multiples are derived display only (= 1/price). No database — in-memory
  server state + phone-side `localStorage` name re-registration.
- **Detector camera: display-only mirror** of the same physical camera on the same laptop as
  control-center. Detection/`FIRE_WEAPON` stays single-source in control-center. Never two models.
- **base.html: camera CAN see the screen** → keep it visually quiet (no dashed affordances that
  the model could misread); a text-only "DETECTED: …" strip is fine.
- **Sim-controls migration is NOT in the repo** (verified) → build it fresh in Phase E and push.

Legend below: **[MUST]** = show breaks or embarrasses without it · **[IF-TIME]** = high-value polish.

---

## Current state — what works vs what doesn't

### Backend (`server.js`, live at `deep-seas-main-01.onrender.com`)
| Working (verified live) | Broken / missing |
|---|---|
| `/healthz` 200; static serving; CORS | Counts bare units, not $ stake |
| `POST /bet {side}` → increments, broadcasts | No bettor identity / names |
| `POST /reset` → 50¢ | No transaction log, no per-name totals |
| WS broadcast to all clients; `connectedCount` | In-memory only — Render restart wipes it |
| | First bet pins price to 100% (0/0 start) |
| | Free tier spins down ~15 min idle (cold start 15–60s) |

### Frontend
| Page | Working | Broken / missing |
|---|---|---|
| simulator.html | map, GFW layer, vessels move, speed/spawn react, keyboard fires | red-cross markers unreadable; GFW off at boot; only 2 of ~20 weapon effects visible; no fixed baseline speed; no dataset caption; controls still inline (should move to control-center) |
| detector.html | model-free; ticker/alert/odds/table react to fires; dual-mode | camera click-to-enable (not autostart); Bloomberg table uses random sin/cos not `bloomberg-data.js`; F1–F12 footer clutter; stray lower-third line; live column flush to edge; `Images/broadcast/` folder absent → every fire shows placeholder |
| control-center.html | detection engine, model dropdown, camera, keyboard, mode buttons | NO sim-controls panel; NO `hormuz-controls`; nav not shared/top; cramped 2-panel row; no audience/reset/status controls |
| market_screen.html | WS + `hormuz-game` wired; canvas charts render; divergence box | fake `YES_PLAYERS`/`NO_PLAYERS` arrays; sine-wave history; no payout multiples; no real leaderboard/tickers; P&L math always ≈0; bottom sim strip + ROUND chip clutter |
| audience.html | bet buttons, WS price | **same-origin WS/fetch → dead unless opened from Render URL**; ¢ not $; no signup; reload-loop on disconnect; declares IBM Plex Mono but never loads it |
| base.html | weapons manifest, active-player blink | no live detection feedback at the floor |

### Correctness bugs (from fact-check)
- **`recomputeSimMultipliers()` `Math.min` bug** (`js/game-state.js:39-62`): defender numeric keys can't
  override an active disruptor's — R01 escort (`speed_mult:1.0`) loses to D01 (`0.05`), so **ships never
  visibly resume after the defender saves the strait.** Kills the show's biggest beat.
- **R06 `disruptor_decay_mult:1.5` never read** by `js/market-tick.js` — coalition mechanic is inert.

---

## Phases

### Phase A — Server + audience.html (the public path) **[MUST]**
The only path the audience touches; also unblocks the market screen. Do first.

**`server.js`**
- `/bet` accepts `{side, name}`; each bet adds **$50** to `betsOpen$`/`betsClosed$` (rename or add `$`
  accumulators). `marketPrice = betsOpen$ / (betsOpen$ + betsClosed$)`, default 0.5 when empty.
- Add `transactions` (rolling, cap ~50: `{name, side, amount, ts}`) and `byName` totals to `state`;
  include both in `broadcast()` and the initial WS message.
- Keep in-memory. Add a tiny keep-alive note (see runbook) — no persistence layer.

**`audience.html`**
- Two-screen flow: **Page 01 signup** ("Hello! please add your name" → input → submit), name persisted
  in `localStorage`; **Page 02 bet** cards: `OPEN – $50` (green) / `CLOSED – $50` (red), `$` price display
  (internal 0–1 × 100), contract-terms filler line.
- **Origin-independent**: connect via `SERVER_URL` from `js/config.js` (mirror `market_screen.html:306`),
  not `location.host`. Include `name` in the `/bet` body.
- Replace `onclose → location.reload()` with **exponential-backoff reconnect** + calm "reconnecting…" pill.
- Bet-confirm beat: fill button → "✓ $50 on OPEN · @name" toast → price ticks. Optional small per-tap
  cooldown to blunt spam (unlimited taps is by design, cooldown just prevents accidental double-fire).
- Mobile: add `<meta name="theme-color">`, `overscroll-behavior:none`, load the IBM Plex Mono `<link>`.

**Stress test A:** open audience.html from the **Render URL** on 3–5 phones (incl. cellular); each signs up,
taps a side; confirm market_screen price + $ totals move live; kill Wi-Fi on one phone → backoff pill, no strobe.

### Phase B — market_screen.html real data **[MUST]**
Depends on Phase A's WS payload. Turns fake demo into the real Kalshi-style board.

- Delete `YES_PLAYERS`/`NO_PLAYERS` (lines 286–299) and the sine `yesHistory`/`noHistory` (334–338).
- Render **real leaderboard/tickers** from `transactions`/`byName` in the WS message; "+ Ipsita added $50"
  ticker falls out of the transaction feed.
- **Payout multiples** next to odds: `1 / price` (YES 62¢ → "pays 1.61x"). Derived, no new state.
- **YES/NO charts → TradingView Lightweight Charts** (CDN, ~45kb, Apache-2.0) area series in green/red —
  replaces the hand-rolled `drawChart` canvas (354–396). Feed each incoming price to the series.
- Remove bottom sim strip (`#tick1–4`) and the hardcoded `ROUND … / 3` chip (270–282).
- **Keep the divergence number** ("MARKET vs TRUTH · Δ") — it's the scoreboard; only the sim *clutter* goes.
- Fix `calcPnl` (399–405) so buy-price ≠ live-price (store entry price per bet) or drop P&L for now.

**Stress test B:** bets from Phase A show real names in the ticker + leaderboard; both charts scroll live;
payout multiples update with price; divergence tracks `hormuz-game`.

### Phase C — simulator legibility + correctness **[MUST]**
The projector centerpiece; also fixes the defender-comeback bug.

- **Fix `Math.min` bug** in `js/game-state.js:39-62`: for numeric keys, let **defender weapons replace**
  (mirror the existing string/bool rule at lines 48-54) instead of min. Verifies via D01→R01 releasing speed.
- **GFW auto-on**: in the sim-mode entry hook (`simulator.html:623-640`, after `map.invalidateSize()`),
  call the enable path if `!gfwVisible` (reuse `toggleGFW()` from `js/gfw.js:317`).
- **Ship PNG markers**: in `js/vessel-creation.js:60-67`, swap the `.vessel-cross` divIcon for a small
  (12–16px) hull sprite; rotate per-frame using `pos.bearing` (already computed at `js/simulation.js:146`)
  via `transform:rotate`; add 1px white outline for legibility over GFW purple. Hide `.vessel-datacard`
  at zoom ≤ 7 (CSS + a zoom listener), show on hover/selection.
- **Fixed baseline speed**: treat 15 kn as nominal; render `#avgSpeed` (`js/simulation.js:216`) as deviation
  ("14.8 KN · NOMINAL" vs "3.1 KN ▼ BLOCKADE"). Surface **$ in transit** (sum `cargo.value`, already in the
  vessel object) as the economic-condition stat.
- **Dataset caption**: new bottom-left element (anchor near `.heatmap-legend`, `bottom:40px;left:12px`)
  with the AIS/GFW attribution copy.

**Stress test C:** fire D01 → ships halt, spawn thins, GFW visible from boot; fire R01 → **ships visibly resume**
(the bug-fix proof); markers read as ships from the back of the room; labels gone at boot zoom.

### Phase D — visible weapon behaviors **[IF-TIME]**
Make more fires legible on the map. Add a `visual_effect` field to `js/weapons-config.js` so data + sim + docs
can't drift; implement the 3 most legible, hooking into `js/simulation.js:79-161`:
- **D03 tankers vanish** (`remove_vessel_class`) — remove/fade `v.type==='tanker'` near loop top.
- **D04 port flash + queue** (`port_node:disabled`) — flash the port node, hold arriving ships as dots.
- **R03 Cape reroute** (`cape_route`) — add one Cape lane to `SHIPPING_LANES`/`ROUTES` in `js/config-data.js`;
  reassign routes in the respawn block (`js/simulation.js:126-129`).
(R06 decay fix in `market-tick.js` optional here — logic-only, invisible to audience.)

**Stress test D:** each of D03/D04/R03 produces its distinct on-map change; no NaN/console errors.

### Phase E — control-center cockpit + sim-controls migration **[MUST-ish]**
**First verify the repo** (confirmed absent): build fresh, then push.
- New **`hormuz-controls` BroadcastChannel**: control-center posts `{type:'TOGGLE_PLAY'|'SET_SPEED'|
  'START_ROUND'|…}`; `simulator.html` adds one listener dispatching to the existing functions
  (`togglePlay`, `setSpeed`, `startRound`, `toggleGFW`, `applyFilters`, …). Simulator's inline controls
  can stay as a local fallback or be hidden.
- **3-column cockpit** (`#detectionArea`): left = sim + round controls (SIM CONTROLS panel, net-new),
  center = detection (existing `#techPanel` + camera), right = game dashboard (Probability / Last Action /
  Active Weapons / Event Log — requires adding `actionLog.slice(-10)` to `game-broadcast.js` payload and
  porting `updateDashboard` rendering to read the snapshot).
- **Shared nav to top**; move Mode 01/02 with it.
- **Show-day controls**: audience-market panel (live price + counts + **/reset button**), connection-status
  row (heartbeat ping over a channel since BroadcastChannel has no presence), big **PANIC/ALL-CLEAR** button.
- Keep all actions keyboard-reachable (1–6 / a–f already standardized).
- **Push to `claude/cli-prompt-repo-changes-dbacj2`.**

**Stress test E:** every control on control-center visibly drives simulator; dashboard mirrors engine; /reset
clears the audience market; PANIC returns everything to idle; unplug simulator tab → status row shows it.

### Phase F — detector polish **[MUST, small — one pass]**
- **Autostart display-only camera mirror**: convert `#camPanel onclick="enableCam()"` (`detector.html:288`)
  to fire on load; keep click as fallback. Same default device as control-center; no model here.
- **Wire `bloomberg-data.js`**: replace `genTable()`/`COMPANIES`/`COLS` (357–404) with the per-weapon
  dataset (D05 all-zero freeze, D06 `ERR` cells); keep the visual render + 800ms column tick.
- Remove **F1–F12 footer** (`#bbFooter`, 343) and the **lower-third top-border line** (`css:164`); add margin
  to the live column. **Keep** the BREAKING flag.
- **Human task**: create `Images/broadcast/` with the 12 JPGs named per `js/broadcast-news.js` (D01…R06),
  one consistent treatment (crop ratio + slight desaturation/grain).

**Stress test F:** fire each of the 12 weapons → correct satellite image + weapon-specific Bloomberg reaction;
camera mirror shows live feed on load; no footer/line.

### Phase G — global fonts + shared nav + base.html **[IF-TIME]**
- Two families only: **IBM Plex Mono** (UI) + **Playfair Display** (detector editorial). Kill Helvetica/Arial
  in `css/main.css`, generic `monospace` in simulator; add the missing font `<link>` to audience.
- Encode as CSS vars in one shared file; make the top nav a single injected strip, not copy-pasted ×7.
- Color grammar: red = disruptor/negative, green = defender/positive, amber = market — stop using red as decor.
- **base.html**: no dashed on-floor affordance (camera sees the screen). Add a text-only "DETECTED: BROOM
  (D03) — 84%" strip driven by the detection feed; flash the just-fired weapon row on `FIRE_WEAPON`.

---

## What YOU need to do (human-only, not code)
1. **Push the local phase-01 work / confirm repo state** before Phase E (uncommitted work = one spilled coffee from gone).
2. **Source 12 satellite JPGs** for `Images/broadcast/`, named per `js/broadcast-news.js`, consistent treatment.
3. **Provide the Kalshi reference screenshot** so the market_screen replication matches (Phase B).
4. **Retrain the TM model in-situ** — same projector light, camera height/angle, and background as show night
   (most TM accuracy loss is lighting/background, not the objects); capture the training photos there.
5. **Pre-grant camera permission** on the show laptop (lets detector autostart + control-center start clean).
6. **Decide the contract-terms copy** on audience (filler is fine for now).
7. **Warm the Render server** before doors (or upgrade to paid for show week) — free tier sleeps ~15 min idle.

## End-to-end verification (run before doors)
1. `curl /healthz` until 200; `POST /reset`.
2. Open control-center on the show laptop; select "Final Model — 12 Weapons"; confirm camera + class bars.
3. Physical object into the zone → detector image + Bloomberg react, simulator ships change, market_screen
   ground-truth moves, base.html shows DETECTED strip.
4. Fire **D01 then R01** from keyboard → ships **halt then visibly resume** (Math.min fix proof).
5. Phones (QR → **Render** audience URL) → sign up, two bets each → market_screen shows real names + charts move.
6. Hit **PANIC** → all screens return to idle; `/reset` clears the market.
7. Fallback drill: laptop running `node server.js` + phone hotspot (everything same-origin locally works).

## Suggested execution order for Claude Code (VS Code)
A → B (public path + its display, unblocks the most) → C (projector + the one correctness bug that matters) →
E (operability + push the migration) → F (small detector pass) → then D and G if time. Commit per phase;
run the matching stress test before moving on. Backend change in A is the linchpin — do it first.

---

## Grill report — Phase C2: prob-driven vessel speed (2026-07-02)

**Context:** After the Phase C `Math.min` fix, ship speed still only responded to D01/R01
because only those two weapons carry meaningful `speed_mult` values. Decision: stop reading
per-weapon `speed_mult` and drive ship speed *directly* from `marketState.prob` (the
"PROBABILITY" number), so every weapon that moves prob moves speed proportionally. Core
relation locked by the user: **speed% = 100 − prob** (inverse), domain-verified (high prob =
disruption = strait closed = ships slow; `market_screen` already treats `100 − prob` as "open").

### Q1: How does "double the default speed" combine with speed% = 100 − prob?
**Options:** (a) 2× base scaled by (100−p): `effective = base × 2 × (100−prob)/100`;
(b) keep base, scale by (100−p) — ships never exceed today's speed.
**Decision:** Option (a) — 2× base scaled by (100−p).
**Rationale:** prob 50 (boot) renders at today's normal speed while giving visible headroom to
*speed up* to 2× when the strait is safer than neutral (prob→0); (b) leaves ships sluggish since
prob usually sits 40–60.
**Consequence:** `speedFactor` ranges 0.1–2.0, = 1.0 at prob 50. The displayed avg KN doubles at
prob 0 and the "double the default" is realized as open-water max, not boot speed.

### Q2: Floor at high disruption, or full freeze?
**Options:** (a) small ~5%-of-max floor; (b) full freeze to 0 at prob 100.
**Decision:** Option (a) — floor at 5% of max.
**Rationale:** Ships keep a slight drift even under total blockade, avoiding a "dead screen" on
the projector; matches the old D01 `speed_mult` of 0.05.
**Consequence:** `speedFactor` bottoms at 0.1 (2 × 0.05); ships never fully stop from prob alone.

### Q3: Existing spawn-thinning under blockade?
**Options:** (a) leave weapon-driven as-is; (b) tie spawn to prob too; (c) remove spawn effects.
**Decision:** Option (b) — tie spawn to prob.
**Rationale:** Spawn thinning and speed then share one factor and stay consistent for every
weapon combination, not just D01.
**Consequence:** `spawnFactor = min(1.0, speedFactor)` — no thinning at/below prob 50, thinning
ramps in above it. Old `spawn_rate_mult` reads are removed from `simulation.js`.

### Q4: On-screen vessel-speed readout format?
**Options:** (a) KN + % + deviation; (b) KN + % only; (c) KN + word state.
**Decision:** Option (c) — KN + word state, augmented with % and %-changed per the original
board note ("mention the speed … and by what percent it has changed").
**Rationale:** Word state reads instantly from the back of the room; the % and ▼-change satisfy
the board's explicit request without cluttering the big value.
**Consequence:** Header stat shows value `12.4 KN`, label `NOMINAL · 62% (▼38%)`. Bands:
OPEN ≤25, NOMINAL <55, SLOWING <75, BLOCKADE ≥75.

**Zoom:** confirmed no `setView/fitBounds/flyTo` exists — map stays at boot `zoom: 7,
center [26.0, 57.0]`, matching the screenshot. No change needed.

### Implementation (all shipped in this pass)
1. `js/speed-model.js` (new, pure, Node-testable) — `speedFactorFromProb`,
   `spawnFactorFromProb`, `flowState`. *Screen: none — data layer.* Skip → nothing to drive speed.
2. `tests/phase-c2-speed-model.js` — 16 behavior assertions (RED→GREEN). *Screen: none.*
3. `js/simulation.js` — speed target now `speedFactorFromProb(marketState.prob)`; spawn gate now
   `spawnFactorFromProb(prob)`; header readout uses `flowState`. *Screen: ships track prob for
   every weapon; KN + word state visible.* Skip → speed stays weapon-only (the bug).
4. `simulator.html` — load `speed-model.js` before `simulation.js`. *Screen: none.* Skip →
   `speedFactorFromProb is not defined`, speed falls back to 1.0.