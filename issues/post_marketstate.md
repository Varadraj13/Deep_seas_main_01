# Deep Seas — path to live audience interaction

note - use 
1. Grill me skill - "C:\Users\vvbor\Documents\GitHub\Deep_seas_main_01-main 4\Context\Core_skills\grill-me"  - before every subphase, ask 5 most important questions.
2. tdd skill - "C:\Users\vvbor\Documents\GitHub\Deep_seas_main_01-main 4\Context\Core_skills\tdd"  - while you implement these subphases.
3. to-prd skill - "C:\Users\vvbor\Documents\GitHub\Deep_seas_main_01-main 4\Context\Core_skills\to-prd"  - to document the progress of each subphase.

**Where this starts:** the game logic (`game-state.js`, `market-tick.js`,
`round-controller.js`) is built and unit-tested. `detector.html` already
fires weapons into `index.html` over `BroadcastChannel`. `market_screen.html`
exists but is standalone, running fabricated `setInterval` data. There is no
server, no audience-facing page, and no internet hosting anywhere in the repo.

**Where this ends:** the Movement Lab show — `market_screen.html` on the
projector showing both `shipProbability` (driven by weapons) and
`marketPrice` (driven by an audience betting on their phones, over the
internet) live, side by side, never numerically merged.

**Type legend:** `AFK` = Claude Code, unattended. `HUMAN` = needs an account,
a browser, a phone, or an email client — Claude Code cannot do these.

Part 1 and Part 2 don't depend on each other and can be worked in either
order or in parallel. Part 3 depends on Part 2 being locally correct first.
Part 4 is show day itself.

---

## Part 1 — wire the existing game state to the screen (local only, no server)

This is the gap already named in the PRD (phase 5c/7, `issues/06`): nothing
about audience betting, just getting `shipProbability` from `index.html` to
`market_screen.html` on the same machine.

### Subphase 1.1 — index.html broadcasts game state

**Type:** AFK

**What to build:** `index.html` opens a `BroadcastChannel('hormuz-game')` and
posts a snapshot of relevant state every time it changes.

**Acceptance criteria**
- [ ] `BroadcastChannel('hormuz-game')` opened somewhere in the existing
  layer structure (likely alongside `bootstrap.js`, which already owns the
  other channel)
- [ ] Snapshot posted on every `fireWeapon()` call
- [ ] Snapshot posted on every `marketTick()` call
- [ ] Snapshot includes at minimum `{ shipProbability, round, phase }`
- [ ] Test: a throwaway listener page logging incoming messages confirms a
  message arrives on each weapon fire and each 20-second tick

**Blocked by:** nothing — the underlying state (`marketState.prob`,
`round-controller.js`) already exists and is tested.

### Subphase 1.2 — market_screen.html listens, drops the dummy data

**Type:** AFK

**What to build:** `market_screen.html` listens on `'hormuz-game'` and
renders the real number instead of its current fabricated one.

**Acceptance criteria**
- [ ] `BroadcastChannel('hormuz-game')` listener added
- [ ] Existing `setInterval` dummy-data loop removed once live data is
  confirmed arriving (not before — keep the fallback until 1.1 is verified)
- [ ] Display updates `shipProbability` in real time as weapons fire
- [ ] Test: `index.html` and `market_screen.html` open in two tabs on one
  machine, firing a weapon visibly moves the number on `market_screen.html`

**Blocked by:** Subphase 1.1

---

## Grill Report: Subphase 1.2 — market_screen.html listens, drops dummy data

### Q1: What do YES and NO mean in relation to `shipProbability`?

**Options:** (a) YES = (100 − shipProbability), NO = shipProbability — contract reads "Will Hormuz return to normal?", (b) YES = shipProbability, NO = (100 − shipProbability) — inverted, (c) Ignore YES/NO semantics for now, just show the raw number somewhere
**Decision:** Option (a) — YES = (100 − shipProbability)¢, NO = shipProbability¢
**Rationale:** The contract question is "return to normal?" so YES = open = low disruption = inverse of prob; disruptor fires → NO price jumps, which is the correct causal read for the audience.
**Consequence:** `yesProb = (100 - msg.shipProbability) / 100` in the channel listener; no other code changes needed for the mapping.

### Q2: What happens to the `tick()` loop?

