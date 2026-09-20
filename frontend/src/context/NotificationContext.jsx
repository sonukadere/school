import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  // Fetch notifications from backend (with optional silent flag for periodic background sync)
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.getNotifications({ limit: 30 });
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
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  // Request browser notification permission (Standard Web Notification API)
  const requestPermissionAndRegister = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications are not supported by your browser.', 'info');
      return null;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        showToast('Browser notifications enabled successfully!', 'success');
      }
      return perm;
    } catch (err) {
      console.warn('[NotificationContext] Permission request error:', err.message);
      return null;
    }
  }, [showToast]);

  // Sync notifications on mount / auth state change & periodic check every 30s only when tab is visible
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();

      const interval = setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          fetchNotifications(true);
        }
      }, 30000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  }, [showToast]);

  // Delete single notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      showToast('Notification deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  }, [showToast]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      showToast('All notifications cleared', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear notifications', 'error');
    }
  }, [showToast]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await api.sendTestNotification();
      showToast('Notification dispatched! Check your notification list.', 'success');

      // Native browser notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Test Notification', {
          body: `Hello ${user?.name || 'User'}, your in-app notification system is active!`,
          icon: '/favicon.svg',
        });
      }

      await fetchNotifications(true);
    } catch (err) {
      showToast(err.message || 'Failed to dispatch test notification', 'error');
    }
  }, [showToast, user?.name, fetchNotifications]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      permission,
      deviceToken: null,
      fetchNotifications,
      requestPermissionAndRegister,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      sendTestNotification,
    }),
    [
      notifications,
      unreadCount,
      loading,
      permission,
      fetchNotifications,
      requestPermissionAndRegister,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      sendTestNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
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
