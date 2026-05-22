import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification, NotificationType, NotificationPriority } from '../types/notification';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(userId);
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId, fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const subscription = notificationService.subscribeToNotifications(userId, () => {
      fetchNotifications();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
