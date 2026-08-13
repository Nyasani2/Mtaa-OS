import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useSubscription(creatorProfileId: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuthStore() as any;
  const myProfileId = profile?.id;

  const checkSubscription = useCallback(async () => {
    if (!myProfileId || !creatorProfileId) return;
    const { data, error } = await supabase
      .from('profile_subscriptions')
      .select('*')
      .eq('subscriber_profile_id', myProfileId)
      .eq('creator_profile_id', creatorProfileId)
      .eq('status', 'active')
      .maybeSingle();
    if (!error) setIsSubscribed(!!data);
  }, [myProfileId, creatorProfileId]);

  const subscribe = useCallback(async (tier: string, price: number, interval: string) => {
    if (!myProfileId) throw new Error('Not authenticated');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_subscriptions')
        .upsert({
          subscriber_profile_id: myProfileId,
          creator_profile_id: creatorProfileId,
          tier, price, interval,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'subscriber_profile_id,creator_profile_id' });
      if (error) throw error;
      setIsSubscribed(true);
    } finally { setLoading(false); }
  }, [myProfileId, creatorProfileId]);

  const unsubscribe = useCallback(async () => {
    if (!myProfileId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_subscriptions')
        .update({ status: 'cancelled' })
        .eq('subscriber_profile_id', myProfileId)
        .eq('creator_profile_id', creatorProfileId);
      if (error) throw error;
      setIsSubscribed(false);
    } finally { setLoading(false); }
  }, [myProfileId, creatorProfileId]);

  return { isSubscribed, loading, subscribe, unsubscribe, checkSubscription };
}
