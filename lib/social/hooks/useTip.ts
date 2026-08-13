import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useTip(targetProfileId: string) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { profile } = useAuthStore() as any;
  const myProfileId = profile?.id;

  const sendTip = useCallback(async (amount: number, currency = 'USD', message?: string) => {
    if (!myProfileId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_tips')
        .insert({
          sender_profile_id: myProfileId,
          recipient_profile_id: targetProfileId,
          amount,
          currency,
          message,
        });
      if (error) throw error;
      setSuccess(true);
    } finally { setLoading(false); }
  }, [myProfileId, targetProfileId]);

  return { sendTip, loading, success, reset: () => setSuccess(false) };
}
