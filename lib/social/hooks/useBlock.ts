import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useBlock(targetProfileId: string) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuthStore();
  const myProfileId = profile?.id;

  const checkBlockStatus = useCallback(async () => {
    if (!myProfileId || !targetProfileId) return;
    const { data, error } = await supabase
      .from('profile_blocks')
      .select('id')
      .eq('blocker_profile_id', myProfileId)
      .eq('blocked_profile_id', targetProfileId)
      .maybeSingle();
    if (!error) setIsBlocked(!!data);
  }, [myProfileId, targetProfileId]);

  const block = useCallback(async (reason?: string) => {
    if (!myProfileId || !targetProfileId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_blocks')
        .insert({ blocker_profile_id: myProfileId, blocked_profile_id: targetProfileId, reason });
      if (error) throw error;
      setIsBlocked(true);
    } finally { setLoading(false); }
  }, [myProfileId, targetProfileId]);

  const unblock = useCallback(async () => {
    if (!myProfileId || !targetProfileId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_blocks')
        .delete()
        .eq('blocker_profile_id', myProfileId)
        .eq('blocked_profile_id', targetProfileId);
      if (error) throw error;
      setIsBlocked(false);
    } finally { setLoading(false); }
  }, [myProfileId, targetProfileId]);

  return { isBlocked, loading, block, unblock, checkBlockStatus };
}
