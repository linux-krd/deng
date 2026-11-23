const CACHE = 'deng-v7', FONTS = 'deng-fonts';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];
// optional: only cached if you ran setup-ffmpeg.sh (missing files are ignored)
const OPT = ['vendor/ffmpeg/ffmpeg.js', 'vendor/ffmpeg/814.ffmpeg.js', 'vendor/core/ffmpeg-core.js', 'vendor/core/ffmpeg-core.wasm'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(async c => { await c.addAll(SHELL); await Promise.allSettled(OPT.map(u => c.add(u))); })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  // Google Fonts: cached after the first online visit
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin !== location.origin) return;

  // the page itself: serve from cache instantly, refresh in the background
  if (req.mode === 'navigate') {
    const upd = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); } return r; }).catch(() => null);
    e.waitUntil(upd);
    e.respondWith(caches.match('index.html').then(hit => hit || upd.then(r => r || caches.match('./'))));
    return;
  }

  // everything else on this origin: cache first
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.status === 200) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
