// lib/services/notification-service.ts
// FIXED: Added missing supabase import

import { supabase } from '@/lib/supabase';
import { ServiceResult, handleServiceError } from '@/lib/utils/service-helpers';

export async function getNotifications(userId: string, limit = 50): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function markNotificationRead(notificationId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function deleteNotification(notificationId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}

export async function createNotification(payload: any): Promise<ServiceResult<any>> {
  try {
    const { data, error } = await supabase.from('notifications').insert(payload).select().maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return handleServiceError(err);
  }
}
