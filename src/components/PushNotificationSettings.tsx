import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Bell, BellOff, Settings } from 'lucide-react';
import { pushNotificationService } from '../services/pushNotificationService';

interface PushNotificationSettingsProps {
  className?: string;
}

/**
 * Component để quản lý Push Notification Settings
 * 
 * Luồng hoạt động:
 * 1. User bật toggle → request permission từ browser
 * 2. Browser yêu cầu user chấp nhận notification
 * 3. Nếu chấp nhận → subscribe tới push manager
 * 4. Service Worker được register từ /sw.js
 * 5. Gửi endpoint + p256dh + auth lên backend
 * 6. Backend lưu PushSubscription (userId, endpoint, p256dh, auth)
 * 7. Khi có task sắp deadline → backend gửi push notification
 * 8. Service Worker nhận notification và hiển thị trên UI
 */
export function PushNotificationSettings({ className }: PushNotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkSupport();
    checkPermission();
    checkSubscription();
  }, []);

  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('[Push Settings] Browser support:', supported);
    setIsSupported(supported);
  };

  const checkPermission = () => {
    const perm = Notification.permission;
    console.log('[Push Settings] Current permission:', perm);
    setPermission(perm);
  };

  const checkSubscription = async () => {
    try {
      const subscribed = await pushNotificationService.isSubscribed();
      console.log('[Push Settings] Subscription status:', subscribed);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('[Push Settings] Error checking subscription:', error);
    }
  };

  const handleToggleNotification = async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (enabled) {
        console.log('[Push Settings] Enabling notifications...');
        
        // 1. Request permission từ browser
        const permissionResult = await pushNotificationService.requestPermission();
        setPermission(permissionResult);
        console.log('[Push Settings] Permission result:', permissionResult);
        
        if (permissionResult === 'granted') {
          // 2. Subscribe tới push manager
          console.log('[Push Settings] Subscribing to push notifications...');
          await pushNotificationService.subscribe();
          setIsSubscribed(true);
          
          setSuccessMessage('✅ Push notifications enabled successfully!');
          console.log('[Push Settings] Notifications enabled');
          
          // Show success notification
          pushNotificationService.showNotification(
            'Notifications Enabled 🎉',
            {
              body: 'You will now receive task deadline reminders',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'notification-enabled'
            }
          );
        } else if (permissionResult === 'denied') {
          setError('❌ Notification permission denied. Please enable it in your browser settings.');
          console.error('[Push Settings] Permission denied by user');
        } else {
          setError('⚠️ Notification permission not granted');
          console.warn('[Push Settings] Permission not granted');
        }
      } else {
        // 3. Unsubscribe
        console.log('[Push Settings] Disabling notifications...');
        const success = await pushNotificationService.unsubscribe();
        if (success) {
          setIsSubscribed(false);
          setSuccessMessage('✅ Push notifications disabled');
          console.log('[Push Settings] Notifications disabled');
        } else {
          setError('⚠️ Could not disable notifications');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[Push Settings] Error toggling notifications:', err);
      setError(`❌ Error: ${errorMsg}`);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
      // Clear messages after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  const handleTestNotification = () => {
    console.log('[Push Settings] Testing notification...');
    
    if (permission !== 'granted') {
      setError(`❌ Notifications not enabled. Current permission: ${permission}`);
      return;
    }
    
    try {
      // Tạo test notification
      const notification = new Notification('📋 Task Deadline Reminder', {
        body: "Your task 'Complete project' is due in 1 hour!",
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: false // Auto close sau khi user interact hoặc timeout
      });
      
      console.log('[Push Settings] Test notification created');
      
      notification.onshow = () => {
        console.log('[Push Settings] ✅ Notification shown');
      };
      
      notification.onerror = (error) => {
        console.error('[Push Settings] ❌ Notification error:', error);
        setError('Error showing notification');
      };
      
      notification.onclose = () => {
        console.log('[Push Settings] 🔔 Notification closed');
      };
      
      notification.onclick = () => {
        console.log('[Push Settings] 👆 Notification clicked');
        window.focus();
        notification.close();
      };
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      setSuccessMessage('✅ Test notification sent! Check your notification area');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Push Settings] Error creating test notification:', err);
      setError(`❌ Error: ${errorMsg}`);
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-800">
          <BellOff className="w-5 h-5" />
          <span className="text-sm font-medium">Push notifications are not supported in this browser</span>
        </div>
        <p className="text-xs text-yellow-700 mt-2">
          Supported browsers: Chrome, Edge, Firefox, Opera (desktop only)
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Push Notifications</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isSubscribed ? (
            <Bell className="w-4 h-4 text-green-600 animate-pulse" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotification}
            disabled={isLoading || permission === 'denied'}
          />
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">You'll be notified about:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>📅 Task deadlines approaching (1 hour before)</li>
          <li>⏰ Important schedule updates</li>
          <li>🔔 System notifications</li>
        </ul>
      </div>

      {/* Permission Status */}
      {permission === 'denied' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">🚫 Notifications Blocked</p>
          <p className="text-xs text-red-700 mt-1">
            Please enable notifications in your browser settings to receive reminders.
          </p>
        </div>
      )}

      {permission === 'granted' && isSubscribed && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">✅ Notifications Active</p>
          <p className="text-xs text-green-700 mt-1">
            Backend is checking for upcoming tasks every 30 seconds and will send notifications.
          </p>
        </div>
      )}

      {/* Test Button */}
      {permission === 'granted' && isSubscribed && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestNotification}
          disabled={isLoading}
          className="w-full text-xs"
        >
          🔔 Send Test Notification
        </Button>
      )}

      {/* Permission Info */}
      <div className="text-xs text-gray-500 border-t pt-2">
        <div className="flex justify-between">
          <span>Permission Status:</span>
          <span className={`font-medium ${
            permission === 'granted' ? 'text-green-600' :
            permission === 'denied' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {permission === 'default' ? 'Not Set' : permission.charAt(0).toUpperCase() + permission.slice(1)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Subscription Status:</span>
          <span className={`font-medium ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
            {isSubscribed ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}
