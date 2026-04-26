// ================================================================
//  GLOBAL FISHING WATCH — 4Wings Vessel Density Layer
// ================================================================
console.log('[GFW] Initializing GFW module...');
map.createPane('gfwPane');
map.getPane('gfwPane').style.zIndex = 250;
map.getPane('gfwPane').style.mixBlendMode = 'screen';
map.getPane('gfwPane').style.filter = 'saturate(1.4) contrast(1.2)';
console.log('[GFW] Pane created: zIndex=250, blendMode=screen, filter=saturate+contrast');

const GFW_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJEZWVwIHdhdGVycyIsInVzZXJJZCI6NTY5OTcsImFwcGxpY2F0aW9uTmFtZSI6IkRlZXAgd2F0ZXJzIiwiaWQiOjQ3MTUsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc3MjU4NDQ2NywiZXhwIjoyMDg3OTQ0NDY3LCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.XYKlF1r1eWD8IREjOmpiRqHcQ2WY3OC4rBI-r3LZ7mxZIqyeun89K50M-9CLAYOWqXmfIH8xXQEkv_Pf8Iv5Y0cRRcPU2bR7SrSa-u5eRm-LfuSFY64dH3NJFz20pdqb8qJPOAWnIPB2nkVUV2DbIkCmCX-L4BmINbNnnb3DPu9Oo_K_tv-RWOtGrAXNokHEW5A4gjTqz4xlYgVoiOu-cIUQ77hBlP6eLrwxNm44mYHw1NpgcnwpgpaP3pe79BUAs79oe3lghWWH9OwxI3btwcJjXBpzdcEk_yQHj8lH56lhQMxv6o8liGKPTDTBkab3gmX6D9lRdozVClFoF1Io0XRWHazo15WRf3EwpvqRsgZGWpq9iia-OPKQ65j02Ge0MDR-Nzs_15gx-kCa07Da2EMVddm_sFNhHyxq2OhmFilizw5Zr3xiLS-3z0wHBrPrTViiM2iWfYgSteScWY6xWIact0XaLkfMuZXMSs1fCpnw8FQPfRf_-AHrJtPi-LJ4';
const GFW_STYLE = btoa(JSON.stringify({color:[255,255,255],ramp:[0,387165,1458717,3241694,6662649,12854780,19905449,28902107,65228914]}));

// HSL→RGB helper (h 0-360, s/l 0-1)
function _hsl(h, s, l) {
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs((h / 60) % 2 - 1));
  var m = l - c / 2;
  var r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
// Precompute lookup table: source alpha (0-255) → [r, g, b, a]
var _gfwLUT = new Array(256);
(function() {
  // Stop 1: hsl(285, 100%, 55%) @ opacity 0.5  (alpha 1–40)
  var c1 = _hsl(285, 1.0, 0.55);  // soft purple
  // Stop 2: hsl(45, 100%, 55%) @ opacity 0.75  (alpha 41–120)
  var c2 = _hsl(45, 1.0, 0.55);   // warm yellow
  // Stop 3: hsl(0, 0%, 100%) @ opacity 1.0  (alpha 121–255)
  var c3 = [255, 255, 255];        // white hot
  _gfwLUT[0] = null;
  for (var a = 1; a <= 255; a++) {
    var r, g, b, oa;
    if (a <= 40) {
      // Interpolate within purple band, fading in from transparent
      var t = (a - 1) / 39;  // 0 → 1
      r = c1[0]; g = c1[1]; b = c1[2];
      oa = (0.15 + t * 0.35) * 255;  // 0.15 → 0.5
    } else if (a <= 120) {
      // Smooth purple → yellow
      var t = (a - 41) / 79;  // 0 → 1
      r = c1[0] + (c2[0] - c1[0]) * t;
      g = c1[1] + (c2[1] - c1[1]) * t;
      b = c1[2] + (c2[2] - c1[2]) * t;
      oa = (0.5 + t * 0.25) * 255;   // 0.5 → 0.75
    } else {
      // Smooth yellow → white
      var t = (a - 121) / 134;  // 0 → 1
      r = c2[0] + (c3[0] - c2[0]) * t;
      g = c2[1] + (c3[1] - c2[1]) * t;
      b = c2[2] + (c3[2] - c2[2]) * t;
      oa = (0.75 + t * 0.25) * 255;  // 0.75 → 1.0
    }
    _gfwLUT[a] = [r | 0, g | 0, b | 0, oa | 0];
  }
})();

