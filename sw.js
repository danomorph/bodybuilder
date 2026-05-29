const CACHE = 'bodybuilder-v1.05';

// Install: pre-cache new version, then take over immediately — no user action needed
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(new Request('./index.html', {cache: 'reload'})))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches, claim clients, force reload so new code runs
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window', includeUncontrolled:true}))
      .then(clients => clients.forEach(c => c.navigate ? c.navigate(c.url) : c.postMessage('RELOAD')))
  );
});

// Page sends SKIP_WAITING when user taps the update banner (future updates)
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache first — never cache sw.js itself
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('sw.js')) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});
