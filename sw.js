const CACHE = 'bodybuilder-v1.02';

// On install: pre-cache the app, then wait for user to approve update
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(new Request('./index.html', {cache: 'reload'})))
      .catch(() => {}) // Non-fatal — fetch handler will cache on first request
  );
  // Do NOT call skipWaiting here — wait for user to tap the toast
});

// On activate: delete old caches, take control
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Page sends SKIP_WAITING when user taps the update toast
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache first, update cache in background
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
