const CACHE_NAME = 'kzo-inspect-v15';
const ASSETS = [
  '/',
  'index.html',
  'KZO_Inspect.html',
  'style.css',
  'app.js',
  'data.js',
  'ai_agents.js',
  'boilerplate.js',
  'templates.js',
  'house_bg.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
  // config.js exclu intentionnellement : contient des clés API sensibles
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event
// IMPORTANT : ne JAMAIS intercepter ni cacher les requêtes vers les API IA externes.
// Les URLs Gemini contiennent la clé API en query string ("?key=AIzaSy...") — les
// mettre en cache exposerait la clé dans CacheStorage.
self.addEventListener('fetch', (event) => {
  const reqUrl = new URL(event.request.url);
  const sameOrigin = reqUrl.origin === self.location.origin;
  const isGet = event.request.method === 'GET';

  // Tout ce qui n'est pas un GET de notre propre origine : laisser passer sans interception.
  if (!sameOrigin || !isGet) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
