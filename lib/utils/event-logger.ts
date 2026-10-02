import { supabase } from '@/lib/supabase';

export async function logEvent(eventType: string, details: any, userId?: string) {
  try {
    // Fire and forget: we don't want logging to block the user's action
    supabase.from('system_audit_logs').insert({
      event_type: eventType,
      user_id: userId || null,
      details: details,
    }).then(({ error }) => {
      if (error) {
        console.error('[Event Logger] Failed to log event:', error);
      }
    });
  } catch (err) {
    console.error('[Event Logger] Critical failure:', err);
  }
}
