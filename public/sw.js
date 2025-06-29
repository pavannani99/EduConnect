// public/sw.js

const CACHE_NAME = 'educonnect-v1';
const OFFLINE_URL = '/offline.html'; // Make sure you have an offline.html page

// Add assets you want to cache
const urlsToCache = [
  '/',
  '/offline.html',
  // '/styles/globals.css', // Example: if you have global styles
  // '/images/logo.png',    // Example: if you have a logo
  // Add paths to your icons for notifications if they are local
  '/images/icons/icon-192x192.png',
  '/images/icons/badge-72x72.png',
];

// Install Service Worker - Caching and Push Notification Setup
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event fired.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // self.skipWaiting(); // Optional: Activate worker immediately
      })
  );
});

// Activate the SW - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // return clients.claim(); // Optional: Take control of open clients without a reload
    })
  );
});

// Listen for fetch requests - Cache-first strategy
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // If the network request fails and it's a navigation request, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // For other types of requests (e.g., images, API calls), you might want to return a different fallback or nothing
            return new Response("Network error occurred", {
              status: 408,
              headers: { "Content-Type": "text/plain" },
            });
          });
      })
  );
});


// --- PUSH NOTIFICATION LOGIC ---

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    data = { title: 'EduConnect', body: event.data ? event.data.text() : 'You have a new notification.'};
  }

  const title = data.title || 'EduConnect';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/images/icons/icon-192x192.png', // Default icon
    badge: data.badge || '/images/icons/badge-72x72.png', // Default badge
    tag: data.tag || String(Date.now()), // Unique tag to prevent multiple same notifications or to replace old ones
    data: data.url ? { url: data.url } : { url: '/' } // URL to open on click
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Close the notification

  const notificationData = event.notification.data;
  // Default to opening the root, but use the URL from the push data if provided
  const urlToOpen = (notificationData && typeof notificationData.url === 'string') ? notificationData.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check if a window/tab with the target URL is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If a window with the exact URL is open, focus it.
        // For more complex scenarios, you might want to check if client.url is part of a base URL etc.
        if (new URL(client.url).pathname === new URL(urlToOpen, self.location.origin).pathname && 'focus' in client) {
          try {
            return client.focus();
          } catch (err) {
            // Ignore focus error for cross-origin iframes
          }
        }
      }
      // If no matching window is found, or focusing failed, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