**Options:** (a) Keep `setInterval` at 160ms for chart animation, stop the drift — `yesProb` is written by the channel listener, `tick()` just reads and redraws, (b) Remove `setInterval` entirely — chart only redraws on broadcast (every 20s + weapon fires), (c) Two separate loops — one for rendering, one for data
**Decision:** Option (a) — keep `setInterval`, remove drift logic only
**Rationale:** Smooth 160ms chart animation is essential on a live projector; the drift lines are a 4-line deletion; `yesProb` becomes a shared variable updated by the listener.
**Consequence:** `tick()` shrinks to: push `yesProb` to history, redraw charts, update price displays. No random walk. Chart is live but smooth.

### Q3: What happens to the hardcoded player tables?

**Options:** (a) Leave as-is — P&L recalculates from real `yesProb`, (b) Hide with `display: none` — Part 2 wires in real audience data, (c) Replace rows with "AWAITING AUDIENCE DATA" placeholder
**Decision:** Option (b) — hide both `.player-table` elements
**Rationale:** Fake names (P_ATLAS, P_WREN) on a live thesis projection read as a bug; charts get more vertical space; one CSS line to reverse when Part 2 arrives.
**Consequence:** `.player-table { display: none; }` added to CSS; `renderPlayers()` calls can stay in `tick()` but will no-op on hidden containers.

### Q4: What footer ticker fields can be populated from the broadcast?

**Options:** (a) Update only what the broadcast provides (tick4, roundNum, phase label); make tick1/tick2/tick3 static — stop fake `simTick++` and `totalVol` increments, (b) Add `flowPct`/`vesselCount`/`simTick` to the broadcast payload in `game-broadcast.js`, (c) Remove tick1/tick2/tick3 entirely
**Decision:** Option (a) — real data where available, static labels elsewhere
**Rationale:** Fake-incrementing counters on a live projection are worse than static labels; adding sim fields to the broadcast is out of scope and touches `simulation.js`; removing labels changes the visual layout unnecessarily.
**Consequence:** `tick4` shows `LANE OPEN · SHIP PROB 50%` from broadcast; `roundNum` shows real round number; `roundTimer` shows round phase text; `tick1/tick2/tick3` become static strings; `simTick++` and `totalVol +=` removed from `tick()`.

---

## Implementation Plan: Subphase 1.2

### Step 1 — Add `BroadcastChannel` listener to `market_screen.html`

**Action:** Add inside the `<script>` block, after the STATE section:
```js
let lastBroadcast = null;
const hormuzChannel = new BroadcastChannel('hormuz-game');
hormuzChannel.onmessage = function(e) {
  const msg = e.data;
  lastBroadcast = msg;
  yesProb = (100 - msg.shipProbability) / 100;
  document.getElementById('tick4').textContent =
    'LANE ' + msg.lane.toUpperCase() + ' · SHIP PROB ' + msg.shipProbability + '%';
  document.getElementById('roundNum').textContent = msg.round.number || '—';
  document.getElementById('roundTimer').textContent = msg.round.phase.toUpperCase();
};
```
**Visible change:** When `index.html` is open in another tab, `market_screen.html` updates `tick4`, `roundNum`, and `roundTimer` on every weapon fire and every 20-second tick.
**If skipped:** No live data arrives; page stays on dummy values.

### Step 2 — Remove drift logic from `tick()`

**Action:** Delete the 4 drift lines from `tick()`:
```js
// DELETE these:
const drift = (Math.random() - 0.5) * 0.008;
const reversion = (0.5 - yesProb) * 0.002;
yesProb = Math.max(0.05, Math.min(0.95, yesProb + drift + reversion));
```
**Visible change:** `yesProb` no longer wanders randomly — it holds the last broadcast value between broadcasts. Chart still animates smoothly at 160ms.
**If skipped:** Drift fights the broadcast values; prob wanders away from `shipProbability` between weapon fires.

### Step 3 — Remove fake ticker increments from `tick()`

**Action:** Delete from `tick()`:
```js
// DELETE these:
simTick++;
totalVol += Math.floor(Math.random() * 120);
document.getElementById('tick3').textContent = 'SIM TICK ' + simTick;
document.getElementById('totalVol').textContent = '$' + totalVol.toLocaleString();
```
Also delete the fake `roundSec` countdown block (the `roundSec = Math.max(...)` lines). Set `tick3` to a static string in the initial HTML: `SIM TICK —`.
**Visible change:** Footer stops fake-incrementing. `tick3` shows static `SIM TICK —`.
**If skipped:** Fake counters keep running, looking like real data.

