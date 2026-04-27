// Push Notification Service
// Hỗ trợ Web Push Notifications theo đặc tả W3C và backend Task Service

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
}

class PushNotificationService {
  // VAPID Public Key từ backend (cần cập nhật từ config BE)
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  /**
   * Yêu cầu quyền hiển thị thông báo từ user
   * @returns Permission status (granted, denied, default)
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.error('[Push Notification] Push notifications are not supported in this browser');
      throw new Error('Push notifications are not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Push Notification] Permission status:', permission);
      return permission;
    } catch (error) {
      console.error('[Push Notification] Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Đăng ký nhận push notifications
   * 1. Đăng ký Service Worker (từ /sw.js)
   * 2. Subscribe tới Push Manager
   * 3. Gửi subscription details lên backend
   * @returns PushSubscription object hoặc null
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      console.error('[Push Notification] Push notifications are not supported');
      throw new Error('Push notifications are not supported');
    }

    try {
      console.log('[Push Notification] Registering service worker...');
      
      // 1. Đăng ký service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      console.log('[Push Notification] Service worker registered');

      // 2. Subscribe tới push manager
      console.log('[Push Notification] Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Tất cả push phải có UI
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });
      console.log('[Push Notification] Push subscription created:', subscription.endpoint);

      // 3. Gửi subscription details lên backend
      // Backend sẽ lưu endpoint, p256dh, auth để gửi notifications sau này
      await this.sendSubscriptionToServer(subscription);
      console.log('[Push Notification] Subscription sent to server');

      return subscription;
    } catch (error) {
      console.error('[Push Notification] Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Hủy đăng ký push notifications
   * @returns true nếu thành công
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[Push Notification] Push notifications are not supported');
      return false;
    }

    try {
      console.log('[Push Notification] Unsubscribing...');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Hủy ở browser
        await subscription.unsubscribe();
        console.log('[Push Notification] Unsubscribed from push manager');
        
        // Thông báo backend xóa subscription
        await this.removeSubscriptionFromServer();
        
        console.log('[Push Notification] Unsubscribed successfully');
        return true;
      }
      console.log('[Push Notification] No active subscription found');
      return false;
    } catch (error) {
      console.error('[Push Notification] Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Xóa subscription ở backend
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[Push Notification] No token found for unsubscribe request');
        return;
      }

      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('[Push Notification] Server error when removing subscription:', response.status);
      } else {
        console.log('[Push Notification] Subscription removed from server');
      }
    } catch (error) {
      console.warn('[Push Notification] Error removing subscription from server:', error);
    }
  }

  /**
   * Gửi subscription details lên backend
   * Backend lưu subscription này trong PushSubscription entity
   * Khi có task sắp deadline, backend sẽ dùng endpoint + p256dh + auth để gửi notification
   * @param subscription PushSubscription từ pushManager.subscribe()
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: SubscriptionRequest = {
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      };

      console.log('[Push Notification] Sending subscription to backend...');
      console.log('[Push Notification] Endpoint:', subscriptionData.endpoint);

      const token = localStorage.getItem('token');
      console.log('[Push Notification] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      console.log('[Push Notification] Server response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Push Notification] Server error:', response.status, errorText);
        throw new Error(`Failed to send subscription to server: ${response.status} ${errorText}`);
      }

      console.log('[Push Notification] Subscription saved on server');
    } catch (error) {
      console.error('[Push Notification] Error sending subscription to server:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID public key từ base64url sang Uint8Array
   * Cần thiết để subscribe tới push manager
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer sang Base64 string
   * Dùng để encode p256dh và auth keys
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Kiểm tra xem user đã subscribe thành công hay chưa
   * @returns true nếu đã subscribe
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[Push Notification] Push notifications are not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const isSubscribed = !!subscription;
      console.log('[Push Notification] Subscription status:', isSubscribed);
      return isSubscribed;
    } catch (error) {
      console.error('[Push Notification] Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Hiển thị notification ở trình duyệt (khi browser được focus)
   * Lưu ý: Service Worker sẽ xử lý notification khi browser đóng
   */
  showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      console.log('[Push Notification] Showing notification:', title);
      new Notification(title, options);
    } else {
      console.warn('[Push Notification] Notification permission not granted');
    }
  }

  /**
   * Set VAPID public key từ backend config
   * Cần gọi hàm này lúc app khởi tạo với key từ backend
   */
  setVapidPublicKey(key: string): void {
    this.vapidPublicKey = key;
    console.log('[Push Notification] VAPID public key updated');
  }

  /**
   * Get current subscription details (nếu có)
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('[Push Notification] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Get permission status hiện tại
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();