
const CACHE_VERSION = '12';
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
  console.log('[Service Worker] Push received:', event);
  
  // Improved handling of push data
  let notificationData;
  
  try {
    if (event.data) {
      try {
        // Try to parse as JSON first
        notificationData = event.data.json();
        console.log('[Service Worker] Push data parsed as JSON:', notificationData);
      } catch (e) {
        // If JSON parsing fails, try using text
        const text = event.data.text();
        console.log('[Service Worker] Push data as text:', text);
        
        try {
          // Try to parse text as JSON
          notificationData = JSON.parse(text);
          console.log('[Service Worker] Text successfully parsed as JSON:', notificationData);
        } catch (e) {
          // If that fails too, use text as is
          notificationData = {
            title: 'Sensa.run',
            message: text,
            body: text
          };
          console.log('[Service Worker] Using raw text for notification:', notificationData);
        }
      }
    } else {
      // No data in the push
      notificationData = {
        title: 'Sensa.run',
        message: 'Tienes una notificación nueva'
      };
      console.log('[Service Worker] No data in push, using default message');
    }
    
    // Ensure we have the required fields
    const title = notificationData.title || 'Sensa.run';
    const body = notificationData.message || notificationData.body || 'Tienes una notificación nueva';
    const tag = notificationData.tag || `sensa-${Date.now()}`;
    const url = notificationData.url || '/';
    
    const options = {
      body: body,
      icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
      badge: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: tag,
      renotify: true,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: tag,
        url: url
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver App',
        }
      ],
      // Make notifications more visible
      requireInteraction: true,
      silent: false
    };
    
    console.log('[Service Worker] Showing notification with title:', title, 'and options:', options);
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('[Service Worker] Notification shown successfully'))
        .catch(error => console.error('[Service Worker] Error showing notification:', error))
    );
  } catch (error) {
    console.error('[Service Worker] Error handling push event:', error);
    
    // Fallback notification in case of errors
    event.waitUntil(
      self.registration.showNotification('Sensa.run', {
        body: 'Tienes una notificación nueva',
        icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png'
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
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
  console.log('[Service Worker] Activating, clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('sensa-cache-') && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Now controlling the page');
      return clients.claim();
    })
  );
});
