const APP_VERSION = '1.9.5';
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
  './images/aag.svg',
  './images/aalu.svg',
  './images/aam.svg',
  './images/aedi.svg',
  './images/ainak.svg',
  './images/anaar.svg',
  './images/angoor.svg',
  './images/aurat.svg',
  './images/baadal.svg',
  './images/baan.svg',
  './images/bandar.svg',
  './images/battakh.svg',
  './images/bhalu.svg',
  './images/billi.svg',
  './images/bus.svg',
  './images/car.svg',
  './images/chabi.svg',
  './images/chammach.svg',
  './images/chand.svg',
  './images/chhatri.svg',
  './images/chuha.svg',
  './images/cow.svg',
  './images/cycle.svg',
  './images/daant.svg',
  './images/damru.svg',
  './images/dawaat.svg',
  './images/deepak.svg',
  './images/dhakkan.svg',
  './images/dhanush.svg',
  './images/doodh.svg',
  './images/eekh.svg',
  './images/gamla.svg',
  './images/gend.svg',
  './images/ghadi.svg',
  './images/ghar.svg',
  './images/ghoda.svg',
  './images/gulab.svg',
  './images/gyani.svg',
  './images/haath.svg',
  './images/haathi.svg',
  './images/hal.svg',
  './images/imli.svg',
  './images/jahaz.svg',
  './images/jhanda.svg',
  './images/joota.svg',
  './images/kabutar.svg',
  './images/kamal.jpg',
  './images/kela.svg',
  './images/khali.svg',
  './images/khargosh.jpg',
  './images/khat.svg',
  './images/kitab.svg',
  './images/kshatriya.svg',
  './images/kutta.svg',
  './images/lattu.svg',
  './images/machhli.svg',
  './images/mor.svg',
  './images/naav.svg',
  './images/nal.svg',
  './images/okhli.svg',
  './images/oon.svg',
  './images/oont.svg',
  './images/paani.svg',
  './images/pair.svg',
  './images/patang.svg',
  './images/ped.svg',
  './images/pencil.svg',
  './images/phal.svg',
  './images/phool.svg',
  './images/pratah.svg',
  './images/rath.svg',
  './images/rishi.svg',
  './images/roti.svg',
  './images/samosa.svg',
  './images/seb.svg',
  './images/shaljam.svg',
  './images/shatkon.svg',
  './images/sher.svg',
  './images/sooraj.svg',
  './images/taala.svg',
  './images/tamatar.svg',
  './images/tara.svg',
  './images/tarbooj.svg',
  './images/thathera.svg',
  './images/thermas.svg',
  './images/titli.svg',
  './images/topi.svg',
  './images/tota.svg',
  './images/trishul.svg',
  './images/ullu.svg',
  './images/vak.svg',
  './images/yagya.svg'
,
  './audio/sw_a.m4a',
  './audio/sw_aa.m4a',
  './audio/sw_aha.m4a',
  './audio/sw_ai.m4a',
  './audio/sw_ang.m4a',
  './audio/sw_au.m4a',
  './audio/sw_e.m4a',
  './audio/sw_ee.m4a',
  './audio/sw_i.m4a',
  './audio/sw_o.m4a',
  './audio/sw_oo.m4a',
  './audio/sw_ri.m4a',
  './audio/sw_u.m4a',
  './audio/vy_ba.m4a',
  './audio/vy_bha.m4a',
  './audio/vy_cha.m4a',
  './audio/vy_chha.m4a',
  './audio/vy_da1.m4a',
  './audio/vy_da2.m4a',
  './audio/vy_dha1.m4a',
  './audio/vy_dha2.m4a',
  './audio/vy_ga.m4a',
  './audio/vy_gha.m4a',
  './audio/vy_gya.m4a',
  './audio/vy_ha.m4a',
  './audio/vy_ja.m4a',
  './audio/vy_jha.m4a',
  './audio/vy_ka.m4a',
  './audio/vy_kha.m4a',
  './audio/vy_ksha.m4a',
  './audio/vy_la.m4a',
  './audio/vy_ma.m4a',
  './audio/vy_na1.m4a',
  './audio/vy_na2.m4a',
  './audio/vy_nga.m4a',
  './audio/vy_nya.m4a',
  './audio/vy_pa.m4a',
  './audio/vy_pha.m4a',
  './audio/vy_ra.m4a',
  './audio/vy_sa.m4a',
  './audio/vy_sha1.m4a',
  './audio/vy_sha2.m4a',
  './audio/vy_ta1.m4a',
  './audio/vy_ta2.m4a',
  './audio/vy_tha1.m4a',
  './audio/vy_tha2.m4a',
  './audio/vy_tra.m4a',
  './audio/vy_va.m4a',
  './audio/vy_ya.m4a',
  './audio/word_sw_a.m4a',
  './audio/word_sw_aa.m4a',
  './audio/word_sw_aha.m4a',
  './audio/word_sw_ai.m4a',
  './audio/word_sw_ang.m4a',
  './audio/word_sw_au.m4a',
  './audio/word_sw_e.m4a',
  './audio/word_sw_ee.m4a',
  './audio/word_sw_i.m4a',
  './audio/word_sw_o.m4a',
  './audio/word_sw_oo.m4a',
  './audio/word_sw_ri.m4a',
  './audio/word_sw_u.m4a',
  './audio/word_vy_ba.m4a',
  './audio/word_vy_bha.m4a',
  './audio/word_vy_cha.m4a',
  './audio/word_vy_chha.m4a',
  './audio/word_vy_da1.m4a',
  './audio/word_vy_da2.m4a',
  './audio/word_vy_dha1.m4a',
  './audio/word_vy_dha2.m4a',
  './audio/word_vy_ga.m4a',
  './audio/word_vy_gha.m4a',
  './audio/word_vy_gya.m4a',
  './audio/word_vy_ha.m4a',
  './audio/word_vy_ja.m4a',
  './audio/word_vy_jha.m4a',
  './audio/word_vy_ka.m4a',
  './audio/word_vy_kha.m4a',
  './audio/word_vy_ksha.m4a',
  './audio/word_vy_la.m4a',
  './audio/word_vy_ma.m4a',
  './audio/word_vy_na1.m4a',
  './audio/word_vy_na2.m4a',
  './audio/word_vy_nga.m4a',
  './audio/word_vy_nya.m4a',
  './audio/word_vy_pa.m4a',
  './audio/word_vy_pha.m4a',
  './audio/word_vy_ra.m4a',
  './audio/word_vy_sa.m4a',
  './audio/word_vy_sha1.m4a',
  './audio/word_vy_sha2.m4a',
  './audio/word_vy_ta1.m4a',
  './audio/word_vy_ta2.m4a',
  './audio/word_vy_tha1.m4a',
  './audio/word_vy_tha2.m4a',
  './audio/word_vy_tra.m4a',
  './audio/word_vy_va.m4a',
  './audio/word_vy_ya.m4a'
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
