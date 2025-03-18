
const CACHE_VERSION = '2';
const CACHE_NAME = `sensa-cache-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Sensa.run',
      message: event.data.text()
    };
  }
  
  const options = {
    body: data.message || data.body || 'Has recibido una notificación',
    icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
    badge: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.tag || '1',
      url: data.url || '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver App',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Sensa.run', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = '/';
  
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  if (event.action === 'explore' || !event.action) {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(targetUrl);
      })
    );
  }
});

// Improved fetch event handler that doesn't fail on network errors
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like the ones to Edge Functions
  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('sensa-cache-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return clients.claim();
    })
  );
});
