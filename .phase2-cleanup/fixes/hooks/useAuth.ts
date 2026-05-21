import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'expo-router';

export function useAuth() {
  const supabase = createClient(); const router = useRouter();
  const signIn = useCallback(async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) throw error; router.replace('/(os)/home');
  }, [router]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut(); router.replace('/auth/login');
  }, [router]);
  const signUp = useCallback(async (phone: string, password: string, metadata: Record<string, unknown>) => {
    const { error } = await supabase.auth.signUp({ phone, password, options: { data: metadata } });
    if (error) throw error;
  }, []);
  return { signIn, signOut, signUp };
}
