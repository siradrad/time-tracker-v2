const CACHE_NAME = 'time-tracker-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache JS, CSS, and image files
                if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
                  console.log('Service Worker: Caching new resource', event.request.url);
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving offline fallback', error);
            
            // Return cached index.html for navigation requests when offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for offline time entries (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-time-entries') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncTimeEntries());
  }
});

// Sync time entries when back online (placeholder for future backend integration)
async function syncTimeEntries() {
  try {
    console.log('Service Worker: Syncing time entries...');
    // This would sync localStorage data with backend when implemented
    // For now, just log that sync would happen
    console.log('Service Worker: Time entries sync complete');
  } catch (error) {
    console.error('Service Worker: Time entries sync failed', error);
    throw error;
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Payroll Optimizer notification',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Payroll Optimizer',
        icon: './icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Payroll Optimizer', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
}); 