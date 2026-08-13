import { supabase } from '@/lib/supabase';

export const logSecurityEvent = async (
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await supabase.from('security_events').insert({
    user_id: userId,
    event_type: eventType,
    metadata: metadata ?? {},
  });
};
