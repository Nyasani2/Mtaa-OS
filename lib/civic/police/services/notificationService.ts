import { supabase } from '@/lib/supabase';

export type NotificationType = 'case_update' | 'incident_alert' | 'assignment' | 'escalation' | 'system' | 'message';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export class NotificationService {
  async getNotifications(userId: string, filters?: { type?: NotificationType; priority?: NotificationPriority; read?: boolean }) {
    let query = supabase.from('police_notifications').select('*').eq('user_id', userId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.read !== undefined) query = query.eq('read', filters.read);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notification[];
  }

  async getNotificationById(id: string) {
    const { data, error } = await supabase.from('police_notifications').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Notification;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('police_notifications').insert(notification).select().maybeSingle();
    if (error) throw error;
    return data as Notification;
  }

  async markAsRead(id: string) {
    const { data, error } = await supabase.from('police_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as Notification;
  }

  async markAllAsRead(userId: string) {
    const { data, error } = await supabase.from('police_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId).eq('read', false).select();
    if (error) throw error;
    return data as Notification[];
  }

  async deleteNotification(id: string) {
    const { error } = await supabase.from('police_notifications').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteAllRead(userId: string) {
    const { error } = await supabase.from('police_notifications')
      .delete().eq('user_id', userId).eq('read', true);
    if (error) throw error;
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase.from('police_notifications')
      .select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
    if (error) throw error;
    return count || 0;
  }

  async getNotificationStats(userId: string) {
    const { data, error } = await supabase.from('police_notifications')
      .select('type, read', { count: 'exact' }).eq('user_id', userId);
    if (error) throw error;
    const stats = { total: data?.length || 0, unread: 0, byType: {} as Record<string, number> };
    data?.forEach((row: any) => {
      if (!row.read) stats.unread++;
      stats.byType[row.type] = (stats.byType[row.type] || 0) + 1;
    });
    return stats;
  }

  async sendBulkNotifications(userIds: string[], notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>) {
    const notifications = userIds.map(userId => ({ ...notification, user_id: userId }));
    const { data, error } = await supabase.from('police_notifications').insert(notifications).select();
    if (error) throw error;
    return data as Notification[];
  }

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase.channel(`notifications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_notifications', filter: `user_id=eq.${userId}` }, callback)
      .subscribe();
  }
}

export const notificationService = new NotificationService();
