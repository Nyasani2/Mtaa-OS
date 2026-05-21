import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string; email: string; phone?: string;
  kyc_level: number; country_code: string; created_at: string;
}

export function useUser() {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data && !error) setUser(data as User);
      setLoading(false);
    };
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setLoading(false); } else fetchUser();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