### Step 4 — Hide player tables in CSS

**Action:** Add to the `<style>` block:
```css
.player-table { display: none; }
```
**Visible change:** Player rows disappear; charts expand to fill the space.
**If skipped:** Fake audience names visible on projection.

### Step 5 — Write `tests/subphase-1-2-listener.html`

**Action:** Minimal throwaway test page that opens `BroadcastChannel('hormuz-game')` and logs received messages to a visible `<pre>` element. Open alongside `index.html` to confirm messages arrive on weapon fire and tick.
**Visible change:** Log entries appear in the test page each time a weapon fires or 20s elapses.
**If skipped:** No way to verify 1.1 and 1.2 are working without reading browser console.

---

## Grill Report: Subphase 2.1 — Node + Express + WebSocket server

### Q1: What transport do bets use?

**Options:** (a) REST POST /bet for placing bets, WebSocket for receiving broadcasts — two transports, clean separation, (b) WebSocket only — bets sent as WS messages on the same connection that receives state, (c) WebSocket with HTTP fallback
**Decision:** Option (a) — REST POST /bet + WebSocket broadcast
**Rationale:** `fetch()` POST is one line in `audience.html` with a built-in confirmation response; no connection lifecycle to manage for the sending side.
**Consequence:** `audience.html` uses `fetch('/bet', {method:'POST',...})` to place bets and a separate `WebSocket` to receive live `marketPrice` updates.

### Q2: What port does the server run on locally?

**Options:** (a) 3000 — Node convention, overridden by `process.env.PORT` on Render, (b) 8080 — common alternative, (c) env-only, no default
**Decision:** Option (a) — port 3000, `const port = process.env.PORT ?? 3000`
**Rationale:** Convention, matches Render's documentation examples, and the `?? 3000` default already satisfies the Part 3 deploy-readiness requirement with no extra work.
**Consequence:** Local dev URL is `http://localhost:3000`; phones on the same WiFi use `http://[laptop-ip]:3000`.

### Q3: Does `betsOpen / betsClosed` reset between rounds?

**Options:** (a) `POST /reset` endpoint — operator resets bets explicitly between rounds, (b) bets cumulative across entire session, (c) auto-reset on a timer
**Decision:** Option (a) — explicit `POST /reset` endpoint, every round is a fresh start
**Rationale:** Cumulative bets lose responsiveness by round 3; auto-timer is unconnected to actual round boundaries; explicit operator control is already established by the START/PAUSE/RESET pattern in index.html.
**Consequence:** `POST /reset` zeros `betsOpen`, `betsClosed`, resets `marketPrice` to 0.5, broadcasts the reset state. Operator calls it between rounds (a button in `audience.html` or direct URL hit).

### Q4: Does `server.js` serve `audience.html` as a static file?

**Options:** (a) Yes — `express.static('.')` serves all files from repo root; phones hit `http://[laptop-ip]:3000/audience.html`, (b) No — separate static server process, (c) No — audience.html on CDN
**Decision:** Option (a) — `express.static('.')` at repo root
**Rationale:** One process, one port, one URL for the operator to share with the audience; relative paths work the same locally and on Render.
**Consequence:** Phones only need the laptop's IP and port 3000. All static files (audience.html, market_screen.html, js/*) are reachable. On Render, the same static serving works because the full repo is deployed.

### Decided without grilling

- **Broadcast shape**: full state `{ marketPrice, betsOpen, betsClosed, connectedCount }` broadcast to every WS client on every bet and every reset.
- **CORS**: `Access-Control-Allow-Origin: *` on all routes — needed when `index.html` or `market_screen.html` run from `file://` while server is on `localhost:3000`.

---

## Implementation Plan: Subphase 2.1

### Step 1 — `git init` and `.gitignore`

**Action:** Run `git init` at repo root. Create `.gitignore` with `node_modules/` and `.env`.
**Visible change:** `.git/` folder appears; `git status` works.
**If skipped:** Subphase 3.2 (GitHub push) is impossible; `node_modules` risks being committed.

### Step 2 — `package.json`

