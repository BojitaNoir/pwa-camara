const CACHE_NAME = 'camara-pwa-v1';
const urlsToCache = [
    'https://bojitanoir.github.io/pwa-camara/',
    'https://bojitanoir.github.io/pwa-camara/index.html',
    'https://bojitanoir.github.io/pwa-camara/app.js',
    'https://bojitanoir.github.io/pwa-camara/manifest.json',
    'https://bojitanoir.github.io/pwa-camara/img/192.png',
    'https://bojitanoir.github.io/pwa-camara/img/512.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});