// When the page is served from a laptop on the local network (localhost or a
// LAN IP — the show's offline fallback), talk to THAT server so we bypass
// Cloudflare/Render entirely. Otherwise use the deployed Render instance.
const SERVER_URL = (function () {
  var h = location.hostname;
  var isLocal = h === 'localhost' || h === '127.0.0.1' ||
    /^192\.168\./.test(h) || /^10\./.test(h) ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h);
  return isLocal ? location.origin : 'https://deep-seas-main-01.onrender.com';
})();