**Action:** Create `package.json` at root with `"start": "node server.js"` and dependencies `express` and `ws`. Run `npm install`.
**Visible change:** `node_modules/` appears.
**If skipped:** `server.js` cannot `require('express')` or `require('ws')`; server won't start.

### Step 3 — `server.js`

**Action:** Create `server.js` at root with:
- `const port = process.env.PORT ?? 3000`
- Server state: `{ marketPrice: 0.5, betsOpen: 0, betsClosed: 0, connectedCount: 0 }`
- `express.static('.')` to serve all static files
- `Access-Control-Allow-Origin: *` on all responses
- `GET /healthz` → `{ status: 'ok' }`
- `POST /bet` → increments `betsOpen` or `betsClosed`, recomputes `marketPrice = betsOpen / (betsOpen + betsClosed)`, calls `broadcast()`
- `POST /reset` → zeros counters, resets `marketPrice` to 0.5, calls `broadcast()`
- `broadcast()` → sends `{ marketPrice, betsOpen, betsClosed, connectedCount }` to all open WS clients
- WebSocket server attached to same HTTP server, tracks `connectedCount`
**Visible change:** `node server.js` starts and logs the port.
**If skipped:** Nothing runs; all downstream subphases are blocked.

### Step 4 — Verify with curl / browser

**Action:** `node server.js`, then: `curl localhost:3000/healthz`, `curl -X POST localhost:3000/bet -H "Content-Type: application/json" -d '{"side":"open"}'`, open `http://localhost:3000` in browser.
**Visible change:** `/healthz` returns `{"status":"ok"}`; `/bet` returns confirmation and logs updated state; browser loads `index.html` from the static server.
**If skipped:** No verification that the server actually works before building audience.html on top of it.

---

## Part 2 — audience betting server (greenfield, local only)

Get the whole audience-betting mechanic working on localhost before touching
deployment at all. This mirrors `issues/11` — check that issue for any spec
detail before starting, in case there's already more written there than
what's captured here.

### Subphase 2.1 — server + marketState

**Type:** AFK

**What to build:** a Node + Express + WebSocket server holding the market
layer's state, entirely separate from `marketState` in `game-state.js`.

**Acceptance criteria**
- [ ] Confirm git is already initialized at root (likely yes — skip
  `git init` if so)
- [ ] `package.json` created at root: `"start": "node server.js"`,
  dependencies `express` and `ws`
- [ ] `.gitignore` excludes `node_modules` and any `.env` file
- [ ] `server.js` created at root, holding
  `{ marketPrice, betsOpen, betsClosed, connectedCount }`
- [ ] `POST /bet` (or equivalent WS message) increments the right counter
  and recomputes `marketPrice = betsOpen / (betsOpen + betsClosed)`
- [ ] `broadcast()` pushes the updated state to every connected client
- [ ] `GET /healthz` returns `{ status: "ok" }`
- [ ] Test: `node server.js` starts cleanly on the default local port

**Blocked by:** nothing

### Subphase 2.2 — audience-facing page

**Type:** AFK

**What to build:** `audience.html`, the page a phone actually loads.

**Acceptance criteria**
- [ ] `audience.html` created at root: mobile-friendly, shows the contract
  question and live `marketPrice`
- [ ] Two buttons, OPEN and CLOSED
- [ ] A tap sends a bet to the server built in 2.1
- [ ] Page listens for broadcasts and re-renders `marketPrice` with no
  page refresh

**Blocked by:** Subphase 2.1

## Grill Report: Subphase 2.2 — audience.html

### Q1: Should audience.html use relative URLs?

**Options:** (a) Relative URLs — `fetch('/bet')` and `new WebSocket('ws://' + location.host)`, (b) Hardcode `localhost:3000` for now, swap in Part 3, (c) Use `js/config.js` with `SERVER_URL` now
**Decision:** Option (a) — relative URLs everywhere
**Rationale:** `express.static('.')` was chosen in 2.1 precisely so this would work — a phone hitting `http://192.168.1.5:3000/audience.html` already knows its host; hardcoding breaks immediately on any device that isn't the server.
**Consequence:** No config file needed; audience.html works identically locally, on any LAN device, and on Render with zero changes.

### Q2: One bet per round or unlimited?

