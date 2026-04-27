# 🔔 Push Notifications Integration Guide

## Overview

This guide explains how the Push Notification system works between Frontend (React) and Backend (Spring Boot Task Service).

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. PushNotificationSettings.tsx                                 │
│     └─ User enables/disables notifications                       │
│                                                                   │
│  2. pushNotificationService.ts                                   │
│     ├─ Request browser permission                                │
│     ├─ Register Service Worker (/sw.js)                          │
│     ├─ Subscribe to PushManager                                  │
│     └─ Send subscription (endpoint, p256dh, auth) to Backend    │
│                                                                   │
│  3. Service Worker (/public/sw.js)                               │
│     └─ Listen for push events from backend                       │
│        └─ Display notification to user                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP Request
                    /api/notifications/subscribe
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot Task Service)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. NotificationController.java                                  │
│     ├─ @PostMapping("/subscribe")                                │
│     └─ Receives: { endpoint, p256dh, auth, conversationId? }    │
│                                                                   │
│  2. NotificationServiceImpl.java                                  │
│     ├─ Save PushSubscription (userId, endpoint, p256dh, auth)   │
│     ├─ @Scheduled every 30 seconds                               │
│     │  ├─ Query tasks with deadline in next 1 hour              │
│     │  ├─ Get PushSubscriptions for that user                    │
│     │  └─ Send push notification via Web Push API                │
│     └─ PushService (nl.martijndwars.webpush)                     │
│        └─ Actually sends notification to browser via endpoint    │
│                                                                   │
│  3. Service Worker receives push event                           │
│     └─ Display notification: "Task 'X' is due soon"              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow: Step-by-Step

### Step 1: User Enables Notifications

**Frontend (React Component):**
```typescript
// PushNotificationSettings.tsx
user clicks toggle → handleToggleNotification(true)
```

### Step 2: Browser Permission Request

**Frontend:**
```typescript
// pushNotificationService.ts
const permission = await Notification.requestPermission()
// Browser shows permission dialog to user
```

**User sees:**
```
[Notification Request Dialog]
Website wants to send you notifications
[Block] [Allow]
```

### Step 3: Service Worker Registration

**Frontend:**
```typescript
const registration = await navigator.serviceWorker.register('/sw.js')
await navigator.serviceWorker.ready
```

**Files needed:**
- `/public/sw.js` - Service Worker file (handles push events when app closed)
- `/public/manifest.json` - Web App Manifest

### Step 4: Subscribe to Push Manager

**Frontend:**
```typescript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY  // Base64 encoded
})
// subscription contains:
// - endpoint: "https://fcm.googleapis.com/fcm/send/..."
// - keys: { p256dh: "...", auth: "..." }
```

### Step 5: Send Subscription to Backend

**Frontend:**
```typescript
POST /api/notifications/subscribe
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "base64_encoded_p256dh_key",
  "auth": "base64_encoded_auth_key"
}

Headers:
Authorization: Bearer {JWT_TOKEN}
```

### Step 6: Backend Saves Subscription

**Backend (Spring Boot):**
```java
@PostMapping("/subscribe")
public ResponseEntity<Void> subscribe(
    @RequestBody SubscriptionRequest request,
    @AuthenticationPrincipal Jwt jwt
) {
    Long userId = Long.parseLong(jwt.getSubject());
    notificationService.subscribe(request, userId);
    // Saves to DB:
    // PushSubscription { 
    //   userId: 123,
    //   endpoint: "https://fcm.googleapis.com/...",
    //   p256dh: "...",
    //   auth: "..."
    // }
    return ResponseEntity.noContent().build();
}
```

### Step 7: Backend Checks for Upcoming Tasks

**Backend (Scheduled Service):**
```java
@Scheduled(fixedRate = 30000)  // Every 30 seconds
public void checkDeadlinesAndSendNotifications() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime inOneHour = now.plusHours(1);
    
    // Find tasks due in next 1 hour with status TODO
    List<Task> upcomingTasks = taskRepository
        .findAllByDeadlineBetweenAndStatus(now, inOneHour, TaskStatus.TODO);
    
    for (Task task : upcomingTasks) {
        // Get all subscriptions for this user
        List<PushSubscription> subscriptions = 
            subscriptionRepository.findAllByUserId(task.getUserId());
        
        for (PushSubscription sub : subscriptions) {
            // Send push notification
            sendNotification(sub, "Task '" + task.getTitle() + "' is due soon");
        }
    }
}
```

### Step 8: Backend Sends Push Notification

**Backend:**
```java
public void sendNotification(PushSubscription subscription, String payload) {
    Notification notification = new Notification(
        subscription.getEndpoint(),
        subscription.getP256dh(),
        subscription.getAuth(),
        payload
    );
    pushService.send(notification);  // Sends via Web Push API
}
```

**What happens:**
1. Backend uses `endpoint` to route notification
2. Uses `p256dh` and `auth` to encrypt payload
3. Sends HTTPS POST to push service (Firebase Cloud Messaging, etc.)
4. Push service routes to user's browser

### Step 9: Service Worker Receives Push

**Service Worker (/public/sw.js):**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'task-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

### Step 10: User Sees Notification

**User sees:**
```
┌────────────────────────────────┐
│ 📋 Task Deadline Reminder       │
├────────────────────────────────┤
│ Task "Complete project" is      │
│ due in 1 hour!                  │
└────────────────────────────────┘
```

User can:
- ✅ Click to focus app
- ❌ Close notification
- See notification even if app closed

---

## 🛠 Frontend Implementation Details

### 1. pushNotificationService.ts

**Key Methods:**