// Recolor GFW tile using precomputed LUT
function gfwRecolor(ctx, w, h) {
  var id = ctx.getImageData(0, 0, w, h);
  var d = id.data;
  var colored = 0;
  for (var i = 0; i < d.length; i += 4) {
    var a = d[i + 3];
    if (a === 0) continue;
    colored++;
    var c = _gfwLUT[a];
    d[i]     = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = c[3];
  }
  ctx.putImageData(id, 0, 0);
  return colored;
}

let _gfwTileCount = 0;
const GFWLayer = L.GridLayer.extend({
  createTile: function(coords, done) {
    const tileId = ++_gfwTileCount;
    const canvas = document.createElement('canvas');
    const size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;
    const url = 'https://gateway.api.globalfishingwatch.org/v3/4wings/tile/heatmap/'
      + coords.z + '/' + coords.x + '/' + coords.y
      + '?format=PNG&interval=MONTH'
      + '&datasets[0]=public-global-presence:v4.0'
      + '&date-range=2024-01-01,2024-12-31'
      + '&style=' + GFW_STYLE;
    console.log('[GFW] Tile #' + tileId + ' fetching z=' + coords.z + ' x=' + coords.x + ' y=' + coords.y);
    fetch(url, { headers: { 'Authorization': 'Bearer ' + GFW_TOKEN } })
      .then(function(res) {
        console.log('[GFW] Tile #' + tileId + ' response: ' + res.status + ' ' + res.headers.get('content-type'));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(function(blob) {
        console.log('[GFW] Tile #' + tileId + ' blob size: ' + blob.size + ' bytes');
        var img = new Image();
        img.onload = function() {
          var ctx = canvas.getContext('2d');
          ctx.filter = 'blur(0.8px)';
          ctx.drawImage(img, 0, 0, size.x, size.y);
          ctx.filter = 'none';
          URL.revokeObjectURL(img.src);
          var px = gfwRecolor(ctx, size.x, size.y);
          console.log('[GFW] Tile #' + tileId + ' rendered, ' + px + ' colored pixels');
          done(null, canvas);
        };
        img.onerror = function() {
          console.warn('[GFW] Tile #' + tileId + ' image decode failed');
          URL.revokeObjectURL(img.src);
          done(null, canvas);
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch(function(err) {
        console.error('[GFW] Tile #' + tileId + ' fetch error:', err.message || err);
        done(null, canvas);
      });
    return canvas;
  }
});
console.log('[GFW] GFWLayer class defined');

let gfwLayer = null, gfwVisible = false;

// --- GFW Vessel Registry: click-to-query ---
var _gfwVesselTypeColors = {
  FISHING:'#cc0000', CARRIER:'#888888', CARGO:'#666666', TANKER:'#cc0000',
  TUG:'#555555', PASSENGER:'#777777', OTHER:'#444444', BUNKER:'#555555',
  SPECIALIZED:'#999999', SEISMIC_VESSEL:'#666666'
};

function _gfwSonarPing(latlng) {
  var pt = map.latLngToContainerPoint(latlng);
  var el = document.createElement('div');
  el.className = 'gfw-sonar';
  el.style.left = pt.x + 'px';
  el.style.top = pt.y + 'px';
  map.getContainer().appendChild(el);
  setTimeout(function() { el.remove(); }, 1100);
}

function closeGFWPanel() {
  clearVesselResults();
}

function clearVesselResults() {
  var vr = document.getElementById('vessel-results');
  if (vr) vr.style.display = 'none';
  var body = document.getElementById('vrBody');
  if (body) body.innerHTML = '<div class="vr-empty">Click map with GFW active to query vessels</div>';
  var coords = document.getElementById('vrCoords');
  if (coords) coords.textContent = '';
}

function _gfwShowPanel(lat, lng, html) {
  var vr = document.getElementById('vessel-results');
  if (vr) vr.style.display = 'block';
  var coords = document.getElementById('vrCoords');
  if (coords) coords.textContent = lat.toFixed(3) + ', ' + lng.toFixed(3);
  var body = document.getElementById('vrBody');
  if (body) body.innerHTML = html;
}

// Find nearby simulated vessels within a radius (in degrees, ~1° ≈ 111km)
function _gfwNearbySimVessels(lat, lng, radiusDeg) {
  var nearby = [];
  vessels.forEach(function(v) {
    var pos = v.marker.getLatLng();
    var dlat = pos.lat - lat, dlng = pos.lng - lng;
    var dist = Math.sqrt(dlat*dlat + dlng*dlng);
    if (dist <= radiusDeg) {
      nearby.push({ vessel: v, dist: dist, distNm: dist * 60 });
    }
  });
  nearby.sort(function(a,b) { return a.dist - b.dist; });
  return nearby;
}

// Render simulated vessel rows (used as fallback or supplement)
function _gfwRenderSimVessels(nearbyList, label) {
  if (!nearbyList.length) return '<div style="color:#444444;font-size:9px;padding:8px 0;letter-spacing:2px">NO VESSELS IN RANGE</div>';
  var html = '<div style="color:#444444;font-size:8px;text-transform:uppercase;letter-spacing:2px;padding:4px 0 6px;border-bottom:1px solid #1a1a1a">' + label + '</div>';
  html += nearbyList.slice(0, 12).map(function(n) {
    var v = n.vessel;
    return '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #111111">'
      + '<div style="width:4px;height:4px;background:#cc0000;margin-top:5px;flex-shrink:0"></div>'
      + '<div style="min-width:0;flex:1">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline">'
      + '<span style="font-size:10px;color:#fff;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + v.name + '</span>'
      + '<span style="font-size:8px;color:#444444;flex-shrink:0;margin-left:8px">' + n.distNm.toFixed(1) + ' NM</span>'
      + '</div>'
      + '<div style="font-size:8px;color:#666666;font-family:Helvetica,Arial,sans-serif">' + v.flag.code + ' // ' + v.label + ' // ' + v.speed.toFixed(1) + ' KN</div>'
      + '<div style="font-size:8px;color:#444444;font-family:Helvetica,Arial,sans-serif">IMO ' + v.imo + ' // MMSI ' + v.mmsi + '</div>'
      + '<div style="font-size:8px;color:#333333;font-family:Helvetica,Arial,sans-serif">' + v.origin + ' > ' + v.destination + ' // ' + (v.cargo ? v.cargo.type : '') + '</div>'
      + '</div></div>';
  }).join('');
  return html;
}

function _gfwOnMapClick(e) {
  if (!gfwVisible) return;
  var lat = e.latlng.lat, lng = e.latlng.lng;
  console.log('[GFW] Map click at', lat.toFixed(4), lng.toFixed(4));
  _gfwSonarPing(e.latlng);

  // Immediately find and show nearby simulated vessels (instant)
  var nearby = _gfwNearbySimVessels(lat, lng, 0.5);
  var simHtml = _gfwRenderSimVessels(nearby, 'SIMULATED VESSELS NEARBY (' + nearby.length + ')');

  // Show simulated vessels immediately, then try GFW API in background
  var startTime = Date.now();
  _gfwShowPanel(lat, lng,
    '<div style="margin-bottom:8px"><span style="color:#cc0000;font-size:11px">QUERYING GFW REGISTRY...<span class="gfw-cursor"></span> <span id="gfwTimer" style="color:#444444">0s</span></span></div>'
    + simHtml
  );

  // Elapsed timer so user sees activity
  var timerEl = null;
  var timerInterval = setInterval(function() {
    timerEl = timerEl || document.getElementById('gfwTimer');
    if (timerEl) timerEl.textContent = Math.round((Date.now() - startTime) / 1000) + 's';
  }, 500);

  // Build bbox ±0.05° (~5.5km) and query 1 month
  var d = 0.05;
  var geojson = {type:'Polygon',coordinates:[[[lng-d,lat-d],[lng+d,lat-d],[lng+d,lat+d],[lng-d,lat+d],[lng-d,lat-d]]]};
  var url = 'https://gateway.api.globalfishingwatch.org/v3/4wings/report'
    + '?datasets[0]=public-global-presence:v4.0'
    + '&date-range=2024-11-01,2024-11-30'
    + '&spatial-resolution=LOW&temporal-resolution=MONTHLY'
    + '&group-by=VESSEL_ID&format=JSON';

  // AbortController for timeout
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 18000);

  fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + GFW_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ geojson: geojson }),
    signal: controller.signal
  })
  .then(function(res) {
    console.log('[GFW] Vessels API response:', res.status);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function(data) {
    clearTimeout(timeoutId);
    clearInterval(timerInterval);
    var entries = data.entries || [];
    var recs = (entries.length && entries[0]) ? (entries[0]['public-global-presence:v4.0'] || []) : [];
    console.log('[GFW] Raw vessel records:', recs.length);
    if (!recs.length) {
      // API returned no records — keep showing simulated vessels
      _gfwShowPanel(lat, lng,
        '<div style="color:#444444;font-size:10px;margin-bottom:8px">GFW REGISTRY: No records at this location</div>'
        + simHtml
      );
      return;
    }
    // Deduplicate by vesselId, keep highest hours
    var byId = {};
    recs.forEach(function(r) {
      var vid = r.vesselId || r.mmsi;
      if (!byId[vid] || r.hours > byId[vid].hours) byId[vid] = r;
    });
    var unique = Object.values(byId);
    unique.sort(function(a,b) { return (b.hours||0) - (a.hours||0); });
    var top10 = unique.slice(0, 10);
    console.log('[GFW] Showing', top10.length, 'unique GFW vessels');
    var gfwHtml = '<div style="color:#cc0000;font-size:8px;text-transform:uppercase;letter-spacing:2px;padding:4px 0 6px;border-bottom:1px solid #1a1a1a">GFW REGISTRY // ' + unique.length + ' VESSELS // TOP 10</div>';
    gfwHtml += top10.map(function(v) {
      var name = v.shipName || 'UNKNOWN';
      var flag = v.flag || '\u2014';
      var vtype = v.vesselType || v.geartype || 'OTHER';
      var imo = v.imo ? 'IMO ' + v.imo : '';
      var mmsi = v.mmsi ? 'MMSI ' + v.mmsi : '';
      var ids = [imo, mmsi].filter(Boolean).join(' // ');
      var lastTx = v.lastTransmissionDate ? v.lastTransmissionDate.substring(0, 10) : '';
      var hours = v.hours ? v.hours + 'H' : '';
      return '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #111111">'
        + '<div style="width:4px;height:4px;background:#cc0000;margin-top:5px;flex-shrink:0"></div>'
        + '<div style="min-width:0">'
        + '<div style="font-size:10px;color:#fff;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</div>'
        + '<div style="font-size:8px;color:#666666;font-family:Helvetica,Arial,sans-serif">' + flag + ' // ' + vtype + (hours ? ' // ' + hours : '') + '</div>'
        + (ids ? '<div style="font-size:8px;color:#444444;font-family:Helvetica,Arial,sans-serif">' + ids + '</div>' : '')
        + (lastTx ? '<div style="font-size:8px;color:#333333;font-family:Helvetica,Arial,sans-serif">TX ' + lastTx + '</div>' : '')
        + '</div></div>';
    }).join('');
    // Show GFW results + simulated vessels below
    _gfwShowPanel(lat, lng, gfwHtml + '<div style="margin-top:8px">' + simHtml + '</div>');
  })
  .catch(function(err) {
    clearTimeout(timeoutId);
    clearInterval(timerInterval);
    var reason = err.name === 'AbortError' ? 'REQUEST TIMED OUT' : (err.message || 'NETWORK ERROR');
    console.warn('[GFW] Vessels query failed:', reason);
    // Show error + simulated vessels (always have something to show)
    _gfwShowPanel(lat, lng,
      '<div style="color:#cc0000;font-size:10px;margin-bottom:8px">GFW REGISTRY: ' + reason + '</div>'
      + simHtml
    );
  });
}

function toggleGFW() {
  gfwVisible = !gfwVisible;
  console.log('[GFW] toggleGFW called, visible=' + gfwVisible);
  document.getElementById('btnGFW').classList.toggle('active', gfwVisible);
  if (gfwVisible) {
    gfwLayer = new GFWLayer({ pane: 'gfwPane', opacity: 0.75, tileSize: 256 });
    gfwLayer.addTo(map);
    map.on('click', _gfwOnMapClick);
    console.log('[GFW] Layer + click handler added');
  } else {
    if (gfwLayer) { map.removeLayer(gfwLayer); gfwLayer = null; }
    map.off('click', _gfwOnMapClick);
    closeGFWPanel();
    console.log('[GFW] Layer + click handler removed');
  }
}
console.log('[GFW] Module ready');
