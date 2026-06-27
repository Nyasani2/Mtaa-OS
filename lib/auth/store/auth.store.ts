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

  // Identity getters
  getDisplayName: () => string;
  getAvatarUrl: () => string | null;
  getUserInitials: () => string;
  getUserRole: () => string;
  getTrustScore: () => number;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null, session?: any) => void;
  setSession: (session: any) => void;
  setProfile: (profile: any) => void;
  signOut: () => Promise<void>;
  updateProfileField: (field: string, value: any) => void;

  // Missing methods that consumers expect
  signIn: (email: string, password: string) => Promise<{ error?: string; data?: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: string; success?: boolean; user?: User | null }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>;
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

      // IDENTITY GETTERS
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
        const state = get();
        if (state.initialized) return;

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

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError);
          }

          set({
            user,
            session,
            profile: profile || null,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          });

          supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession) {
              const { data: { user: newUser } } = await supabase.auth.getUser();
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', newUser?.id)
                .single();

              set({
                user: newUser,
                session: newSession,
                profile: newProfile || null,
                isAuthenticated: true,
                isLoading: false,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
              });
            } else if (event === 'USER_UPDATED' && newSession) {
              const { data: { user: updatedUser } } = await supabase.auth.getUser();
              set({ user: updatedUser, session: newSession });
            }
          });

        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false, initialized: true });
        }
      },

      setUser: (user, session) => {
        set({ user, session, isAuthenticated: !!user });
      },

      setSession: (session) => {
        set({ session });
      },

      setProfile: (profile) => {
        set({ profile });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateProfileField: (field, value) => {
        const { profile } = get();
        if (profile) {
          set({ profile: { ...profile, [field]: value } });
        }
      },

      // NEW: signIn
      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { error: error.message };
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
          });
          return { data };
        } catch (e: any) {
          return { error: e.message || 'Sign in failed' };
        }
      },

      // NEW: signUp
      signUp: async (email, password, metadata) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
          });
          if (error) return { error: error.message, success: false };
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
          });
          return { success: true, user: data.user };
        } catch (e: any) {
          return { error: e.message || 'Sign up failed', success: false };
        }
      },

      // NEW: resetPassword
      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) return { error: error.message };
          return {};
        } catch (e: any) {
          return { error: e.message || 'Reset failed' };
        }
      },

      // NEW: updateProfile
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
