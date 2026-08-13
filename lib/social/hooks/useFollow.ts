import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface FollowState {
  isFollowing: boolean;
  isPending: boolean;
  followerCount: number;
  followingCount: number;
}

export function useFollow(targetProfileId: string) {
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: false,
    isPending: false,
    followerCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const { profile } = useAuthStore() as any;

  const myProfileId = profile?.id;

  const checkFollowStatus = useCallback(async () => {
    if (!myProfileId || !targetProfileId) return;
    setLoading(true);
    try {
      // Check if already following via profile_connections
      const { data, error } = await supabase
        .from('profile_connections')
        .select('*')
        .eq('profile_id', myProfileId)
        .eq('connected_profile_id', targetProfileId)
        .eq('connection_type', 'follow')
        .maybeSingle();

      if (error) throw error;

      // Get follower/following counts from profiles table
      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('follower_count, following_count')
        .eq('id', targetProfileId)
        .maybeSingle();

      setFollowState({
        isFollowing: !!data && data.status === 'active',
        isPending: !!data && data.status === 'pending',
        followerCount: targetProfile?.follower_count || 0,
        followingCount: targetProfile?.following_count || 0,
      });
    } finally {
      setLoading(false);
    }
  }, [myProfileId, targetProfileId]);

  const follow = useCallback(async () => {
    if (!myProfileId || !targetProfileId) return;
    setLoading(true);
    try {
      // Upsert follow connection
      const { error } = await supabase
        .from('profile_connections')
        .upsert({
          profile_id: myProfileId,
          connected_profile_id: targetProfileId,
          connection_type: 'follow',
          status: 'active',
          initiated_by: myProfileId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,connected_profile_id' });

      if (error) throw error;

      // Update counts
      await supabase.rpc('sync_profile_follower_counts', {
        p_profile_id: targetProfileId,
      });

      setFollowState(prev => ({
        ...prev,
        isFollowing: true,
        isPending: false,
        followerCount: prev.followerCount + 1,
      }));
    } finally {
      setLoading(false);
    }
  }, [myProfileId, targetProfileId]);

  const unfollow = useCallback(async () => {
    if (!myProfileId || !targetProfileId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_connections')
        .delete()
        .eq('profile_id', myProfileId)
        .eq('connected_profile_id', targetProfileId)
        .eq('connection_type', 'follow');

      if (error) throw error;

      await supabase.rpc('sync_profile_follower_counts', {
        p_profile_id: targetProfileId,
      });

      setFollowState(prev => ({
        ...prev,
        isFollowing: false,
        isPending: false,
        followerCount: Math.max(0, prev.followerCount - 1),
      }));
    } finally {
      setLoading(false);
    }
  }, [myProfileId, targetProfileId]);

  return {
    ...followState,
    loading,
    follow,
    unfollow,
    checkFollowStatus,
  };
}
