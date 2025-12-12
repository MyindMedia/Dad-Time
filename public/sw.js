// Service Worker for DadTime Apple Mini App
// Provides offline capability, asset caching, and background tracking support

const CACHE_NAME = 'dadtime-v1';
const STATIC_CACHE = 'dadtime-static-v1';
const VERSION = '1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (API calls, etc.)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetchAndCache(request);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetchAndCache(request);
      })
      .catch(() => {
        // Offline and not cached - return offline page or error
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Helper function to fetch and cache
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // Don't cache if not successful
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
        });

      return response;
    });
}

// Handle share target (for iOS Share Extension)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const mediaFile = formData.get('media');

        // Store shared data in IndexedDB or localStorage
        const sharedData = {
          title,
          text,
          media: mediaFile ? await fileToBase64(mediaFile) : null,
          timestamp: Date.now()
        };

        // Save to storage
        await saveSharedData(sharedData);

        // Redirect to evidence page
        return Response.redirect('/evidence?shared=true', 303);
      })()
    );
  }
});

// Helper to convert file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to save shared data
async function saveSharedData(data) {
  // This would typically use IndexedDB, but for simplicity:
  const db = await openDB();
  const tx = db.transaction('sharedData', 'readwrite');
  const store = tx.objectStore('sharedData');
  await store.add(data);
}

// Simple IndexedDB wrapper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DadTimeDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sharedData')) {
        db.createObjectStore('sharedData', { keyPath: 'timestamp' });
      }
    };
  });
}

// ============================================================================
// BACKGROUND TRACKING SUPPORT
// ============================================================================

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  console.log('[SW] Message received:', type);

  switch (type) {
    case 'TIMER_START':
      handleTimerStart(data);
      break;
    case 'TIMER_STOP':
      handleTimerStop(data);
      break;
    case 'GPS_START':
      handleGPSStart(data);
      break;
    case 'GPS_STOP':
      handleGPSStop(data);
      break;
    case 'GPS_UPDATE':
      handleGPSUpdate(data);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Timer tracking handlers
function handleTimerStart(data) {
  console.log('[SW] Timer started:', data);
  // Store timer state for persistence
  self.registration.showNotification('Visit Tracking Started', {
    body: 'Timer is running in background',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'timer',
    requireInteraction: false,
  });
}

function handleTimerStop(data) {
  console.log('[SW] Timer stopped:', data);
  self.registration.showNotification('Visit Tracking Stopped', {
    body: `Duration: ${data.duration || 'N/A'}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'timer',
    requireInteraction: false,
  });
}

// GPS tracking handlers
function handleGPSStart(data) {
  console.log('[SW] GPS started:', data);
  self.registration.showNotification('Trip Tracking Started', {
    body: 'GPS tracking is active in background',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gps',
    requireInteraction: false,
  });
}

function handleGPSStop(data) {
  console.log('[SW] GPS stopped:', data);
  self.registration.showNotification('Trip Tracking Stopped', {
    body: `Distance: ${data.distance || 'N/A'} miles`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gps',
    requireInteraction: false,
  });
}

function handleGPSUpdate(data) {
  console.log('[SW] GPS update:', data);
  // Update stored GPS data
}

// ============================================================================
// PERIODIC BACKGROUND SYNC (for future enhancement)
// ============================================================================

// Note: Periodic Background Sync is experimental and not widely supported
// This is a placeholder for future implementation when browser support improves

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-tracking-data') {
    event.waitUntil(syncTrackingData());
  }
});

async function syncTrackingData() {
  console.log('[SW] Syncing tracking data...');
  // This would sync any buffered GPS or timer data to the server
  // Currently handled by the main app
  return Promise.resolve();
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

console.log('[SW] Service Worker loaded - Version:', VERSION);
