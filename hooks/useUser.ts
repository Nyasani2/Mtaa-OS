// hooks/useUser.ts
// User data hook for MTAA OS
// Imported by: app/(commerce)/shop/[id]/staff.tsx, app/(commerce)/shop/create.tsx

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role?: string;
  verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export function useUser(userId?: string) {
  const currentUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      if (err) throw err;
      setProfile(data as UserProfile);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single();
      if (err) throw err;
      setProfile(data as UserProfile);
      return data as UserProfile;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    if (!query.trim()) return [];
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, phone, avatar_url')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data || []).map((u: any) => ({
        id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        avatar_url: u.avatar_url,
      }));
    } catch (e: any) {
      console.error('[useUser] search:', e);
      return [];
    }
  }, []);

  const getUserById = useCallback(async (id: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    } catch (e: any) {
      console.error('[useUser] getById:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else if (currentUser?.id) {
      fetchProfile(currentUser.id);
    }
  }, [userId, currentUser?.id, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    searchUsers,
    getUserById,
    currentUser,
  };
}

export default useUser;
