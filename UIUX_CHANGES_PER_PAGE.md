# Deep Seas — UI/UX Changes Per Page (from the phase-wise PDF board)

Every annotation from the PDF, organized per page. ▢ = from your board · ✦ = my suggestion.
Where the board note is ambiguous I've noted the interpretation.

---

## 0. Global / cross-page (applies to the whole show)

**From the board:**
- ▢ **One coherent font hierarchy across every page** — "the font needs to be consistent with the rest of the pages → one coherent font hierarchy all over the show — repeated."
- ▢ **Common navigation across all pages** — the control-center nav "needs to go above and be common to all the pages."
- ▢ "In terms of the UX this needs to become more beautiful" (written across the simulator, but the intent reads show-wide).

**Suggested:**
- ✦ Adopt a two-family system and stop there: **IBM Plex Mono** for all UI/data chrome (5 pages already use it) + **Playfair Display** only for broadcast editorial (detector headlines). Kill Helvetica/Arial in `css/main.css` and generic `monospace` in simulator. Fix `audience.html`, which *declares* IBM Plex Mono but never loads the font — phones currently render default monospace.
- ✦ Encode the hierarchy as CSS variables in one shared stylesheet (`--font-ui`, `--font-editorial`, sizes for label/value/title) so "consistent" survives the next redesign.
- ✦ Make the common nav a tiny shared strip (fixed top, 32px, current page highlighted) injected by one JS file — not copy-pasted markup ×7 pages.
- ✦ Define one color grammar show-wide: red = disruptor/negative only, green = defender/positive only, amber = market/Bloomberg. Several pages currently use red as decoration (simulator title, control-center panel titles), which dilutes the "red = danger" signal on show day. // love all of the suggestion in here.

---

## 1. simulator.html (map / projection screen)

**From the board:**
- ▢ **Boot state**: page must open at exactly the annotated zoom/framing **with Global Fishing Watch already on** (currently `gfwVisible = false` until clicked).
- ▢ **Replace the red-cross vessel markers** — "the ship position indication is a red cross and not helping at all → should I just switch to like small ship PNGs floating around."
- ▢ **Header stats block** (the "STRAIT OF HORMUZ / TRAFFIC CONTROL SYS" card stays) should show *simple stats that show the condition of the strait*: ① average speed of vessel movement, ② total economic activity in the strait waters, ③ number of vessels moving through the strait.
- ▢ **Fix a baseline speed in knots** — "let's decide on a fixed speed in KN → which is the normal speed applicable for all the normal scenarios" (so deviations from it read as *events*).
- ▢ **Ship reactions must be legible** — "the action/behaviour of the ship is very vague — it's not apparent — we need to make a **list of how the ships change their behaviours graphically based on the weapons being triggered**" (you sketched this as a DATABASE table).
- ▢ Vessel labels circled (MAERSK STAR etc.) — the stacked name/type/speed boxes clutter the strait at boot zoom.
- ▢ Keep the bottom-left dataset caption (visible in your screenshot: "routes derived from 2023–2024 AIS patterns · Global Fishing Watch · each marker represents one vessel"). *Note: this caption is only on your local copy — it isn't committed.*
- ▢ (Carried from phase-01, still open) probability/odds/outcome score moves to control-center; keep the simulation screen "very very clean." // This slaps - very very good.

