// ================================================================
//  HAND GESTURE CONTROL (MediaPipe) — FIXED + EASYHANDS
// ================================================================
let handMode = false;
let handPinch = false;
let handCursorMarker = null;
let camera = null;
let handsInstance = null;
let easyHandsMode = false;
let easyHandsTargetLine = null;
let easyHandsHighlight = null;
let handSmoothedX = 0.5, handSmoothedY = 0.5;
let mediaPipeReady = false;

const videoEl = document.getElementById('handVideo');
const debugCanvas = document.getElementById('handDebug');
const dctx = debugCanvas.getContext('2d');

// Load MediaPipe scripts dynamically (async, non-blocking)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => { console.warn('[MediaPipe] Failed to load:', src); resolve(); };
    document.head.appendChild(s);
  });
}

async function loadMediaPipe() {
  console.log('[MediaPipe] Loading libraries...');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');

  if (typeof Hands === 'undefined') {
    console.error('[MediaPipe] Hands library failed to load. Hand tracking unavailable.');
    return;
  }
  console.log('%c[MediaPipe] All libraries loaded successfully', 'color: #4ade80; font-weight: bold');
  mediaPipeReady = true;
  initHandTracking();

  // Silently pre-warm camera permission so Hand Mode activation has
  // no second prompt. We ask for the stream, immediately release its
  // tracks (turns the webcam LED off), and let toggleHandMode() open
  // the real MediaPipe camera later.
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => stream.getTracks().forEach(t => t.stop()))
    .catch(err => console.warn('[Camera] pre-warm failed:', err));

  // Hide the slow-load banner if it was ever shown
  const _warn = document.getElementById('mediapipe-warning');
  if (_warn) _warn.classList.remove('show');
}

// Race the load against a 10-second watchdog. If the timeout wins AND
// MediaPipe still isn't ready, show the banner and auto-enable mouse
// drag so the demo stays interactive even on a slow CDN.
const _mpLoadPromise    = loadMediaPipe();
const _mpTimeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 10000));
Promise.race([_mpLoadPromise, _mpTimeoutPromise]).then(winner => {
  if (winner === 'timeout' && !mediaPipeReady) {
    console.warn('[MediaPipe] Load exceeded 10s — activating mouse-drag fallback');
    const _warn = document.getElementById('mediapipe-warning');
    if (_warn) _warn.classList.add('show');
    if (!dragMode) toggleDragMode();
  }
});

// MediaPipe hand connections (21 landmarks, standard topology)
const HAND_CONN = [
    [0,1],[1,2],[2,3],[3,4],       // thumb
    [0,5],[5,6],[6,7],[7,8],       // index
    [0,9],[9,10],[10,11],[11,12],   // middle  (was [5,9])
    [0,13],[13,14],[14,15],[15,16], // ring    (was [9,13])
    [0,17],[17,18],[18,19],[19,20], // pinky   (was [13,17])
    [5,9],[9,13],[13,17]            // palm cross-connections
];

function normDist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function isPinchingHand(lm) {
    const d = normDist(lm[4], lm[8]);
    return { pinching: d < CONFIG.PINCH_THRESHOLD, distance: d };
}

function handToLatLng(nx, ny) {
    const mapEl = document.getElementById('map');
    const r = mapEl.getBoundingClientRect();
    // Mirror X axis (webcam is mirrored)
    const px = (1 - nx) * r.width;
    const py = ny * r.height;
    return map.containerPointToLatLng([px, py]);
}

function findNearestVessel(latlng) {
    let best = null, bestD = Infinity;
    for (const v of vessels) {
        const d = map.distance(latlng, v.marker.getLatLng());
        if (d < bestD) { bestD = d; best = v; }
    }
    return { vessel: best, distance: bestD };
}

function chooseVessel(latlng) {
    const { vessel, distance } = findNearestVessel(latlng);
    if (easyHandsMode) {
        // EasyHands: no distance limit
        console.log(`[EasyHands] Nearest ship: ${vessel ? vessel.name + ' (id:' + vessel.id + ')' : 'none'} at ${Math.round(distance)}m — AUTO-GRAB`);
        return vessel;
    }
    console.log(`[Hand] Nearest ship: ${vessel ? vessel.name + ' (id:' + vessel.id + ')' : 'none'} at ${Math.round(distance)}m (radius: ${CONFIG.GRAB_RADIUS}m)`);
    return distance < CONFIG.GRAB_RADIUS ? vessel : null;
}

