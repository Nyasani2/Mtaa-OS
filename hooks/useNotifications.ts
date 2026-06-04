// hooks/useNotifications.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: 'system' | 'transaction' | 'message' | 'alert' | 'reminder' | 'promotion';
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
  clearError: () => void;
}

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ notifications: [], unreadCount: 0 });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const notifications = (data || []) as Notification[];
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length,
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  markAllAsRead: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteNotification: async (notificationId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.is_read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  getUnreadNotifications: () => get().notifications.filter(n => !n.is_read),
  getNotificationsByType: (type: Notification['type']) =>
    get().notifications.filter(n => n.type === type),
  clearError: () => set({ error: null }),
}));

export default useNotifications;