**Suggested:**
- ✦ The "list of graphical ship behaviors" should be a `visual_effect` field **inside weapons-config.js** so the dataset, the sim, and the docs can't drift. Build only the 5 legible ones: halt/slow (exists), fleet thinning (exists), tankers vanish (D03), port node flash + queue (D04), Cape reroute polyline (R03). Skip effects nobody can see from the audience. // lets do this.
- ✦ Fix the `Math.min` multiplier bug before styling anything — R01 escort currently *cannot* visually release ships while D01 is active, so the most dramatic beat of the show (defender saves the strait) never renders. // perfect
- ✦ Ship PNGs: one 12–16px hull sprite rotated to heading (`L.icon` + CSS `transform: rotate`), tinted per vessel type to keep the legend meaningful. Labels: hide at zoom ≤7, show on hover/selection only — that de-clutters the boot frame without losing detail on zoom-in. // Okay - I will do this.
- ✦ Baseline speed: pick **15 kn** (already the header's Avg KN default) and render the stat as deviation — "AVG 14.8 KN · NOMINAL" vs "AVG 3.1 KN ▼ BLOCKADE" — condition-of-the-strait in one glance. // slaps
- ✦ Economic activity stat: you already compute per-vessel cargo value (`financials.js`) — surface the sum as `$4.2B IN TRANSIT` and let weapon multipliers move it visibly. // better than the individual ones.
- ✦ GFW purple/yellow heat + dark basemap swallows small markers; add a 1px white outline to ship sprites (cheap, huge legibility gain on projector). // perfect

---

## 2. detector.html (broadcast console / news screen)

**From the board:**
- ▢ **① Auto-start the camera on page load** — "need to enable the camera of the device and embed the passage as soon as the page loads up" (currently click-to-enable). // This should be the same camera start as is the one on the control center and also the one that is reponsible for the vision model to work - in terms of detecting objects and triggering weapons.
- ▢ **② Give the live (04 JUN) Bloomberg column some margin** — it's flush against the table edge. // okay
- ▢ **③ Remove the bottom Bloomberg F1–F12 function footer** — "it's kinda cluttering." // lets do this.
- ▢ **④ Remove the thin line** in the satellite lower-third (above the Gulf dateline). // perfect
- ▢ **⑤ Create the weapon-image folder** — "folder filled with images associated with each weapon trigger → whenever the weapon is triggered, associated image pops up" (satellite panel). Code already points at `Images/broadcast/` + 12 filenames in broadcast-news.js — the folder just doesn't exist. // I will make this folder.
- ▢ BREAKING flag marked "can remove" (soft note). // lets not - breaking is good.
- ▢ Headline ticker + "RESERVES RELEASED" alert + odds % all confirmed as weapon-triggered (annotations, no change requested). // yeah no change.

**Suggested:**
- ✦ Camera autostart works only if the browser has a prior permission grant for the origin — pre-grant it in show setup, and keep the click-to-enable as fallback UI rather than deleting it. // lets make it a part of the phase of implementation.
- ✦ While sourcing 12 satellite JPGs, enforce one visual treatment (same crop ratio, slight desaturation + grain overlay) so stock images read as one "satellite feed," not a mood board. // perfect
- ✦ Wire the orphaned `bloomberg-data.js` into the table — you built per-weapon equity reactions (D05 all-zero freeze, D06 ERR cells) and the table currently shows random sin/cos data with a generic jolt. This is the single biggest "the news reacts to THIS weapon" payoff on the page. // perfect
- ✦ If the F-footer goes, keep the amber `BLOOMBERG PROFESSIONAL` top bar — it's doing the genre-recognition work; the footer was the noise. // okay
- ✦ Idle state: cycle the ticker through `IDLE_ITEMS` slower (audience reads it between rounds); on `0`/Escape reset, fade the satellite to the GWN card rather than cutting. // okay

---

## 3. control-center.html (operator console — your laptop)

**From the board:**
- ▢ **Nav moves to the top and becomes common to all pages**; the Mode 01/02 buttons move with it ("move the entire mode section to the left/top").
- ▢ **Go full-screen top-to-bottom, except the camera** — "for better usability."
- ▢ **"Need to rearrange the UX to make space for all the functions"** — the three-panel row (SIM CONTROLS / DETECTION SYSTEM / camera) is cramped. *(Note: that SIM CONTROLS panel exists only in your local copy — commit it.)*
- ▢ Model dropdown default confirmed: "Final Model — 12 Weapons."
// lets do all of this.
**Suggested:**
- ✦ Layout as a 3-column operator cockpit: left = sim controls + round controls (everything migrating from simulator), center = detection (class bars, threshold, camera), right = game dashboard (probability, last action, active weapons, event log — needs the `actionLog` added to the `hormuz-game` payload). One screen, zero scrolling: matches "make space for all the functions." // perfect
- ✦ Add the two missing show-day controls: an **audience-market panel** (live marketPrice + bet counts + a `/reset` button — today resetting bets requires curl) and a **connection status row** (simulator tab open? detector tab open? Render reachable? — BroadcastChannel has no presence, so ping-pong a heartbeat message). // perfect
- ✦ Big red **PANIC/ALL-CLEAR** button: posts the reset to every channel at once (broadcast UI idle + round pause). When something goes weird live, you want one target to hit. // perfect
- ✦ Keep every operator action keyboard-reachable (you standardized 1–6/a–f already) — mouse-only controls fail under stage pressure. // perfect - This also ensures the weapons being fired in case anything else goes wrong.

---

## 4. market_screen.html (prediction-market display)

**From the board:**
- ▢ **Market state redesign**: starting capital **$50 YES / $50 NO ($100 pool)** — seed the market so it doesn't start empty.
- ▢ **Must be visible**: ① cash inflow/outflow per outcome (real-time tickers), ② money per bettor (leaderboard or transaction log), ③ **two side-by-side graphs: YES money vs NO money over time**.
- ▢ **Replicate the Kalshi structure — "and even functionally"**: payout multiples next to odds (their 1.13x / 7.25x + 87%/13% screenshot), total volume line, price-history chart aesthetic ("graph to look like this," "need to incorporate this aesthetic"). // I can actually provide the image so that the replication can make sense.
- ▢ **Bettor names from signup**: "+ Ipsita added 50 bets / + Rakshit added 40 bets — this will be added based on the signup names." // maybe this will require a database.
- ▢ **"Investment to be added"** (per-side invested totals on the chart). // perf
- ▢ **Remove the bottom sim-status strip** ("HORMUZ FLOW 98% · VESSELS 30 · SIM TICK — · HORMUZ · BEFORE JUN 1") and the **ROUND 1/3 chip**. // makes the whole thing a tad cleaner.
- ▢ **Don't include the news dictating the market** on this screen.
- ▢ "The same probability score also shows the odds of the payouts" — payouts derive from the same number, not a new system.
// perfect
**Suggested:**
- ✦ Payout math that matches the board: multiple = 1/price (YES at 62¢ → 1.61x). Derive it from `marketPrice`; nothing new to invent. Show it Kalshi-style: `YES 62¢ · pays 1.61x`. // perfect.
- ✦ The two YES/NO graphs + tickers + leaderboard all need one server change: give `/bet` a `{side, name}` body, keep a rolling `transactions[]` + per-name totals in server state, include them in the WS payload. Everything on this screen then renders from a single message — no fake `P_MIRA` list, no synthetic sine-wave history. // is there some library you can look up and paste the code from.
- ✦ Replace the hardcoded player rows and `yesHistory` sine data *at the same time* as the redesign — leaving demo data behind a real-looking UI is how a show accidentally displays fake bettors. // perfect
- ✦ Keep ONE quiet link to the sim: the ground-truth price (100 − shipProbability). The divergence between crowd price and ground truth *is the drama of the piece* — losing it entirely (by removing all sim chrome) would waste your best storytelling number. Frame it as "MARKET vs TRUTH · Δ12¢" — that's not "news," it's the scoreboard. // okay
- ✦ Volume line: `$ (betsOpen+betsClosed) × contract size` — already in the WS payload today, just render it.

---

## 5. audience.html (phone betting page)

**From the board:**
- ▢ **Price in dollars, not cents** — "let's keep the starting value to be around **100 USD**."
- ▢ **Convert to the new card layout**: "the system's prediction market" header → question "will the strait of Hormuz stay open or closed?" → big **OPEN – $50** (green) / **CLOSED – $50** (red) buttons.
- ▢ **Add a signup interface (Page 01)**: "Hello! please add your name." + input + submit → "signup page to add name of the people betting on this system."
- ▢ **Contract terms line**: "You're buying 13 contracts at 71¢ each. This market will close when the event occurs…" — filler text for now, keep the slot.
- ▢ **Must be mobile friendly — "currently it's not."**
- ▢ **Actually test on phones / multiple devices in the movement lab.**

**Suggested:**
- ✦ Two-screen flow, name persisted in `localStorage` so a phone refresh doesn't re-ask — with venue Wi-Fi you WILL get refreshes. // okay
- ✦ Fix the failure UX while you're in here: the current `onclose → location.reload()` every 2s becomes a strobe on bad Wi-Fi. Reconnect with exponential backoff + a calm "reconnecting…" pill instead.// okay
- ✦ Make it origin-independent like market_screen (use `SERVER_URL` from js/config.js instead of same-origin WS) — this kills the entire class of "works on my laptop, dead on the phone" bugs and was the root of your "connection broken" note. // okay
- ✦ Bet confirmation beat: tap → button fills → "✓ $50 on OPEN · @Ipsita" toast → price ticks. The phone user must *feel* their bet land, or they'll tap five more times (which, with anonymous counters, currently counts as five bets — consider a small per-device cooldown).// okay
- ✦ Dollars decision: display `$` while keeping the 0–1 price internally (price × $100). Don't migrate server math, just the formatter. // okay
- ✦ Add `<meta name="theme-color" content="#0a0a0a">` and full-height `100dvh` (already there) + disable pull-to-refresh (`overscroll-behavior: none`) — three lines that make it feel like an app on stage. // okay

---

## 6. base.html (weapons manifest / floor display)

**From the board:**
- ▢ **① "Should I be giving an indication of what action is to be performed here?** — like maybe → push the object in this space or something?" (an affordance telling players *what to do* with the physical objects). // maybe not idk
- ▢ **② Retrain the model with the newer screen** and stress-test the action triggers. *(Detection runs in control-center.html — the board's "object detection in the base.html floor space" refers to the physical floor area, not this page's code.)*
- ▢ **③ Objects detected should perform all these actions simultaneously** — confirmed working chain: object → weapon → ships → stats → probability → dependent systems → detector.

**Suggested:**
- ✦ Add a "PLACE OBJECT IN THE ZONE" affordance directly on base.html: a dashed outline + short imperative line per column ("place an object → fire the weapon"), and **highlight the just-fired weapon row** (it already listens to `deepseas-game`; a 2s flash on FIRE_WEAPON is ~10 lines). // My main issue is that if I do that - the object detection model shouldn't interpret it as something like an object - it happens a lot of times - that is why I was preferring the blank screen but lets see.
- ✦ Show a live "DETECTED: BROOM (D03) — 84%" strip at the bottom mirroring control-center's top class — players get instant feedback at the floor without looking at your laptop. - okay - This is good - can refer the objects from the final model file.
- ✦ For retraining: capture training photos *in situ* (same projector light, same camera angle/height as show night) — most TM accuracy loss is lighting/background shift, not the objects. // capure.

---

## Priority order if time is short

1. audience.html rebuild (signup + $ + new buttons + origin-independent WS) — it's the only page the public touches.
2. market_screen real data (seeded pool, names, transactions, payout multiples) — server change unlocks the whole page.
3. Simulator ship legibility (PNG markers, Math.min fix, 3 visible weapon behaviors) — the projector centerpiece.
4. control-center cockpit rearrange + reset/status controls — show-day insurance.
5. detector polish items (footer, margin, line, images folder) — small, do in one pass.
6. Fonts/nav unification — do alongside whichever page you touch last so it lands everywhere at once.

// all of the above is important - I think can be implemented that we have planned it out properly.
