import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  kyc_level?: number;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          metadata: session.user.user_metadata,
        });
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        if (profileData) setProfile(profileData as AuthProfile);
      }
      setIsLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          metadata: session.user.user_metadata,
        });
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (phone: string, password: string, metadata: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return { user, profile, isLoading, signIn, signUp, signOut };
}

export default useAuth;
