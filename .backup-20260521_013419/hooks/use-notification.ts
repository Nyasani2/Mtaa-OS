/**
 * MTAA AFRIQ — useNotification Hook
 * React hook for notification inbox, real-time updates, and actions
 * Connects to NotificationEngine via WebSocket + Supabase realtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  NotificationPayload,
  NotificationCategory,
  NotificationPreferences,
  CategoryPreference,
} from '@/kernel/notification-engine';
const supabase: SupabaseClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseNotificationReturn {
  // Inbox
  notifications: NotificationPayload[];
  groupedNotifications: Record<string, NotificationPayload[]>;
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  executeAction: (notificationId: string, actionId: string) => Promise<unknown>;

  // Real-time
  isConnected: boolean;
  liveUpdates: NotificationPayload[];

  // Preferences
  preferences: NotificationPreferences | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  updateCategoryPref: (category: NotificationCategory, pref: Partial<CategoryPreference>) => Promise<void>;
  toggleGlobal: (enabled: boolean) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useNotification(userId: string | undefined): UseNotificationReturn {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<Record<string, NotificationPayload[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<NotificationPayload[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const pageRef = useRef(0);
  const PAGE_SIZE = 20;

  // ─── Fetch Notifications ─────────────────────────────────────────

  const fetchNotifications = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      const newNotifications = data || [];

      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setHasMore(newNotifications.length === PAGE_SIZE);

      // Build grouped view
      const grouped: Record<string, NotificationPayload[]> = {};
      const allNotifs = append ? [...notifications, ...newNotifications] : newNotifications;
      for (const notif of allNotifs) {
        const key = notif.group_key || notif.category;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(notif);
      }
      setGroupedNotifications(grouped);

      // Fetch unread count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
        .is('archived_at', null);

      setUnreadCount(count || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── WebSocket Connection ────────────────────────────────────────

  const connectWebSocket = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/notifications?user_id=${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      // Register device token
      ws.send(JSON.stringify({
        type: 'register',
        user_id: userId,
        platform: 'web',
        app_version: '1.0.0',
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'notification':
          setNotifications(prev => [message.payload, ...prev]);
          setUnreadCount(prev => prev + 1);
          break;

        case 'live_update':
          setLiveUpdates(prev => {
            const filtered = prev.filter(u => u.id !== message.payload.id);
            return [message.payload, ...filtered].slice(0, 10);
          });
          // Update existing notification in list
          setNotifications(prev => 
            prev.map(n => n.id === message.payload.id ? message.payload : n)
          );
          break;

        case 'badge_update':
          setUnreadCount(message.count);
          break;

        case 'read_receipt':
          setNotifications(prev =>
            prev.map(n => n.id === message.notification_id ? { ...n, read_at: message.timestamp } : n)
          );
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 5 seconds
      setTimeout(() => connectWebSocket(), 5000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [userId]);

  // ─── Supabase Realtime (Fallback) ────────────────────────────────

  const setupRealtime = useCallback(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as NotificationPayload, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as NotificationPayload : n)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // ─── Actions ─────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString(), status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString(), status: 'read' }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [userId]);

  const dismiss = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString(), status: 'dismissed' })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, []);

  const archive = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString(), status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }, []);

  const executeAction = useCallback(async (notificationId: string, actionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('notification-action', {
        body: { notification_id: notificationId, action_id: actionId },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
      throw err;
    }
  }, []);

  // ─── Preferences ─────────────────────────────────────────────────

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  }, [userId]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...prefs,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setPreferences(prev => prev ? { ...prev, ...prefs } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  }, [userId]);

  const updateCategoryPref = useCallback(async (category: NotificationCategory, pref: Partial<CategoryPreference>) => {
    if (!userId || !preferences) return;

    const updated = {
      ...preferences.per_category,
      [category]: { ...preferences.per_category[category], ...pref },
    };

    await updatePreferences({ per_category: updated });
  }, [userId, preferences, updatePreferences]);

  const toggleGlobal = useCallback(async (enabled: boolean) => {
    await updatePreferences({ global_enabled: enabled });
  }, [updatePreferences]);

  // ─── Pagination ──────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    pageRef.current += 1;
    await fetchNotifications(pageRef.current, true);
  }, [hasMore, loading, fetchNotifications]);

  const refresh = useCallback(async () => {
    pageRef.current = 0;
    await fetchNotifications(0, false);
  }, [fetchNotifications]);

  // ─── Effects ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    fetchPreferences();
    connectWebSocket();
    const cleanupRealtime = setupRealtime();

    return () => {
      wsRef.current?.close();
      cleanupRealtime?.();
    };
  }, [userId, fetchNotifications, fetchPreferences, connectWebSocket, setupRealtime]);

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    deleteNotification,
    archive,
    executeAction,
    isConnected,
    liveUpdates,
    preferences,
    updatePreferences,
    updateCategoryPref,
    toggleGlobal,
    refresh,
    loadMore,
    hasMore,
  };
}
