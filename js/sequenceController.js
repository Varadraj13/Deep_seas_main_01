// ================================================================
//  SEQUENCE CONTROLLER — Deep Seas 17-sequence pre-show (Mode 01)
//  Loaded by initial01/02/03.html. Pure functions first (Node-testable
//  via the module.exports guard, exactly like js/trigger-gate.js), then
//  a thin browser glue layer (runs only when `document` exists).
// ================================================================

// ── Pure functions ─────────────────────────────────────────────

// Role for a page URL. initial01→left, initial02→center, initial03→right.
function resolvePagePath(pathname) {
  const p = String(pathname || '');
  if (p.indexOf('initial01') !== -1) return 'left';
  if (p.indexOf('initial02') !== -1) return 'center';
  if (p.indexOf('initial03') !== -1) return 'right';
  return null;
}

// Live page each role hands off to when the pre-show completes.
function handoffTargetForRole(role) {
  return {
    left:   'simulator.html',
    center: 'detector.html',
    right:  'market_screen.html'
  }[role] || null;
}

// The sequence whose window contains `elapsed` (seconds). Windows are
// [start, end): start-inclusive, end-exclusive — EXCEPT the final sequence's
// end is inclusive (so 263 still resolves). null if elapsed<0 or past final end.
function activeSequenceForElapsed(sequences, elapsed) {
  if (!Array.isArray(sequences) || !sequences.length) return null;
  if (typeof elapsed !== 'number' || isNaN(elapsed) || elapsed < 0) return null;
  const last = sequences[sequences.length - 1];
  if (elapsed > last.end) return null;
  if (elapsed === last.end) return last;
  for (const s of sequences) {
    if (elapsed >= s.start && elapsed < s.end) return s;
  }
  return null;
}

// Build a loadable asset URL. encodeURI handles the space in the real folder
// name ("assets/complete sequence/ppt exports/") so it never 404s.
function resolveAssetPath(assetFolder, filename) {
  return encodeURI(String(assetFolder || '') + String(filename || ''));
}

// How to render a file: mp4 → <video>, everything else (png/gif) → <img>.
function mediaKindForFile(filename) {
  return /\.mp4$/i.test(String(filename || '')) ? 'video' : 'image';
}

// Given the screen entry and the filename that just failed to load, return the
// next filename to try, or null when there's nothing left (the fallback failed,
// or no fallback is defined). Two-arg form keeps this pure and testable.
function nextAssetOnError(screenEntry, currentFile) {
  if (!screenEntry) return null;
  const fb = screenEntry.fallback_file;
  if (!fb) return null;
  if (currentFile === fb) return null;         // the fallback itself failed → give up
  return fb;                                    // preferred failed → try the fallback
}

// ── Node export guard (same pattern as js/trigger-gate.js) ──────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolvePagePath, handoffTargetForRole, activeSequenceForElapsed,
    resolveAssetPath, mediaKindForFile, nextAssetOnError
  };
}

