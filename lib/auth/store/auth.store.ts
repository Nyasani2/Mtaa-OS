// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import { pinEngine } from '@/lib/security/pin-engine';
import { biometricEngine } from '@/lib/security/biometric-engine';

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  profile: any | null;
  session: any | null;
  isLoading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  pinSet: boolean;
  biometricEnabled: boolean;
  isAppLocked: boolean;
  lockTimestamp: number | null;
  lastActiveAt: number;

  initialize: () => Promise<void>;
  setUser: (user: User | null, session?: any) => void;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error?: any; data?: any }>;
  signOut: () => Promise<void>;
  getUserRole: () => string | null;
  getAvatarUrl: () => string | null;
  getDisplayName: () => string | null;
  updatePassword: (newPassword: string) => Promise<{ error?: any }>;

  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPin: () => Promise<void>;
  hasPin: () => Promise<boolean>;

  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;

  lockApp: () => void;
  unlockApp: () => void;
  updateLastActive: () => void;
}

const AUTH_STORAGE_KEY = 'mtaa-auth-storage';
const LAST_ACTIVE_KEY = 'mtaa-last-active';
const AUTO_LOCK_SECONDS = 30;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      initialized: false,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isEmailVerified: false,
      pinSet: false,
      biometricEnabled: false,
      isAppLocked: false,
      lockTimestamp: null,
      lastActiveAt: Date.now(),

      initialize: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          // SELF-HEAL: never show logged-in when Supabase has no live session
          if (!session?.user) { set({ user: null, session: null, isAuthenticated: false }); }
          if (session?.user) {
            const user = {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
            };

            const { data: profile } = await supabase
              .from('user_profiles')
              .select('email_verified, pin_set, biometric_enabled, display_name, full_name, username, avatar_url')
              .eq('user_id', user.id)
              .single();

            const hasPin = await pinEngine.hasPin(user.id);
            const bioEnabled = await biometricEngine.isBiometricEnabled(user.id);

            set({
              user,
              session,
              isAuthenticated: true,
              isEmailVerified: profile?.email_verified ?? false,
              pinSet: hasPin,
              biometricEnabled: bioEnabled,
              isLoading: false,
            });

            const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
            if (lastActive) {
              const elapsed = (Date.now() - parseInt(lastActive, 10)) / 1000;
              if (elapsed > AUTO_LOCK_SECONDS && hasPin) {
                set({ isAppLocked: true, lockTimestamp: Date.now() });
              }
            }
          } else {
            set({ isLoading: false, initialized: true });
          }
        } catch (err) {
          console.error('Auth init error:', err);
          set({ isLoading: false });
        }
      },

      setUser: (user, session) => {
        set({
          user,
          session: session || null,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error };

        const user = data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          user_metadata: data.user.user_metadata,
        } : null;

        const hasPin = user ? await pinEngine.hasPin(user.id) : false;
        const bioEnabled = user ? await biometricEngine.isBiometricEnabled(user.id) : false;

        set({
          user,
          session: data.session,
          isAuthenticated: true,
          isEmailVerified: data.user?.email_confirmed_at != null,
          pinSet: hasPin,
          biometricEnabled: bioEnabled,
          isAppLocked: false,
        });
        return {};
      },

      signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        if (error) return { error };

        if (data.user) {
          await supabase.from('user_profiles').insert({
            user_id: data.user.id,
            email,
            email_verified: false,
            pin_set: false,
            biometric_enabled: false,
            created_at: new Date().toISOString(),
          });
        }
        return { data };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        await pinEngine.clearAll();
        await biometricEngine.clearAll();
        await AsyncStorage.multiRemove([
          AUTH_STORAGE_KEY,
          LAST_ACTIVE_KEY,
          'supabase.auth.token',
        ]);
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isEmailVerified: false,
          pinSet: false,
          biometricEnabled: false,
          isAppLocked: false,
          lockTimestamp: null,
        });
      },

      verifyEmail: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          const userId = session.user.id;
          await supabase
            .from('user_profiles')
            .update({ email_verified: true })
            .eq('user_id', userId);
          set({ isEmailVerified: true });
          return true;
        }
        return false;
      },

      resendVerification: async () => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: get().user?.email || '',
        });
        return { error };
      },

      resetPassword: async (email, redirectTo) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo || 'https://mtaa.app/update-password',
        });
        return { error };
      },

      updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        return { error };
      },

      setPin: async (pin: string) => {
        const userId = get().user?.id;
        if (!userId) throw new Error('No user');
        await pinEngine.setPin(userId, pin);
        await supabase
          .from('user_profiles')
          .update({ pin_set: true })
          .eq('user_id', userId);
        set({ pinSet: true });
      },

      verifyPin: async (pin: string) => {
        const userId = get().user?.id;
        if (!userId) return false;
        return await pinEngine.verifyPin(userId, pin);
      },

      clearPin: async () => {
        const userId = get().user?.id;
        if (!userId) return;
        await pinEngine.clearPin(userId);
        await supabase
          .from('user_profiles')
          .update({ pin_set: false })
          .eq('user_id', userId);
        set({ pinSet: false });
      },

      hasPin: async () => {
        const userId = get().user?.id;
        if (!userId) return false;
        return await pinEngine.hasPin(userId);
      },

      setBiometricEnabled: async (enabled: boolean) => {
        const userId = get().user?.id;
        if (!userId) return;
        await biometricEngine.setBiometricEnabled(userId, enabled);
        await supabase
          .from('user_profiles')
          .update({ biometric_enabled: enabled })
          .eq('user_id', userId);
        set({ biometricEnabled: enabled });
      },

      isBiometricEnabled: async () => {
        const userId = get().user?.id;
        if (!userId) return false;
        return await biometricEngine.isBiometricEnabled(userId);
      },

      lockApp: () => {
        const state = get();
        if (!state.isAuthenticated || !state.pinSet) return;
        set({
          isAppLocked: true,
          lockTimestamp: Date.now(),
        });
      },

      unlockApp: () => {
        set({
          isAppLocked: false,
          lockTimestamp: null,
        });
      },

      refreshProfile: async () => {},
      getDisplayName: () => {
        const p = get().profile;
        const u = get().user;
        return (p as any)?.display_name || (p as any)?.full_name || u?.email?.split('@')[0] || 'User';
      },
      getAvatarUrl: () => {
        return (get().profile as any)?.avatar_url || null;
      },
      getUserRole: () => {
        return (get().profile as any)?.role || 'user';
      },
      updateLastActive: () => {
        const now = Date.now();
        AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        set({ lastActiveAt: now });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        isEmailVerified: state.isEmailVerified,
        pinSet: state.pinSet,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);