#### `requestPermission()`
```typescript
await pushNotificationService.requestPermission()
// Returns: "granted" | "denied" | "default"
```

#### `subscribe()`
```typescript
const subscription = await pushNotificationService.subscribe()
// 1. Register Service Worker
// 2. Subscribe to PushManager
// 3. Send subscription to backend
// 4. Backend saves it
```

#### `unsubscribe()`
```typescript
await pushNotificationService.unsubscribe()
// Unsubscribe from push notifications
```

#### `isSubscribed()`
```typescript
const subscribed = await pushNotificationService.isSubscribed()
// Returns: true | false
```

#### `setVapidPublicKey(key)`
```typescript
pushNotificationService.setVapidPublicKey('YOUR_VAPID_PUBLIC_KEY')
// Must be called before subscribe()
// Get this from backend /api/config/vapid-key
```

### 2. PushNotificationSettings.tsx

**Component Usage:**
```tsx
import { PushNotificationSettings } from './components/PushNotificationSettings'

export function App() {
  return (
    <>
      <PushNotificationSettings className="mb-4" />
      {/* rest of app */}
    </>
  )
}
```

**Features:**
- ✅ Check browser support
- ✅ Toggle notifications on/off
- ✅ Display permission status
- ✅ Send test notification
- ✅ Show error messages
- ✅ Display success messages

### 3. Service Worker (/public/sw.js)

**Required file:**
```javascript
// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Smart Schedule', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
```

### 4. Manifest File (/public/manifest.json)

**Required for PWA:**
```json
{
  "name": "Smart Schedule Calendar",
  "short_name": "Smart Schedule",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait-primary"
}
```

---

## 🚀 Setup Instructions

### Frontend Setup

1. **Update pushNotificationService.ts**
   ```typescript
   // Set VAPID public key from backend
   pushNotificationService.setVapidPublicKey('YOUR_VAPID_PUBLIC_KEY')
   ```

2. **Create/Update Service Worker**
   - File: `/public/sw.js`
   - Copy code from Section 3 above

3. **Create/Update Manifest**
   - File: `/public/manifest.json`
   - Copy code from Section 4 above

4. **Add icons**
   - `/public/icon-192x192.png`
   - `/public/icon-512x512.png`

5. **Include PushNotificationSettings component**
   ```tsx
   import { PushNotificationSettings } from './components/PushNotificationSettings'
   
   export function App() {
     return (
       <PushNotificationSettings className="p-4" />
     )
   }
   ```

### Backend Setup

1. **Add VAPID Keys to application.yml**
   ```yaml
   vapid:
     public:
       key: "YOUR_VAPID_PUBLIC_KEY"
     private:
       key: "YOUR_VAPID_PRIVATE_KEY"
   ```

2. **Generate VAPID Keys** (if not available):
   ```bash
   # Using web-push CLI
   npm install -g web-push
   web-push generate-vapid-keys
   ```

3. **Ensure Database Tables**
   ```sql
   CREATE TABLE push_subscriptions (
     subscription_id BIGINT PRIMARY KEY AUTO_INCREMENT,
     endpoint TEXT NOT NULL,
     p256dh VARCHAR(255) NOT NULL,
     auth VARCHAR(255) NOT NULL,
     user_id BIGINT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **Enable Scheduled Task**
   - Add `@EnableScheduling` to main application class
   - NotificationServiceImpl runs every 30 seconds

---

## 🔑 Key Points

### Frontend to Backend Data Flow

| Frontend | → | Backend | Description |
|----------|---|---------|-------------|
| `endpoint` | → | PushSubscription.endpoint | URL to send push to |
| `p256dh` | → | PushSubscription.p256dh | Encryption key |
| `auth` | → | PushSubscription.auth | Authentication key |
| User ID (JWT) | → | PushSubscription.userId | Which user owns subscription |

### Browser Push Flow

```
Backend
  ↓ (sends HTTPS POST)
Push Service (FCM, etc.)
  ↓ (routes via endpoint)
Browser / Device
  ↓ (routes to Service Worker)
Service Worker
  ↓ (displays notification)
User
```

### Encryption/Security

- **VAPID Keys**: Identify backend to push service
- **p256dh Key**: Used to encrypt payload (symmetric encryption)
- **auth Key**: Used with p256dh to decrypt
- **Endpoint**: URL unique to this subscription (user + device combo)

---

## ❌ Troubleshooting

### "Notification permission denied"

**Solution:**
1. Clear browser notification settings for localhost
2. Restart browser
3. Clear localStorage and cookies
4. Try again

### "Service Worker not registering"

**Solution:**
1. Ensure `/public/sw.js` exists
2. Check browser console for errors
3. Ensure app is served over HTTPS (required for Service Workers)
4. Check Content-Security-Policy headers

### "Notifications not received"

**Solution:**
1. Check backend logs for scheduled task running
2. Ensure PushSubscription saved in DB
3. Check browser notification settings are "Allow"
4. Test using "Send Test Notification" button
5. Check backend logs for push service errors

### "Backend returns 401 Unauthorized"

**Solution:**
1. Ensure JWT token in Authorization header
2. Check token expiration
3. Check Security config allows `/api/notifications/**`

---

## 📝 Testing Checklist

- [ ] Subscribe to notifications
- [ ] Check notification permission is "granted"
- [ ] Check database has PushSubscription record
- [ ] Send test notification
- [ ] Notification appears
- [ ] Click notification - app focuses
- [ ] Close app and notification still works
- [ ] Unsubscribe from notifications
- [ ] Check subscription removed from DB
- [ ] No more notifications received

---

## 📚 References

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
- [VAPID Keys](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-vapid)

---

**Last Updated:** October 22, 2025
