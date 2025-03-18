const CACHE_VERSION = '5';
const CACHE_NAME = `sensa-cache-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
  '/lovable-uploads/b5c87f98-f07e-494a-a9f1-4c9ee5f239c8.png'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing with cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
    console.log('Parsed push data:', data);
  } catch (e) {
    console.log('Failed to parse JSON, using text instead');
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

  console.log('Showing notification with options:', options);
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sensa.run', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.origin !== self.location.origin) {
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
  console.log('Service Worker activating, clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('sensa-cache-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker now controlling the page');
      return clients.claim();
    })
  );
});
