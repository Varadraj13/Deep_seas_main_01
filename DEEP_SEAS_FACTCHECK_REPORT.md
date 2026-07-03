# Deep Seas — PDF Fact-Check & Show-Readiness Report

Cross-verification of the "Phase wise documentation" board against the actual repo
(`claude/cli-prompt-repo-changes-dbacj2`, latest commit `66f95ae`, checked 2026-07-02).
Live infrastructure was probed, not assumed.


---

## 1. The logical spine — formulated exactly (the thing the PDF says you're "not sure about")

Your hand-drawn flow is **correct**, and here is precisely how it works in code:

```
Object detected (camera + TM model, ≥50% conf, 8s debounce)
  └→ posts {type:'FIRE_WEAPON', weaponId} on BroadcastChannel 'deepseas-game'
       └→ js/bootstrap.js (simulator.html) → fireWeapon(id)          [game-state.js:64]
            ├→ prob += weapon.prob_delta (clamped 0–100)             [game-state.js:70]
            ├→ weapon added to activeWeapons
            ├→ recomputeSimMultipliers()                              [game-state.js:39]
            │    numeric keys → Math.min of all active weapons
            │    string/bool keys → defender always overrides
            └→ broadcastGameState() on 'hormuz-game'                  [game-broadcast.js]
                 {shipProbability, lane, activeWeapons, round}
                   ├→ detector.html — odds % (authoritative overwrite)
                   ├→ market_screen.html — "ground truth" = 100 − shipProbability
                   └→ base.html — active-player blink only

                   // even though this is how it is fired, it doesn't trigger all at once - once a weapon is fired - It should simultaneously trigger all the dependencies- i.e the ship speeds, the probability scores, the detector.html elements, the base.html defender and disruptor red turn tirgger, etc - need a phase to make sure all of this works.

Every 20s, independent of fires:                                     [market-tick.js]
  fast weapons decay (decay_per_30s × 20/30) until remainingDelta ≤ 0 → removed
  slow weapons build (build_per_30s) after their onset_s
  slow-vs-slow interaction pairs apply net_delta instead
  drift: ±2 random walk + mean-reversion 5% toward 50
```

//lets make sure if this even makes sense - need to have a phase of its own where we test this entire dependency

**The "market state" contribution you couldn't formulate:** `marketState.prob` is the ONLY
thing weapons change; everything else (odds on detector, ground truth on market screen,
lane win condition) is a *view* of that one number. The audience betting market is a
**completely separate system** (server.js `marketPrice = betsOpen/total`) — there is **no
code path connecting the two probabilities in either direction**. Your planned Test 3
("divergence — stay separate") passes *by construction* today.

**Win condition:** `endRound()` [round-controller.js:32] only checks
`simMultipliers.hormuz_lane === 'closed'` — the prob % is theater; the lane string is the
actual scoring variable. Only D01 sets it closed; only R01 reopens it.

---

## 2. PDF claims vs code — fact-check table

