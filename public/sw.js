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

// Fetch event - network first strategy for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // For API calls, use network-first strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Fallback: return offline response
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json'
            })
          });
        })
    );
    return;
  }
  
  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
  );
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  
  try {
    let notificationData = {
      title: '📋 Smart Schedule',
      body: 'New notification from Smart Schedule',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'smart-schedule-notification',
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Close' }
      ]
    };

    // Parse push data from backend
    if (event.data) {
      try {
        const data = event.data.json();
        console.log('[Service Worker] Push data:', data);
        
        notificationData = {
          ...notificationData,
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || notificationData.tag
        };
      } catch (error) {
        console.error('[Service Worker] Error parsing JSON:', error);
        // Fallback: use text if JSON parse fails
        notificationData.body = event.data.text() || notificationData.body;
      }
    }

    console.log('[Service Worker] Showing notification:', notificationData.title, notificationData.body);
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData)
        .then(() => {
          console.log('[Service Worker] ✅ Notification shown successfully');
        })
        .catch((error) => {
          console.error('[Service Worker] ❌ Error showing notification:', error);
        })
    );
  } catch (error) {
    console.error('[Service Worker] Error in push event handler:', error);
  }
});

// Notification click event - Handle user interaction with notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Focus or open the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[Service Worker] Found', clientList.length, 'client windows');
        
        // Try to find and focus existing window
        for (const client of clientList) {
          console.log('[Service Worker] Client URL:', client.url);
          if (client.url === '/' || client.url.includes('localhost')) {
            if ('focus' in client) {
              console.log('[Service Worker] Focusing existing client');
              return client.focus();
            }
          }
        }
        
        // If no window found, open new one
        console.log('[Service Worker] Opening new window');
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

