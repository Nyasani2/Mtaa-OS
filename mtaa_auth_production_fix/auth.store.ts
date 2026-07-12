import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  profile: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  getDisplayName: () => string;
  getAvatarUrl: () => string | null;
  getUserInitials: () => string;
  getUserRole: () => string;
  getTrustScore: () => number;
  initialize: () => Promise<void>;
  setUser: (user: User | null, session?: any) => void;
  setSession: (session: any) => void;
  setProfile: (profile: any) => void;
  signOut: () => Promise<void>;
  updateProfileField: (field: string, value: any) => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; data?: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: string; success?: boolean; user?: User | null }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>;
}

// ─── Production guards ──────────────────────────────────────
let authListenerUnsubscribe: (() => void) | null = null;
let initPromise: Promise<void> | null = null;

function getRedirectOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://mtaa.app';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      initialized: false,

      getDisplayName: () => {
        const { profile, user } = get();
        if (profile?.full_name?.trim()) return profile.full_name.trim();
        if (profile?.display_name?.trim()) return profile.display_name.trim();
        if (profile?.username?.trim()) return profile.username.trim();
        if (user?.email) return user.email.split('@')[0];
        return 'User';
      },
      getAvatarUrl: () => {
        const { profile } = get();
        return profile?.avatar_url || profile?.cover_photo_url || null;
      },
      getUserInitials: () => {
        const name = get().getDisplayName();
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      },
      getUserRole: () => {
        const { profile } = get();
        return profile?.role || 'user';
      },
      getTrustScore: () => {
        const { profile } = get();
        return profile?.trust_score || 0;
      },

      initialize: async () => {
        // Race-condition guard: only one init at a time
        if (initPromise) return initPromise;
        const state = get();
        if (state.initialized) return;

        initPromise = (async () => {
          set({ isLoading: true });
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
              set({ isLoading: false, initialized: true });
              return;
            }
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              set({ isLoading: false, initialized: true });
              return;
            }

            // Fetch existing profile or auto-create for new users
            let profile = null;
            const { data: existingProfile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // No profile row exists — auto-create (graceful for new users)
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                  username: user.user_metadata?.username || '',
                  role: 'user',
                  trust_score: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();
              if (!createError) profile = newProfile;
              else console.warn('[Auth] Auto-create profile failed:', createError.message);
            } else if (!profileError) {
              profile = existingProfile;
            } else {
              console.warn('[Auth] Profile fetch error:', profileError.message);
            }

            set({
              user,
              session,
              profile: profile || null,
              isAuthenticated: true,
              isLoading: false,
              initialized: true,
            });

            // ─── Listener cleanup (production fix) ─────────────────
            if (authListenerUnsubscribe) {
              try { authListenerUnsubscribe(); } catch (e) { /* noop */ }
            }

            const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession) {
                const { data: { user: newUser } } = await supabase.auth.getUser();
                let newProfile = null;
                const { data: ep } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('user_id', newUser?.id)
                  .single();
                if (!ep) {
                  const { data: cp } = await supabase
                    .from('user_profiles')
                    .insert({
                      user_id: newUser?.id,
                      email: newUser?.email,
                      full_name: newUser?.user_metadata?.full_name || '',
                      display_name: newUser?.user_metadata?.display_name || newUser?.email?.split('@')[0] || '',
                      role: 'user',
                      trust_score: 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                  newProfile = cp;
                } else {
                  newProfile = ep;
                }
                set({
                  user: newUser,
                  session: newSession,
                  profile: newProfile || null,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else if (event === 'SIGNED_OUT') {
                set({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false });
              } else if (event === 'USER_UPDATED' && newSession) {
                const { data: { user: updatedUser } } = await supabase.auth.getUser();
                set({ user: updatedUser, session: newSession });
              }
            });
            authListenerUnsubscribe = listener?.subscription?.unsubscribe ?? null;
          } catch (error) {
            console.error('[Auth] Initialization error:', error);
            set({ isLoading: false, initialized: true });
          } finally {
            initPromise = null;
          }
        })();

        return initPromise;
      },

      setUser: (user, session) => set({ user, session, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),

      signOut: async () => {
        // Clean up listener before signing out
        if (authListenerUnsubscribe) {
          try { authListenerUnsubscribe(); } catch (e) { /* noop */ }
          authListenerUnsubscribe = null;
        }
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false });
      },

      updateProfileField: (field, value) => {
        const { profile } = get();
        if (profile) set({ profile: { ...profile, [field]: value } });
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (error && error.code !== 'PGRST116') {
            console.warn('[Auth] refreshProfile error:', error.message);
          }
          set({ profile: profile || null });
        } catch (e) {
          console.error('[Auth] refreshProfile failed:', e);
        }
      },

      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { error: error.message };
          set({ user: data.user, session: data.session, isAuthenticated: true });
          return { data };
        } catch (e: any) {
          return { error: e.message || 'Sign in failed' };
        }
      },

      signUp: async (email, password, metadata) => {
        try {
          const redirectUrl = `${getRedirectOrigin()}/auth/callback`;
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo: redirectUrl,
            },
          });
          if (error) return { error: error.message, success: false };

          // Auto-create user_profiles row for new sign-ups
          if (data.user) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                user_id: data.user.id,
                email: data.user.email,
                full_name: metadata?.full_name || '',
                display_name: metadata?.display_name || email.split('@')[0],
                username: metadata?.username || '',
                role: 'user',
                trust_score: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });
            if (profileError) {
              console.warn('[Auth] Auto-create profile on signUp failed:', profileError.message);
            }
          }

          set({ user: data.user, session: data.session, isAuthenticated: !!data.session });
          return { success: true, user: data.user };
        } catch (e: any) {
          return { error: e.message || 'Sign up failed', success: false };
        }
      },

      resetPassword: async (email) => {
        try {
          const redirectUrl = `${getRedirectOrigin()}/auth/reset-password`;
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
          });
          if (error) return { error: error.message };
          return {};
        } catch (e: any) {
          return { error: e.message || 'Reset failed' };
        }
      },

      updateProfile: async (data) => {
        try {
          const { user } = get();
          if (!user) return { error: 'Not authenticated' };
          const { error } = await supabase.auth.updateUser({ data });
          if (error) return { error: error.message };
          set({ user: { ...user, ...data } });
          return {};
        } catch (e: any) {
          return { error: e.message || 'Update failed' };
        }
      },
    }),
    {
      name: 'mtaa-auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
