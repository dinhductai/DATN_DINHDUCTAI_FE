/**
 * Service Worker for Smart Schedule Calendar
 * Handles push notifications and offline caching
 */

console.log('[Service Worker] Loading...');

const CACHE_NAME = 'smart-schedule-v1';

// Install event - skip waiting and activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Fetch event — for API calls, let the browser handle them directly (no SW interception).
// This avoids "from service worker" attribution on error responses and prevents potential
// Vite proxy routing issues. Push/event notifications are handled by their own listeners.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.url.includes('/api/')) {
    // Don't intercept API calls — let browser handle directly through Vite proxy
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
  );
});

// Push notifications disabled
// self.addEventListener('push', (event) => { ... });
// self.addEventListener('notificationclick', (event) => { ... });
// self.addEventListener('notificationclose', (event) => { ... });

