/* WillayPacha AI — service worker (offline-first para la demo) */
const CACHE = 'willaypacha-v1';
const RECURSOS_BASE = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(RECURSOS_BASE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Datos: red primero, caché de respaldo (modo sin conexión con los casos precargados).
  if (url.pathname.startsWith('/api/')) {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put(request, copia));
          return respuesta;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // App shell y estáticos: caché primero, actualización de fondo.
  evento.respondWith(
    caches.match(request).then((cacheado) => {
      const red = fetch(request)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(request, copia));
          }
          return respuesta;
        })
        .catch(() => cacheado);
      return cacheado || red;
    }),
  );
});
