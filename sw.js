/* Bead Dojo — offline cache */
const CACHE = 'bead-dojo-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/state.js',
  './js/sensei.js',
  './js/engine.js',
  './js/ui.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      /* cache same-origin GETs opportunistically */
      if(e.request.method === 'GET' && new URL(e.request.url).origin === location.origin){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