function grabVessel(v, latlng) {
    console.log(`%c✓ GRABBED SHIP: ${v.name} (id:${v.id})`, 'color: #4ade80; font-weight: bold; font-size: 14px');
    draggingVessel = v;
    dragOriginalPos = { lat: v.marker.getLatLng().lat, lng: v.marker.getLatLng().lng };
    dragWasPaused = !playing;
    if (playing) togglePlay();

    // Show old route
    const remainingRoute = [];
    for (let p = v.progress; p <= 1; p += 0.02) {
        const pt = positionOnRoute(v.route, Math.min(p, 1));
        remainingRoute.push([pt.lat, pt.lng]);
    }
    dragOldRouteLine = L.polyline(remainingRoute, {
        color: '#444444', weight: 2.5, opacity: 0.6, dashArray: '6,4'
    }).addTo(map);

    document.getElementById('dragOverlay').classList.add('show');
}

// Draw hand skeleton manually on debug canvas
function drawHandSkeleton(lm, pinching, pinchDist) {
    const w = debugCanvas.width, h = debugCanvas.height;

    // Draw connections
    dctx.lineWidth = 2;
    for (const [i, j] of HAND_CONN) {
        // Mirror X for display consistency
        const x1 = lm[i].x * w, y1 = lm[i].y * h;
        const x2 = lm[j].x * w, y2 = lm[j].y * h;
        dctx.strokeStyle = pinching ? '#4ade80' : '#38bdf8';
        dctx.beginPath();
        dctx.moveTo(x1, y1);
        dctx.lineTo(x2, y2);
        dctx.stroke();
    }

    // Draw landmarks
    for (let i = 0; i < lm.length; i++) {
        const x = lm[i].x * w, y = lm[i].y * h;
        const isThumbTip = i === 4;
        const isIndexTip = i === 8;
        dctx.beginPath();
        if (isIndexTip) {
            // Cyan highlight for index fingertip
            dctx.arc(x, y, 6, 0, Math.PI * 2);
            dctx.fillStyle = '#22d3ee';
            dctx.fill();
            dctx.strokeStyle = '#fff';
            dctx.lineWidth = 2;
            dctx.stroke();
        } else if (isThumbTip) {
            dctx.arc(x, y, 5, 0, Math.PI * 2);
            dctx.fillStyle = pinching ? '#4ade80' : '#f59e0b';
            dctx.fill();
        } else {
            dctx.arc(x, y, 3, 0, Math.PI * 2);
            dctx.fillStyle = pinching ? '#4ade80' : '#f87171';
            dctx.fill();
        }
    }

    // Draw line between thumb and index tip
    const tx = lm[4].x * w, ty = lm[4].y * h;
    const ix = lm[8].x * w, iy = lm[8].y * h;
    dctx.setLineDash([4, 4]);
    dctx.strokeStyle = pinching ? '#4ade80' : '#f59e0b';
    dctx.lineWidth = 2;
    dctx.beginPath();
    dctx.moveTo(tx, ty);
    dctx.lineTo(ix, iy);
    dctx.stroke();
    dctx.setLineDash([]);

    // Text overlay: pinch status
    dctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    dctx.fillStyle = pinching ? '#4ade80' : '#f87171';
    dctx.fillText(`PINCH: ${pinching ? 'YES' : 'NO'}`, 10, 20);
    dctx.fillStyle = '#e2e8f0';
    dctx.font = '12px Helvetica, Arial, sans-serif';
    dctx.fillText(`Dist: ${pinchDist.toFixed(3)} (thr: ${CONFIG.PINCH_THRESHOLD})`, 10, 38);

    if (draggingVessel) {
        dctx.fillStyle = '#f59e0b';
        dctx.font = 'bold 13px Helvetica, Arial, sans-serif';
        dctx.fillText(`DRAGGING: ${draggingVessel.name}`, 10, 56);
    }
}