**Options:** (a) Unlimited — every tap sends `POST /bet`, (b) One bet per round — disable buttons after first tap, re-enable on reset broadcast, (c) Toggle — tapping switches your bet, requires server-side session tracking
**Decision:** Option (a) — unlimited bets
**Rationale:** Real prediction markets let you keep trading; unlimited bets is closer to actual market mechanics and truer to the thesis.
**Consequence:** No `hasBet` flag needed; no per-session tracking on server; button state is purely cosmetic (flash on tap, then reset).

### Q3: What does the page show beyond marketPrice and buttons?

**Options:** (a) Minimal — contract question, marketPrice, two buttons only, (b) Also show room split (betsOpen · betsClosed), (c) Also show connectedCount, (d) All of the above
**Decision:** Option (a) — minimal
**Rationale:** The room split and connected count are already visible on market_screen.html (the wall projection); phones just need the action interface.
**Consequence:** Simplest possible DOM — three elements. No state display beyond the live price number.

### Q4: Visual direction?

**Options:** (a) Dark — black background, large tap targets, high contrast, (b) Match market_screen.html — white, IBM Plex Mono, financial aesthetic
**Decision:** Option (a) — dark
**Rationale:** The Movement Lab will be dim; white screens on every phone creates glare and washes out the projection; dark also visually distinguishes "your device" from "the wall."
**Consequence:** Black background, large minimum tap target (60px+ buttons), no small text. Font choice free — legibility over consistency.

### Q5: What happens after a tap?

**Options:** (a) Brief button flash (~300ms highlight) confirming tap registered, then back to normal, (b) Persistent highlight showing last bet direction, (c) No visual feedback beyond marketPrice updating
**Decision:** Option (a) — brief button flash
**Rationale:** Bridges the network latency gap without implying a locked state, which would be dishonest to the unlimited-bets mechanic.
**Consequence:** CSS class added/removed on tap with a short timeout; no persistent client-side bet state needed.

---

## Implementation Plan: Subphase 2.2

### Step 1 — Create `audience.html` at repo root

**Action:** New file. Dark background (`#0a0a0a`), viewport meta for mobile. Three sections: contract question (small text, top), `marketPrice` display (large number, center), two full-width buttons OPEN / CLOSED (bottom half). WebSocket opened on `ws://` + `location.host`. `POST /bet` on button tap with flash feedback.

**Visible change:** Phone loads `http://[ip]:3000/audience.html` and sees the betting interface.
**If skipped:** Audience has no way to place bets.

### Step 2 — WebSocket listener updates marketPrice

**Action:** `ws.onmessage` parses broadcast `{ marketPrice }` and updates the displayed number in real time.

**Visible change:** When another phone bets, every open `audience.html` updates its price display without reload.
**If skipped:** Price is static after page load; audience sees no live movement.

### Step 3 — POST /bet on button tap + flash

**Action:** Each button calls `fetch('/bet', { method:'POST', body: JSON.stringify({ side: 'open'|'closed' }) })`. On tap: add a `.flash` CSS class, remove after 300ms.

**Visible change:** Tap → button highlights briefly → marketPrice updates via WS broadcast.
**If skipped:** Bets never reach the server.

### Step 4 — Write `tests/subphase-2-2-audience.html`

**Action:** Browser-based verification page: opens a WS connection to `ws://localhost:3000`, fires synthetic `POST /bet` calls, confirms the WS broadcast updates the displayed number. Also verifies the flash class is added and removed.

**Visible change:** Test results rendered inline in the page.
**If skipped:** No automated verification that the page wires correctly.

---

### Subphase 2.3 — market_screen.html gains marketPrice

**Type:** AFK

**What to build:** a second, independent data source on the same screen.

**Acceptance criteria**
- [ ] `market_screen.html` opens a WebSocket connection to the local server
  (hardcoded local address for now — URL handling for deploy comes in Part 3)
