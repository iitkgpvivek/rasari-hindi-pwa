const APP_VERSION = '1.9.3';
const CACHE = `rasari-hindi-v${APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './background.jpg',
  './icon-192.png',
  './icon-512.png',
  './audio/sw_a.mp3',
  './audio/sw_aa.mp3',
  './audio/sw_i.mp3',
  './audio/sw_ee.mp3',
  './audio/sw_u.mp3',
  './audio/sw_oo.mp3',
  './audio/sw_ri.mp3',
  './audio/sw_e.mp3',
  './audio/sw_ai.mp3',
  './audio/sw_o.mp3',
  './audio/sw_au.mp3',
  './audio/sw_ang.mp3',
  './audio/sw_aha.mp3',
  './audio/vy_ka.mp3',
  './audio/vy_kha.mp3',
  './audio/vy_ga.mp3',
  './audio/vy_gha.mp3',
  './audio/vy_nga.mp3',
  './audio/vy_cha.mp3',
  './audio/vy_chha.mp3',
  './audio/vy_ja.mp3',
  './audio/vy_jha.mp3',
  './audio/vy_nya.mp3',
  './audio/vy_ta1.mp3',
  './audio/vy_tha1.mp3',
  './audio/vy_da1.mp3',
  './audio/vy_dha1.mp3',
  './audio/vy_na1.mp3',
  './audio/vy_ta2.mp3',
  './audio/vy_tha2.mp3',
  './audio/vy_da2.mp3',
  './audio/vy_dha2.mp3',
  './audio/vy_na2.mp3',
  './audio/vy_pa.mp3',
  './audio/vy_pha.mp3',
  './audio/vy_ba.mp3',
  './audio/vy_bha.mp3',
  './audio/vy_ma.mp3',
  './audio/vy_ya.mp3',
  './audio/vy_ra.mp3',
  './audio/vy_la.mp3',
  './audio/vy_va.mp3',
  './audio/vy_sha1.mp3',
  './audio/vy_sha2.mp3',
  './audio/vy_sa.mp3',
  './audio/vy_ha.mp3',
  './audio/vy_ksha.mp3',
  './audio/vy_tra.mp3',
  './audio/vy_gya.mp3',
  './audio/snd_correct.mp3',
  './audio/snd_tryagain.mp3',
  './audio/matra_aa.mp3',
  './audio/matra_i.mp3',
  './audio/matra_ee.mp3',
  './audio/matra_u.mp3',
  './audio/matra_oo.mp3',
  './audio/matra_e.mp3',
  './audio/matra_ai.mp3',
  './audio/matra_o.mp3',
  './audio/matra_au.mp3',
  './audio/matra_ang.mp3',
  './images/kamal.jpg',
  './images/khargosh.jpg'
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