// Update EasyHands targeting visuals
function updateEasyHandsVisuals(latlng) {
    const { vessel, distance } = findNearestVessel(latlng);

    // Clean up old visuals
    if (easyHandsTargetLine) { map.removeLayer(easyHandsTargetLine); easyHandsTargetLine = null; }
    if (easyHandsHighlight) { map.removeLayer(easyHandsHighlight); easyHandsHighlight = null; }

    if (!vessel || draggingVessel) return;

    const shipPos = vessel.marker.getLatLng();

    // Cyan dotted line from cursor to nearest ship
    easyHandsTargetLine = L.polyline([[latlng.lat, latlng.lng], [shipPos.lat, shipPos.lng]], {
        color: '#22d3ee', weight: 2, opacity: 0.7, dashArray: '6,4', interactive: false
    }).addTo(map);

    // Cyan highlight ring around nearest ship
    easyHandsHighlight = L.circleMarker(shipPos, {
        radius: 14, color: '#22d3ee', fillColor: '#22d3ee',
        fillOpacity: 0.15, weight: 2, interactive: false
    }).addTo(map);

    // Show target info on debug canvas
    dctx.fillStyle = '#22d3ee';
    dctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    const distKm = (distance / 1000).toFixed(1);
    dctx.fillText(`TARGET: ${vessel.name} (${distKm}km)`, 10, debugCanvas.height - 14);
}

// Clear EasyHands visuals
function clearEasyHandsVisuals() {
    if (easyHandsTargetLine) { map.removeLayer(easyHandsTargetLine); easyHandsTargetLine = null; }
    if (easyHandsHighlight) { map.removeLayer(easyHandsHighlight); easyHandsHighlight = null; }
}

function initHandTracking() {
  console.log('[MediaPipe] Initializing hand tracking...');
  handsInstance = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  handsInstance.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
  });

  handsInstance.onResults((res) => {
    dctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    if (res.image) dctx.drawImage(res.image, 0, 0, debugCanvas.width, debugCanvas.height);

    if (!handMode) return;

    if (!res.multiHandLandmarks || !res.multiHandLandmarks.length) {
        // No hand detected — show warning
        dctx.font = 'bold 16px Helvetica, Arial, sans-serif';
        dctx.fillStyle = '#f87171';
        dctx.fillText('NO HAND DETECTED', 10, 30);
        dctx.font = '12px Helvetica, Arial, sans-serif';
        dctx.fillStyle = '#94a3b8';
        dctx.fillText('Show your hand to the camera', 10, 50);
        return;
    }

    const lm = res.multiHandLandmarks[0];
    const tip = lm[8]; // index finger tip
    const { pinching, distance: pinchDist } = isPinchingHand(lm);

    console.log(`[Hand] Pinch distance: ${pinchDist.toFixed(3)}, Pinching: ${pinching}`);

    // Smooth cursor position
    handSmoothedX += (tip.x - handSmoothedX) * CONFIG.HAND_SMOOTH;
    handSmoothedY += (tip.y - handSmoothedY) * CONFIG.HAND_SMOOTH;

    const latlng = handToLatLng(handSmoothedX, handSmoothedY);
    console.log(`[Hand] Fingertip norm: ${handSmoothedX.toFixed(3)}, ${handSmoothedY.toFixed(3)} -> Map: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);

    // Draw hand skeleton on debug canvas
    drawHandSkeleton(lm, pinching, pinchDist);

    // Determine cursor color
    const cursorColor = easyHandsMode ? '#22d3ee' : '#4ade80';
    const cursorPinchColor = '#f59e0b';

    // Update cursor marker on map
    if (!handCursorMarker) {
        handCursorMarker = L.circleMarker(latlng, {
            radius: 8, color: cursorColor, fillColor: cursorColor,
            fillOpacity: 0.6, interactive: false
        }).addTo(map);
    } else {
        handCursorMarker.setLatLng(latlng);
    }

    handCursorMarker.setStyle({
        color: pinching ? cursorPinchColor : cursorColor,
        fillColor: pinching ? cursorPinchColor : cursorColor,
        radius: pinching ? 12 : 8
    });

    // EasyHands targeting visuals (when not dragging)
    if (easyHandsMode && !draggingVessel) {
        updateEasyHandsVisuals(latlng);
    }

    // === PINCH START: grab a vessel ===
    if (pinching && !handPinch) {
        console.log(`%c[Hand] PINCH START — Distance: ${pinchDist.toFixed(3)}`, 'color: #f59e0b; font-weight: bold');
        console.log(`[Hand] Finding nearest ship to: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);

        if (!draggingVessel) {
            const v = chooseVessel(latlng);
            if (v) {
                clearEasyHandsVisuals();
                grabVessel(v, latlng);
            } else {
                console.log(`%c✗ GRAB FAILED: No ship within radius`, 'color: #f87171; font-weight: bold');
                console.log(`[Hand] draggingVessel: null`);
            }
        } else {
            console.log(`[Hand] Already dragging: ${draggingVessel.name} (id:${draggingVessel.id})`);
        }
    }

    // === DURING PINCH: drag vessel ===
    if (pinching && draggingVessel) {
        draggingVessel.marker.setLatLng(latlng);
        const destPoint = draggingVessel.route[draggingVessel.route.length - 1];
        const newRoute = buildRouteThrough(latlng, destPoint);
        dragNewRoute = newRoute;

        if (dragPreviewLine) map.removeLayer(dragPreviewLine);
        dragPreviewLine = L.polyline(newRoute.map(p => [p[0], p[1]]), {
            color: '#4ade80', weight: 3, opacity: 0.8, dashArray: '4,4'
        }).addTo(map);

        dragFinancials = calcRouteFinancials(draggingVessel, newRoute);
        updateDragOverlay(dragFinancials);
    }

    // === PINCH RELEASE ===
    if (!pinching && handPinch) {
        console.log(`%c[Hand] PINCH RELEASE`, 'color: #38bdf8; font-weight: bold');
        // Overlay stays open for Confirm/Cancel
    }

    handPinch = pinching;
  });

  console.log('%c[MediaPipe] Hand tracking initialized', 'color: #4ade80; font-weight: bold');
} // end initHandTracking

