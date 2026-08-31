import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [deviceToken, setDeviceToken] = useState(null);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.getNotifications({ limit: 20 });
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount ?? res.data.filter((n) => !n.isRead).length);
      } else if (Array.isArray(res)) {
        setNotifications(res);
        setUnreadCount(res.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Request browser push notification permission and register FCM device token
  const requestPermissionAndRegister = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return null;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const messaging = await getFirebaseMessaging();
        if (messaging) {
          try {
            // Register service worker if available
            let swRegistration = null;
            if ('serviceWorker' in navigator) {
              swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }

            const token = await getToken(messaging, {
              serviceWorkerRegistration: swRegistration,
            });

            if (token) {
              setDeviceToken(token);
              await api.registerDeviceToken(token, 'web');
              console.log('[NotificationContext] FCM token registered:', token.slice(0, 15) + '...');
              return token;
            }
          } catch (tokenErr) {
            console.warn('[NotificationContext] FCM token retrieval note:', tokenErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('[NotificationContext] Permission request error:', err.message);
    }
    return null;
  }, []);

  // Sync notifications on mount / auth state change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Auto-register device if permission was already granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        requestPermissionAndRegister();
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setDeviceToken(null);
    }
  }, [isAuthenticated, fetchNotifications, requestPermissionAndRegister]);

  // Listen to foreground FCM messages
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe = null;
    const setupListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('[NotificationContext] Foreground push received:', payload);
          const title = payload.notification?.title || payload.data?.title || 'New Notification';
          const body = payload.notification?.body || payload.data?.body || '';

          // Show floating toast alert
          showToast(`${title}: ${body}`, 'info');

          // Prepend to notifications list
          setNotifications((prev) => [
            {
              id: payload.data?.notificationId || String(Date.now()),
              title,
              body,
              type: payload.data?.type || 'GENERAL',
              createdAt: new Date().toISOString(),
              isRead: false,
              data: payload.data || {},
            },
            ...prev,
          ]);
          setUnreadCount((c) => c + 1);
        });
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, showToast]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  };

  // Delete single notification
  const deleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      showToast('All notifications cleared', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear notifications', 'error');
    }
  };

  // Send a test push notification
  const sendTestNotification = async () => {
    try {
      await api.sendTestNotification();
      showToast('Push notification sent! Check your notification center.', 'success');
      await fetchNotifications();
    } catch (err) {
      showToast(err.message || 'Failed to dispatch test notification', 'error');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        permission,
        deviceToken,
        fetchNotifications,
        requestPermissionAndRegister,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export default NotificationContext;
