function _lerpVal(a,b,t){ return a+(b-a)*t; }
function randInt(a,b){ return Math.floor(a+Math.random()*(b-a)); }
function randEl(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function fmtNum(n){ if(n>=1e9) return (n/1e9).toFixed(1)+'B'; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(1)+'K'; return n.toFixed(0); }
function fmtUSD(n){ return '$'+fmtNum(n); }

function routeLength(route) { let d=0; for(let i=1;i<route.length;i++) d+=dist(route[i-1],route[i]); return d; }
function dist(a,b) { const dx=(b[1]-a[1])*Math.cos(((a[0]+b[0])/2)*Math.PI/180), dy=b[0]-a[0]; return Math.sqrt(dx*dx+dy*dy)*60; }

function positionOnRoute(route, progress) {
  if (!route || route.length < 2) return { lat: route?.[0]?.[0] || 26.0, lng: route?.[0]?.[1] || 57.0, bearing: 0, segIndex: 0 };
  const totalLen = routeLength(route);
  if (!totalLen || isNaN(totalLen) || totalLen <= 0) return { lat: route[0][0], lng: route[0][1], bearing: calcBearing(route[0], route[1]), segIndex: 0 };
  const clampedProgress = Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress));
  let target = clampedProgress * totalLen, acc = 0;
  for (let i=1; i<route.length; i++) {
    const segLen = dist(route[i-1], route[i]);
    if (acc+segLen >= target) {
      const t = segLen > 0 ? (target-acc)/segLen : 0;
      return { lat: _lerpVal(route[i-1][0],route[i][0],t), lng: _lerpVal(route[i-1][1],route[i][1],t), bearing: calcBearing(route[i-1],route[i]), segIndex: i };
    }
    acc += segLen;
  }
  const last = route[route.length-1];
  return { lat: last[0], lng: last[1], bearing: calcBearing(route[route.length-2], last), segIndex: route.length-1 };
}

function calcBearing(a,b) {
  const dLng=(b[1]-a[1])*Math.PI/180, lat1=a[0]*Math.PI/180, lat2=b[0]*Math.PI/180;
  const y=Math.sin(dLng)*Math.cos(lat2), x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);
  return ((Math.atan2(y,x)*180/Math.PI)+360)%360;
}
