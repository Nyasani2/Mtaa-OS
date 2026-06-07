// lib/auth/store/auth.store.ts
// Authentication store — user session, login, logout, PIN

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pinSet: boolean;
  biometricEnabled: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'facebook') => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  setPIN: (pin: string) => Promise<void>;
  verifyPIN: (pin: string) => boolean;
  enableBiometric: (enabled: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  pinSet: false,
  biometricEnabled: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: profile as User || {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            display_name: session.user.user_metadata?.display_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            role: 'user',
            created_at: session.user.created_at,
          },
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    set({
      user: profile as User || {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
        display_name: data.user.user_metadata?.display_name || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: 'user',
        created_at: data.user.created_at,
      },
      session: data.session,
      isAuthenticated: true,
      isLoading: false,
    });
    return { success: true };
  },

  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
    set({ isLoading: false });
    return { success: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      pinSet: false,
    });
  },

  signInWithPhone: async (phone: string) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithOtp({ phone });
    set({ isLoading: false });
    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  verifyPhoneOTP: async (phone: string, token: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    set({ isLoading: false });
    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
    set({
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
        display_name: data.user.user_metadata?.display_name || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: 'user',
        created_at: data.user.created_at,
      } as User : null,
      session: data.session,
      isAuthenticated: !!data.user,
    });
    return { success: true };
  },

  signInWithOAuth: async (provider: 'google' | 'apple' | 'facebook') => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    set({ isLoading: false });
    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    set({ isLoading: false });
    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  updateProfile: async (updates: Partial<User>) => {
    const user = get().user;
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }

    set({ user: { ...user, ...updates } });
    return { success: true };
  },

  setPIN: async (pin: string) => {
    // Store PIN hash securely (in production use SecureStore)
    set({ pinSet: true });
  },

  verifyPIN: (pin: string) => {
    // In production, compare hashed PIN
    return get().pinSet;
  },

  enableBiometric: (enabled: boolean) => {
    set({ biometricEnabled: enabled });
  },

  clearError: () => set({ error: null }),
}));