function toggleHandMode() {
    if (!mediaPipeReady) {
        console.warn('[Hand Mode] MediaPipe not loaded yet. Please wait...');
        alert('Hand tracking libraries are still loading. Please try again in a moment.');
        return;
    }
    handMode = !handMode;
    const btn = document.getElementById('btnHand');

    if (handMode) {
        btn.classList.add('active');
        btn.textContent = '\u270B Hand: ON';
        debugCanvas.style.display = 'block';
        console.log('%c[Hand Mode] ENABLED', 'color: #4ade80; font-weight: bold; font-size: 14px');
        if (!camera) {
            camera = new Camera(videoEl, {
                onFrame: async () => {
                    try { await handsInstance.send({ image: videoEl }); }
                    catch(e) { console.error('[Hand] Frame error:', e); }
                },
                width: 640, height: 480
            });
            camera.start();
            console.log('[Hand] Camera started');
        }
    } else {
        btn.classList.remove('active');
        btn.textContent = '\u270B Hand Mode';
        debugCanvas.style.display = 'none';
        console.log('%c[Hand Mode] DISABLED', 'color: #f87171; font-weight: bold; font-size: 14px');
        if (handCursorMarker) {
            map.removeLayer(handCursorMarker);
            handCursorMarker = null;
        }
        clearEasyHandsVisuals();
        // Auto-disable EasyHands
        if (easyHandsMode) {
            easyHandsMode = false;
            document.getElementById('btnEasyHands').classList.remove('active');
            document.getElementById('btnEasyHands').textContent = '\uD83C\uDFAF EasyHands';
        }
    }
}

function toggleEasyHands() {
    easyHandsMode = !easyHandsMode;
    const btn = document.getElementById('btnEasyHands');

    if (easyHandsMode) {
        btn.classList.add('active');
        btn.textContent = '\uD83C\uDFAF Easy: ON';
        console.log('%c[EasyHands] ENABLED — pinch anywhere to grab nearest ship', 'color: #22d3ee; font-weight: bold; font-size: 14px');
        // Auto-enable Hand Mode
        if (!handMode) {
            toggleHandMode();
        }
    } else {
        btn.classList.remove('active');
        btn.textContent = '\uD83C\uDFAF EasyHands';
        console.log('%c[EasyHands] DISABLED', 'color: #94a3b8; font-weight: bold');
        clearEasyHandsVisuals();
    }
}

// Keyboard shortcuts for hand modes
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'KeyG') toggleHandMode();
    if (e.code === 'KeyE') toggleEasyHands();
});
