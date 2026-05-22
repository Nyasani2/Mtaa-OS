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
