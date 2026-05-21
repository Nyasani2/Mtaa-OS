import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserData {
  id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  id_number: string | null;
  id_type: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postal_code: string | null;
  occupation: string | null;
  employer: string | null;
  income_range: string | null;
  is_verified: boolean;
  verification_level: number;
  kyc_status: string;
  trust_score: number;
  role: string;
  metadata: Record<string, any>;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUser(userId?: string) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: supaError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      if (supaError) throw supaError;
      setUser(data as UserData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!user?.user_id) throw new Error('No user loaded');
    const { data, error: supaError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.user_id)
      .select()
      .single();
    if (supaError) throw supaError;
    setUser(data as UserData);
    return data;
  }, [user]);

  useEffect(() => {
    if (userId) { fetchUser(userId); } else { setIsLoading(false); }
  }, [userId, fetchUser]);

  return { user, isLoading, error, fetchUser, updateUser, refresh: () => userId && fetchUser(userId) };
}
