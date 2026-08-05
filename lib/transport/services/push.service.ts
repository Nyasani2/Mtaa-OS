import { supabase } from '@/lib/supabase';

// Client-side push — no edge function needed
// Uses Expo's HTTP push API directly

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function registerPushToken(userId: string, token: string, deviceType?: string) {
  const { data, error } = await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: 'expo',
      device_type: deviceType || 'unknown',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,token' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserPushTokens(userId: string) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
  return (data || []).map((d: any) => d.token);
}

export async function sendPushToUser(userId: string, title: string, body: string, data?: any) {
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) return { sent: 0 };

  // Call Expo push API directly from client
  const messages = tokens.map((token: string) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    return { sent: tokens.length, result };
  } catch (err: any) {
    console.warn('Push send failed:', err.message);
    return { sent: 0, error: err.message };
  }
}

export async function createInAppNotification(userId: string, title: string, body: string, data?: any) {
  const { data: notif, error } = await supabase
    .from('in_app_notifications')
    .insert({ user_id: userId, title, body, data: data || {} })
    .select()
    .maybeSingle();
  if (error) throw error;
  return notif;
}

export async function getUnreadNotifications(userId: string) {
  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('in_app_notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
}
