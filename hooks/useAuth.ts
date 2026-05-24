import { useState, useEffect, useCallback } from "react";
import supabase from "@/lib/supabase";

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
    let mounted = true;

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AUTH SESSION ERROR]", error.message);
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? undefined,
            phone: session.user.phone ?? undefined,
            metadata: session.user.user_metadata ?? {},
          });

          try {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .single();

            if (profileError) {
              console.warn("[PROFILE LOAD WARNING]", profileError.message);
            }

            if (profileData && mounted) {
              setProfile(profileData as AuthProfile);
            }
          } catch (profileErr) {
            console.error("[PROFILE FETCH ERROR]", profileErr);
          }
        }
      } catch (err) {
        console.error("[AUTH INIT ERROR]", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? undefined,
            phone: session.user.phone ?? undefined,
            metadata: session.user.user_metadata ?? {},
          });

          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData as AuthProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("[AUTH STATE ERROR]", err);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) {
        console.error("[SIGN IN ERROR]", error.message);
        throw error;
      }

      return data;
    },
    []
  );

  const signUp = useCallback(
    async (
      phone: string,
      password: string,
      metadata: Record<string, unknown>
    ) => {
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error("[SIGN UP ERROR]", error.message);
        throw error;
      }

      return data;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[SIGN OUT ERROR]", error.message);
      throw error;
    }

    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}

export default useAuth;