- [ ] Displays live `marketPrice`
- [ ] Confirmed additive: the existing dummy loop (if 1.2 isn't done yet) or
  the real `shipProbability` display (if it is) is untouched by this change
- [ ] No code path writes to both `marketPrice` and `shipProbability` —
  verify by reading both data flows before marking this done, not by
  assuming it from the architecture

**Blocked by:** Subphase 2.1. Pairs conceptually with Subphase 1.2 for the
full two-number display, but isn't a hard code dependency on it.

### Subphase 2.4 — local end-to-end test

**Type:** AFK

**What to build:** nothing new — this is verification of 2.1 through 2.3
together.

**Acceptance criteria**
- [ ] With `server.js` running, open `audience.html` and `market_screen.html`
  in two tabs
- [ ] Tap a bet, confirm `marketPrice` visibly moves on `market_screen.html`
  within one broadcast
- [ ] If Part 1 is also done: confirm `shipProbability` does not move when
  the bet is placed

**Blocked by:** Subphases 2.2, 2.3 (and 1.2, if the last check above is to
mean anything)

---

## Part 3 — internet hosting

Everything here assumes Part 2 already works on localhost. This is purely
about making the same working code reachable from anywhere.

### Subphase 3.1 — deploy-readiness code

**Type:** AFK

**What to build:** the plumbing that makes the already-correct local server
deployable, without changing how it behaves locally.

**Acceptance criteria**
- [ ] `server.js` port reads from the environment:
  `const port = process.env.PORT ?? 3000;`
- [ ] `render.yaml` added at root: Node web service, build `npm install`,
  start `npm start`, health check path `/healthz`
- [ ] `config.js` created inside `js/` with a single `SERVER_URL` constant,
  local address by default, marked `// REPLACE AFTER DEPLOY`
- [ ] `audience.html` and `market_screen.html` updated to read `SERVER_URL`
  from `js/config.js` instead of any hardcoded address
- [ ] Connection logic auto-selects `ws://` for a local address and `wss://`
  for any `https` address
- [ ] Test: with `SERVER_URL` still pointing at localhost, behavior is
  identical to Subphase 2.4 — no regression

**Blocked by:** Subphase 2.4

### Subphase 3.2 — GitHub repo and push

**Type:** HUMAN

- [ ] Create a new empty GitHub repo (no README/license, to avoid a merge
  conflict with the existing local history)
- [ ] `git remote add origin <repo-url>` then `git push -u origin main`

**Blocked by:** Subphase 3.1

### Subphase 3.3 — Render account and deploy

**Type:** HUMAN

- [ ] Sign up at render.com — free tier, no card required
- [ ] New → Web Service → connect the repo (build/start commands should
  auto-detect from `render.yaml`)
- [ ] Select the free instance type, deploy
- [ ] Copy the live URL Render assigns

**Blocked by:** Subphase 3.2

### Subphase 3.4 — wire the live URL in

**Type:** HUMAN

- [ ] Open `js/config.js`, replace the placeholder `SERVER_URL` with the
  real Render URL — one line, no Claude Code needed (ask it to do this
  instead if you'd rather not edit directly)
- [ ] Push the change, confirm Render redeploys

**Blocked by:** Subphase 3.3

### Subphase 3.5 — cross-network verification

**Type:** HUMAN

- [ ] Phone on cellular data, laptop on its own WiFi — genuinely separate
  networks, not the same one
- [ ] Place a bet, confirm `marketPrice` updates on `market_screen.html` live
- [ ] Confirm `shipProbability` is untouched

**Blocked by:** Subphase 3.4

---

## Part 4 — show day

### Subphase 4.1 — paid tier decision

**Type:** HUMAN

- [ ] Based on the wake-up delay actually felt in 3.5, decide between
  staying on the free tier or upgrading to Render's Starter (~$7/month, no
  sleep) — a dashboard toggle either way, no redeploy needed

**Blocked by:** Subphase 3.5

### Subphase 4.2 — email distribution

**Type:** HUMAN

- [ ] Draft the invite email with the link
- [ ] Send a test to yourself, open on a phone browser, confirm it renders
- [ ] Send to the guest list, timed so it's not more than ~15 minutes before
  people will actually click (matters only if staying on the free tier)

**Blocked by:** Subphase 3.5

### Subphase 4.3 — final show-day checklist

**Type:** HUMAN

- [ ] Visit the URL (or `/healthz`) once 10-15 minutes before doors open to
  wake a sleeping free-tier instance
- [ ] Confirm `market_screen.html` is showing both `shipProbability` and
  `marketPrice` correctly on the projector
- [ ] Confirm `detector.html`'s webcam detection is correctly firing weapons
  into `index.html`
- [ ] Run one full practice round end to end before the audience arrives

**Blocked by:** Subphases 4.1, 4.2