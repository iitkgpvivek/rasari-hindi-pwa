const APP_VERSION = '1.4.0';
const CACHE = `rasari-hindi-v${APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './background.jpg',
  './icon-192.png',
  './icon-512.png',
  './audio/sw_a.m4a',
  './audio/sw_aa.m4a',
  './audio/sw_i.m4a',
  './audio/sw_ee.m4a',
  './audio/sw_u.m4a',
  './audio/sw_oo.m4a',
  './audio/sw_ri.m4a',
  './audio/sw_e.m4a',
  './audio/sw_ai.m4a',
  './audio/sw_o.m4a',
  './audio/sw_au.m4a',
  './audio/sw_ang.m4a',
  './audio/sw_aha.m4a',
  './audio/vy_ka.m4a',
  './audio/vy_kha.m4a',
  './audio/vy_ga.m4a',
  './audio/vy_gha.m4a',
  './audio/vy_nga.m4a',
  './audio/vy_cha.m4a',
  './audio/vy_chha.m4a',
  './audio/vy_ja.m4a',
  './audio/vy_jha.m4a',
  './audio/vy_nya.m4a',
  './audio/vy_ta1.m4a',
  './audio/vy_tha1.m4a',
  './audio/vy_da1.m4a',
  './audio/vy_dha1.m4a',
  './audio/vy_na1.m4a',
  './audio/vy_ta2.m4a',
  './audio/vy_tha2.m4a',
  './audio/vy_da2.m4a',
  './audio/vy_dha2.m4a',
  './audio/vy_na2.m4a',
  './audio/vy_pa.m4a',
  './audio/vy_pha.m4a',
  './audio/vy_ba.m4a',
  './audio/vy_bha.m4a',
  './audio/vy_ma.m4a',
  './audio/vy_ya.m4a',
  './audio/vy_ra.m4a',
  './audio/vy_la.m4a',
  './audio/vy_va.m4a',
  './audio/vy_sha1.m4a',
  './audio/vy_sha2.m4a',
  './audio/vy_sa.m4a',
  './audio/vy_ha.m4a',
  './audio/vy_ksha.m4a',
  './audio/vy_tra.m4a',
  './audio/vy_gya.m4a'
];

// Install: Cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: Delete old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Listen for message from client to activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-First for HTML/navigation requests so changes are detected immediately when online
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, icons, manifest)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
