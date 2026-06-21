import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
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

  initialize: () => Promise<void>;
  setUser: (user: any, session: any) => void;
  setProfile: (profile: any) => void;
  signOut: () => Promise<void>;
  updateProfileField: (field: string, value: any) => void;
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

      // IDENTITY GETTERS — priority: full_name > display_name > username > email prefix
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
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session) {
            set({ isLoading: false, initialized: true });
            return;
          }

          // Get user
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            set({ isLoading: false, initialized: true });
            return;
          }

          // Fetch profile from public.profiles
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

          // Set up auth state listener for live sync
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
