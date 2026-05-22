const CACHE_NAME = 'kzo-inspect-v46';
const ASSETS = [
  'index.html',
  'KZO_Inspect.html',
  'style.css',
  'app.js',
  'data.js',
  'ai_agents.js',
  'boilerplate.js',
  'templates.js',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'storage.js',
  'jszip.min.js',
  'auth.js',
  'kzo_auth_check.js',
  'kzo_modals.js',
  'google_drive.js',
  'google_calendar.js',
  'agenda.js',
  'photo_editor.js',
  'login.html',
  'login.js',
  'index.js'
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
// Stratégie : stale-while-revalidate pour les assets statiques same-origin.
// - Si l'asset est en cache → réponse immédiate + mise à jour silencieuse en arrière-plan
// - Si pas en cache → fetch réseau + mise en cache pour la prochaine fois
//
// IMPORTANT : ne JAMAIS intercepter les requêtes vers les API IA externes.
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
    caches.match(event.request).then((cachedResponse) => {
      // Mise à jour réseau en arrière-plan (silencieuse)
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      // Servir depuis le cache immédiatement si disponible (démarrage instantané hors ligne)
      // Sinon attendre la réponse réseau
      return cachedResponse || networkFetch;
    })
  );
});
