
const CACHE_VERSION = '16';
const CACHE_NAME = `sensa-cache-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
  '/lovable-uploads/b5c87f98-f07e-494a-a9f1-4c9ee5f239c8.png'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing with cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  
  let payload;
  try {
    if (event.data) {
      console.log('[Service Worker] Push event has data');
      try {
        // Try to parse the data as JSON
        payload = event.data.json();
        console.log('[Service Worker] Successfully parsed push data as JSON:', payload);
      } catch (e) {
        console.error('[Service Worker] Error parsing push data as JSON:', e);
        
        // If JSON parsing fails, get it as text
        const textData = event.data.text();
        console.log('[Service Worker] Push data as text:', textData);
        
        try {
          // Try to parse the text as JSON
          payload = JSON.parse(textData);
          console.log('[Service Worker] Successfully parsed text data as JSON:', payload);
        } catch (e) {
          console.error('[Service Worker] Error parsing text as JSON:', e);
          // Use text data directly
          payload = {
            title: 'Sensa.run',
            body: textData
          };
        }
      }
    } else {
      console.log('[Service Worker] Push event has no data, using default');
      payload = {
        title: 'Sensa.run',
        body: 'Tienes una notificación nueva'
      };
    }
    
    const title = payload.title || 'Sensa.run';
    const body = payload.body || payload.message || 'Tienes una notificación nueva';
    const icon = payload.icon || '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png';
    const badge = payload.badge || '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png';
    const tag = payload.tag || 'sensa-notification';
    const url = payload.url || '/';
    
    // Create the notification options
    const notificationOptions = {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [200, 100, 200],
      tag: tag,
      renotify: true,
      requireInteraction: true,
      data: {
        url: url,
        dateOfArrival: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: 'Ver ahora',
        }
      ]
    };
    
    console.log('[Service Worker] Showing notification with title:', title);
    console.log('[Service Worker] Notification options:', notificationOptions);
    
    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
        .then(() => {
          console.log('[Service Worker] Notification shown successfully');
        })
        .catch((error) => {
          console.error('[Service Worker] Error showing notification:', error);
        })
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
  
  // Close the notification
  event.notification.close();

  let targetUrl = '/';
  
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  // Handle action clicks
  if (event.action === 'open' || !event.action) {
    console.log('[Service Worker] Opening URL:', targetUrl);
    
    event.waitUntil(
      clients.matchAll({type: 'window'}).then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        console.log('[Service Worker] Opening new window with URL:', targetUrl);
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
