const CACHE_NAME = 'camara-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './img/192.png',
  './img/512.png'
];

// === INSTALACIÓN ===
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Cache abierto');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activa inmediatamente el SW nuevo
});

// === ACTIVACIÓN ===
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla las páginas sin recarga
});

// === INTERCEPTAR PETICIONES ===
self.addEventListener('fetch', event => {
  // Solo maneja peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // Si está en cache, úsalo
        return response;
      }
      // Si no está, lo descarga y guarda en cache dinámico
      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, intenta una página de fallback
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