| # | PDF claim / annotation | Verdict | Reality in repo |
|---|---|---|---|
| 1 | "There is a dataset dictating this entire logical system" | ✅ TRUE | `js/weapons-config.js` — auto-generated from `effect_matrix_v4.xlsx` via `scripts/parse_effect_matrix.py`. 12 weapons × {prob_delta, onset_s, decay/build per 30s, sim_trigger_keys} + 8-row interaction matrix. | - // This dataset  might have to be redone - in terms of adding all the newer dependencies in the detector.html and marketstate.html
| 2 | "The same function determines the odds of disruption" (detector 47%) | ✅ TRUE | detector's odds = `shipProbability` from the same `marketState.prob`, via `hormuz-game` snapshots (authoritative overwrite path in detector.html). |
| 3 | "It then triggers the ships to change their behavior" | ⚠️ MOSTLY FALSE — **this is why it looks vague** | Of ~20 distinct `sim_trigger_keys` in the dataset, the simulation consumes exactly **two**: `speed_mult` (simulation.js:73, lerped) and `spawn_rate_mult` (simulation.js:119, removes arriving ships). `hormuz_lane` is scoring-only. Everything else — `remove_vessel_class` (D03), `port_node: disabled` (D04), `global_movement_mult` (D05), `routing_broken` (D06), `cape_route` (R03), `restore_vessel_class` (R02), `disruptor_decay_mult` (R06) — is written into `simMultipliers` and **read by nothing**. D05 "ships stop moving globally" visually does nothing (it sets `global_movement_mult`, not `speed_mult`). | // need to define a phase where we define this behaviour
| 4 | Weapon trigger "initiated by the object detection in the **base.html** floor space" | ❌ FALSE | base.html has **no detection code** — it's the printed weapons manifest + active-player blinker (listens only). The detection engine (tfjs 1.3.1 + TM, model dropdown, predict loop, FIRE_WEAPON posting) lives in **control-center.html**. |// This is okay  -the base.html is just a projection over which the objects are brought in and then detected to trigger the weapon trigger.
| 5 | Weapons table (chair D01 … extension cord R06, names + effects) | ✅ MATCHES | IDs, names, and effect copy in base.html/weapons-config.js match the PDF table 1:1. |// does the weapon id work everywhere though is the question
| 6 | "Audience betting page + market_screen.html connection broken. Render server may be down" | ❌ SERVER IS UP — client-side asymmetry is the real bug | Probed live: first hit timed out at 15s (free-tier **cold start**), second `GET /healthz` → 200 in 0.6s. Full roundtrip worked: `POST /bet {open}` → `{marketPrice:1, betsOpen:1}`, `POST /reset` → 50¢. The actual break: **audience.html uses same-origin WS** (`location.host`) + relative `fetch('/bet')` — it ONLY works when the phone opens the **Render URL**. Opened via VS Code Live Server (:5500, which your editor screenshot shows) or GitHub Pages → no WS endpoint → "connection error" → **reload loop every 2s** (audience.html:143). market_screen.html instead uses the hardcoded `SERVER_URL` (js/config.js → onrender.com) so it works from anywhere — hence "market screen fine, audience broken." |  // okay - lets stress test this in a later phase.
| 7 | Simulator screenshot shows caption "ROUTES DERIVED FROM 2023-2024 AIS PATTERNS • GLOBAL FISHING WATCH…" and GFW layer on at boot | ❌ NOT IN REPO | That text exists nowhere in the repo; `gfwVisible` still starts `false` (gfw.js:133) with no auto-enable. **Your phase-01 simulator/control-center changes (incl. the SIM CONTROLS panel visible in the PDF's control-center screenshot) exist only on your local machine — never committed/pushed.** Latest pushed work is `cf0fe79 detector.html update_01`. One-laptop single point of failure. | // This is yet to be implemented.
| 8 | Detector: "need to create a folder filled with images associated with each weapon trigger" | ✅ CORRECT — folder missing | detector.html:356 already points at `IMAGE_BASE='Images/broadcast/'` and broadcast-news.js defines all 12 filenames (`D01_strait_closure.jpg` … `R06_coalition.jpg`). The folder **doesn't exist** — `Images/` only has the object PNGs (Bench.png, Box.png…). Every fire currently shows the striped NO-IMAGERY placeholder (visible in your own PDF screenshot: `img: R05_spr_re…`). Drop 12 correctly-named JPGs in and it lights up with zero code changes. | // This is easy - I can do this right now.
| 9 | Keyboard 1–6 / a–f standardized | ✅ DONE | bootstrap.js:36–48: Digit1–6 → D01–D06, KeyA–F (unshifted) → R01–R06; toggles moved to Shift+A/B/D/F. detector.html has the same map. | // okay this is good - just need to make sure that this behaviour is verified in the later stages of making this happen.
| 10 | "Font needs to be consistent… one coherent hierarchy" | ✅ LEGITIMATE COMPLAINT | Four type systems live at once: simulator = generic `monospace` + **Helvetica/Arial** in css/main.css; detector = JetBrains Mono + Playfair; control-center/market/base/index = IBM Plex Mono; **audience.html declares IBM Plex Mono but never loads it** (no fonts link) → renders default monospace on phones. | // lets implement a common font change across the repo in a later phase
| 11 | Market screen should show payouts/Kalshi structure, real bettor names, volume | ❌ NOT BUILT | market_screen.html has a **hardcoded fake player list** (`P_MIRA`, `P_TORCH`… lines 288-299) and synthetic `yesHistory` sine-wave chart. No payout multiples, no transaction log, no signup names. Bloomberg-style per-weapon data file `bloomberg-data.js` is **loaded by zero pages** (orphaned — detector.html hardcodes its own 6 companies + sin/cos `genTable()`, so the table jolt is generic, not weapon-specific). | // all the UI changes in the pdf are the suggested changes - yet to be implemented.
| 12 | Audience: price in dollars (~$100 start), signup page, mobile-friendly | ❌ NOT BUILT | audience.html is ¢-based, no name capture, no contracts copy. It IS mobile-viewport-sized but styling relies on the unloaded font. Server has no identity concept — bets are anonymous counters. | // UX change - need to be implemented.
| 13 | Detector: auto-start camera on page load | ❌ Current = click-to-enable | `#camPanel onclick="enableCam()"` (detector.html:288). Note: browsers allow `getUserMedia` on load only after a prior permission grant for that origin — pre-grant it in show setup and autostart will work. | // need to be implemented - and also the camera start should work for the entire project and not only one page - the camera is important - that is how the entire object detection algo works.
| 14 | "Console-log both probability values to confirm independent updates" | Not present | No logging of `marketState.prob` vs `marketPrice` anywhere; trivial to add in market-tick.js + audienceWs.onmessage. | // need to be implemented.

---

## 3. Database / dataset inventory (what actually drives the system)

| Dataset | File | Consumed by | Status |
|---|---|---|---|
| Weapon effect matrix (probs, decay, sim keys, interactions) | `js/weapons-config.js` (from `effect_matrix_v4.xlsx`) | game-state, market-tick, detector, control-center label-map | ✅ live, source of truth | //  needs update in a phase though
| Broadcast news registry (alerts, satellite filenames, 4 angles ×12) | `js/broadcast-news.js` | detector.html | ✅ live |
| Per-weapon Bloomberg equity moves (9 weeks, ERR/zero cases) | `bloomberg-data.js` | **nobody** | ⚠️ orphaned — wire into detector or delete | // need to wire in a phase.
| Ports/routes/flags/cargo for the sim | `js/config-data.js` | vessel-creation, simulation | ✅ live |
| TM models + label maps | `models/manifest.json` → `Final_model/` (12-weapon, default), tm_model_01/02, tm-my-image-model | control-center.html | ✅ live; "Final Model — 12 Weapons" default |
| GFW vessel-density tiles + registry | token in `js/gfw.js` | simulator map | ✅ token valid to **2036-03-01** |
| Audience market state (bets, price) | in-memory in `server.js` | audience.html, market_screen.html | ⚠️ volatile — Render restart/redeploy wipes it; no persistence | // need to stress test - ready to pay for a premium as well
| Kalshi reference (payout structure to replicate) | PDF only | — | not started | // UX change.

---

## 4. Bugs found during cross-verification (not in the PDF)

1. **Counter-weapons can't restore speed — `Math.min` policy bug.** `recomputeSimMultipliers()` (game-state.js:46) takes the *minimum* of numeric keys across active weapons. R01 naval escort sets `speed_mult: 1.0`, but while D01 (0.05) is still active, `min(0.05, 1.0) = 0.05` — **ships stay frozen after the escort fires**, even though the lane flips open and the story says "ships resume movement." The defender's visible comeback never happens on the map. Same failure shape for every numeric defender key. // This needs to corrected no matter what
2. **R06's core mechanic is unimplemented.** `disruptor_decay_mult: 1.5` is never read by market-tick.js — coalition does not actually accelerate disruptor decay; it only applies its own −6/+build. // need to implement this.
3. **First audience bet pins the market to an extreme.** `marketPrice = betsOpen/total` with 0/0 start → first bet = 100¢/0¢. Your planned $50/$50 seed pool fixes this — implement it server-side (`betsOpen = betsClosed = 50` at boot/reset, or price = (betsOpen+50)/(total+100)). // okay - in the market phase.
4. **audience.html reload-loops on failure** (`onclose → location.reload()` every 2s) — on flaky venue Wi-Fi phones will strobe. Reconnect with backoff instead of reload. // This will have to be tested in the movement lab
5. **No `/reset` UI** — resetting the audience market on show day requires a manual `curl -X POST …/reset`. Put a button in control-center. // lets do this in the control center change.
6. **`connectedCount` decrements on close only** — if the server sleeps (free tier) and phones reconnect, counts stay accurate, but a Render restart zeroes everything mid-show.
7. **`ships_at_t0` in the weapons dataset is consumed by nothing** (minor, but it's more dead schema inviting confusion).

---

## 5. Show-day readiness — the three tests + next steps, with verdicts

| Planned test | Current verdict | What to do |
|---|---|---|
| 1. Audience + market sync (bet on phone → market updates live) | **Will pass ONLY if phones open the Render URL** (`https://deep-seas-main-01.onrender.com/audience.html`). Fails from Live Server/Pages/file. | QR code pointing at the Render URL; keep-alive ping (see below); or make audience.html use `SERVER_URL` from js/config.js like market_screen does, so serving origin stops mattering. |
| 2. Multi-device stress (5+ phones) | Server is trivially capable (ws broadcast, counters). Risk is venue Wi-Fi + cold start, not code. | Warm the server 10 min before doors (`curl /healthz` cron or UptimeRobot every 5 min); test on cellular as fallback. |
| 3. Probability divergence (shipProbability vs marketPrice separate) | **Passes by construction** — zero code paths connect them. | Add the console.log instrumentation you noted (one line in market-tick.js, one in audienceWs.onmessage) to demo it. |
| Next-step 1: "Check Render server status / restart if needed" | ✅ Done in this review — server healthy; bet+reset roundtrip verified live. Free-tier **spin-down after ~15 min idle** is the only failure mode observed (first request hangs ~15–60s). | Upgrade to a paid instance for show week, or keep-alive pings. |
| Next-step 3: market visualization (inflow/outflow, transaction table) | Not started; fake data occupies the slots. | Server needs to emit per-bet events (side, name, ts) — add name to `/bet` body once signup exists; keep a rolling `transactions[]` in state and include in WS payload. |
| Next-step 4: multi-device lab test | Blocked on the audience redesign; do a smoke test with the CURRENT page first so network issues surface early. | — |

### Show-day runbook (condensed)
1. T-30min: hit `/healthz` until 200; `POST /reset`; open all screens **from the Render URL** (or keep sim pages local-only — they don't need the server — but audience/market must be Render).
2. Pre-grant camera permission on the control-center machine (then autostart works if you add it); select "Final Model — 12 Weapons"; verify class bars move.
3. Fire D01 from keyboard: simulator ships halt + spawn thins, detector ticker/alert/odds move, market screen ground-truth drops. Fire R01: **expect ships to stay slow (bug #1)** unless you fix it first.
4. Phones: QR → Render audience URL; two test bets; `/reset` before doors.
5. Keep one laptop with `node server.js` + a phone hotspot as full local fallback (everything is same-origin locally, so audience works there too).

---

## 6. What would make the show better (opinionated, beyond the PDF)

- **Fix the Math.min override first** — it's the difference between "the defender visibly saves the strait" and "nothing happens." Cheapest high-impact change: on defender fire, let defender numeric keys *replace* rather than min (mirror the string-key rule).
- **Implement 3–4 visible ship behaviors, not all 20 keys.** The audience can only perceive: halt/slow (have it), fleet thinning (have it), **reroute around the Cape (R03)** — one polyline swap, hugely legible; **port flash + queue dots (D04)**; **tankers vanishing (D03)**. That list IS your "how ships change graphically" database — put it in weapons-config as a `visual_effect` field so sim + docs stay in sync. // ship behaviours should be easy to implement, should be proportional to the probability scores of the strait being open - okay - maybe not - maybe fixed behaviours - like speed at - 25%, 50%, 75%, 100% and complete hault - and we tie the behaviour to each weapon trigger.
- **Wire bloomberg-data.js into the detector table** (it was built for exactly the D05-freeze/D06-ERR beats) or delete it — an orphaned dataset will bite you during a rewrite. // needs to be done - quick fix actually.
- **Ship-PNG markers**: you already lerp headings; a small `L.icon` rotated per-vessel replaces the red crosses and reads as "ships" from the back row.// yepp
- **One font decision**: IBM Plex Mono (UI) + Playfair (broadcast editorial) covers every page; add the missing `<link>` to audience.html either way. // yepp in a phase.
- **Seed + name the market**: $50/$50 seed, name field before betting, and the market screen's "+ Ipsita added 50 bets" ticker falls out of the transaction log for free.
- **Commit and push the local phase-01 work tonight.** Everything in your screenshots that isn't in git is one spilled coffee away from gone. // it is just a pdf.
