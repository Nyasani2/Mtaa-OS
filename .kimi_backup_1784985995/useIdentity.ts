import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './store/auth.store';

export interface IdentityProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  reputation_score: number;
  created_at: string;
}

export function useIdentity() {
  const { user, session, profile } = useAuthStore();

  const fetchIdentity = useCallback(async () => {
    if (!user || !session) return null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as IdentityProfile;
    } catch (err) {
      console.error('fetchIdentity error:', err);
      return null;
    }
  }, [user, session]);

  const updateIdentity = useCallback(async (updates: Partial<IdentityProfile>) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('updateIdentity error:', err);
      return false;
    }
  }, [user]);

  const verifyIdentity = useCallback(async () => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ verified: true })
        .eq('id', user.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('verifyIdentity error:', err);
      return false;
    }
  }, [user]);

  return {
    user,
    session,
    profile,
    identity: profile,
    fetchIdentity,
    updateIdentity,
    verifyIdentity,
    isAuthenticated: !!user && !!session,
  };
}