// ================================================================
//  BROWSER GLUE (runs only in a browser; Node/tests skip this block)
// ================================================================
if (typeof document !== 'undefined') {
(function () {
  const CHANNEL = 'deep-seas-sequence';
  const STORAGE_KEY = 'deepSeasSequenceState';
  const TICK_MS = 250;
  const FADE_MS = 400;

  const role = resolvePagePath(location.pathname) || 'center';
  const isMaster = role === 'center';

  let timeline = null, sequences = [], TOTAL = 263;
  let currentSeqNo = null;
  let lastAttemptedPath = '', missing = false, debugOn = false;
  let handedOff = false;

  // Master clock
  let running = false, accumulated = 0, startedAt = 0;
  let audioEl = null;

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;

  // ── DOM ────────────────────────────────────────────────────────
  const stage = document.getElementById('stage');
  const debugEl = document.getElementById('debugOverlay');

  function elapsedNow() {
    return running ? accumulated + (Date.now() - startedAt) / 1000 : accumulated;
  }

  // ── Rendering (with one fallback attempt) ──────────────────────
  function renderSequence(seqNo) {
    const seq = sequences.find(s => s.sequence === seqNo);
    if (!seq || !stage) return;
    currentSeqNo = seqNo;
    missing = false;
    attemptLoad(seq.screens[role], seq.screens[role].preferred_file);
    updateDebug();
  }

  function attemptLoad(screen, filename) {
    const path = resolveAssetPath(timeline.asset_folder, filename);
    lastAttemptedPath = path;
    const kind = mediaKindForFile(filename);
    const el = document.createElement(kind === 'video' ? 'video' : 'img');
    el.className = 'stage-media';
    el.style.opacity = '0';
    if (kind === 'video') {
      el.autoplay = true; el.muted = true; el.loop = true;
      el.playsInline = true; el.setAttribute('playsinline', '');
    }
    const onReady = () => { swapIn(el); };
    el.onerror = () => {
      const next = nextAssetOnError(screen, filename);
      if (next) { attemptLoad(screen, next); }
      else { missing = true; showMissing(path); updateDebug(); }
    };
    if (kind === 'video') el.onloadeddata = onReady; else el.onload = onReady;
    el.src = path;
  }

  function swapIn(el) {
    const prev = Array.from(stage.querySelectorAll('.stage-media'));
    stage.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    prev.forEach(p => {
      p.style.opacity = '0';
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, FADE_MS + 50);
    });
  }

  function showMissing(path) {
    stage.querySelectorAll('.stage-media').forEach(p => p.remove());
    if (!debugOn) return; // black screen for the audience; text only in debug mode
    const d = document.createElement('div');
    d.className = 'stage-missing';
    d.textContent = 'MISSING: ' + decodeURI(path);
    stage.appendChild(d);
  }

  // ── Audio (master only, optional; never blocks the visual) ─────
  function playAudioFor(seq) {
    if (!isMaster || !seq || !seq.audio_file) return;
    try {
      if (audioEl) { audioEl.pause(); audioEl = null; }
      audioEl = new Audio(encodeURI(seq.audio_file));
      audioEl.play().catch(() => {}); // no files yet — fail silently
    } catch (e) { /* fail silently */ }
  }

  // ── Sync ───────────────────────────────────────────────────────
  function broadcast(payload) {
    payload.ts = Date.now();
    if (bc) bc.postMessage(payload);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
  }

  function applyCue(seqNo) {
    if (seqNo !== currentSeqNo) renderSequence(seqNo);
  }

  function handleMessage(payload) {
    if (!payload) return;
    if (payload.type === 'complete') { doHandoff(); return; }
    if (typeof payload.sequence === 'number') applyCue(payload.sequence);
    if (payload.type === 'reset') { accumulated = 0; running = false; }
    updateDebug();
  }

  if (bc) bc.onmessage = (e) => handleMessage(e.data);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { handleMessage(JSON.parse(e.newValue)); } catch (err) {}
    }
  });

  // ── Master clock ───────────────────────────────────────────────
  function tick() {
    if (!isMaster || !running) return;
    const el = elapsedNow();
    if (el >= TOTAL) {
      broadcast({ type: 'complete', sequence: sequences.length, elapsed: TOTAL });
      doHandoff();
      return;
    }
    const active = activeSequenceForElapsed(sequences, el);
    if (active && active.sequence !== currentSeqNo) {
      renderSequence(active.sequence);
      playAudioFor(active);
      broadcast({ type: 'cue', sequence: active.sequence, elapsed: el });
    }
    updateDebug();
  }
  if (isMaster) setInterval(tick, TICK_MS);

  // ── Controls (master only) ─────────────────────────────────────
  function ctrlStart()  { if (running) return; startedAt = Date.now(); running = true;
                          const a = activeSequenceForElapsed(sequences, elapsedNow());
                          if (a) { renderSequence(a.sequence); playAudioFor(a); broadcast({ type:'start', sequence:a.sequence, elapsed:elapsedNow() }); } }
  function ctrlPause()  { if (!running) return; accumulated = elapsedNow(); running = false;
                          if (audioEl) audioEl.pause();
                          broadcast({ type:'pause', sequence:currentSeqNo, elapsed:accumulated }); }
  function ctrlResume() { if (running) return; startedAt = Date.now(); running = true;
                          if (audioEl) audioEl.play().catch(()=>{});
                          broadcast({ type:'resume', sequence:currentSeqNo, elapsed:accumulated }); }
  function ctrlReset()  { running = false; accumulated = 0; if (audioEl) { audioEl.pause(); audioEl = null; }
                          renderSequence(1); broadcast({ type:'reset', sequence:1, elapsed:0 }); }
  function ctrlSkip()   { const cur = activeSequenceForElapsed(sequences, elapsedNow());
                          const nextStart = cur ? cur.end : 0;
                          accumulated = nextStart; if (running) startedAt = Date.now();
                          if (nextStart >= TOTAL) { broadcast({ type:'complete', sequence:sequences.length, elapsed:TOTAL }); doHandoff(); return; }
                          const a = activeSequenceForElapsed(sequences, accumulated);
                          if (a) { renderSequence(a.sequence); playAudioFor(a); broadcast({ type:'skip', sequence:a.sequence, elapsed:accumulated }); } }

  function wireControls() {
    const map = { btnStart: ctrlStart, btnPause: ctrlPause, btnResume: ctrlResume, btnReset: ctrlReset, btnSkip: ctrlSkip };
    Object.keys(map).forEach(id => { const b = document.getElementById(id); if (b) b.onclick = map[id]; });
  }

  // ── Hand-off ───────────────────────────────────────────────────
  function doHandoff() {
    if (handedOff) return;
    handedOff = true;
    document.body.classList.add('fade-black');
    const target = handoffTargetForRole(role);
    setTimeout(() => { if (target) location.href = target; }, FADE_MS + 100);
  }

  // ── Debug overlay (per-page, 'D' toggles) ──────────────────────
  function fmtTimecode(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function updateDebug() {
    if (!debugEl) return;
    debugEl.style.display = debugOn ? 'block' : 'none';
    if (!debugOn) return;
    const el = elapsedNow();
    debugEl.textContent =
      'ROLE ' + role.toUpperCase() + (isMaster ? ' (MASTER)' : '') + '\n' +
      'SEQ ' + (currentSeqNo || '—') + ' / ' + sequences.length + '\n' +
      'TIME ' + fmtTimecode(el) + ' / ' + fmtTimecode(TOTAL) + '\n' +
      'ASSET ' + decodeURI(lastAttemptedPath) + '\n' +
      (missing ? 'MISSING ASSET!' : 'ok');
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') { debugOn = !debugOn; updateDebug(); }
  });

  // ── Boot ───────────────────────────────────────────────────────
  fetch('data/timeline_17seq.json')
    .then(r => r.json())
    .then(data => {
      timeline = data;
      sequences = data.sequences;
      TOTAL = data.total_duration_seconds || 263;
      if (isMaster) wireControls();
      renderSequence(1);      // prime sequence 1 on every page for pre-show framing
      updateDebug();
    })
    .catch(err => { console.error('[sequence] failed to load timeline:', err); });
})();
}
