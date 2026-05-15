/**
 * MTAA OS — useAuth Hook (stub)
 * Replace with your actual Supabase auth hook.
 */

import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  kyc_level: number | null;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return { user, profile, isLoading };
}
