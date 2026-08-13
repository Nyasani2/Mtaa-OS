import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from './store/auth.store';
import { supabase } from '@/lib/supabase';

interface IdentityContextValue {
  identity: Record<string, unknown> | null;
  user: any;
  profile: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const IdentityContext = createContext<IdentityContextValue>({
  identity: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useIdentity = (): IdentityContextValue => {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
};

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) { setProfile(null); return; }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setProfile(data as Record<string, unknown>);
      } else {
        setProfile({
          user_id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
    };
    fetchProfile();
  }, [user?.id]);

  const value = useMemo(() => ({
    identity: (profile ?? user) as Record<string, unknown> | null,
    user,
    profile,
    isLoading,
    isAuthenticated,
  }), [profile, user, isLoading, isAuthenticated]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
};
