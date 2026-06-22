// lib/auth/store/auth.store.ts
// Authentication store — user session, login, logout, PIN, biometric
// v2.1: Wired to pin-engine, exposes profile, checkPinRequired
// v2.2: Added getUserId() helper for cross-store access

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { getPinState, verifyPin, setPin as setPinEngine, isPinSet } from '@/lib/security/pin-engine';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  profile: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pinSet: boolean;
  pinLocked: boolean;
  biometricEnabled: boolean;
  pinAttemptsRemaining: number;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  setPIN: (pin: string) => Promise<{ success: boolean; error?: string }>;
  verifyPIN: (pin: string) => Promise<{ valid: boolean; error?: string }>;
  checkPinRequired: () => Promise<boolean>;
  enableBiometric: (enabled: boolean) => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  pinSet: false,
  pinLocked: false,
  biometricEnabled: false,
  pinAttemptsRemaining: 5,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const pinState = await getPinState();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = profile || {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          role: 'user',
          created_at: session.user.created_at,
        };

        set({
          user,
          profile: user,
          session,
          isAuthenticated: true,
          pinSet: pinState.isSet,
          pinLocked: pinState.isLocked,
          pinAttemptsRemaining: pinState.attemptsRemaining,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, pinSet: pinState.isSet });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Auth init failed' });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single();

      const user: User = profile || {
        id: data.user!.id,
        email: data.user!.email || null,
        phone: data.user!.phone || null,
        display_name: data.user!.user_metadata?.display_name || email.split('@')[0],
        avatar_url: data.user!.user_metadata?.avatar_url || null,
        role: 'user',
        created_at: data.user!.created_at,
      };

      const pinState = await getPinState();
      set({
        user,
        profile: user,
        session: data.session,
        isAuthenticated: true,
        pinSet: pinState.isSet,
        isLoading: false,
      });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Login failed' });
      return { success: false, error: err?.message };
    }
  },

  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) throw error;
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err?.message });
      return { success: false, error: err?.message };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      pinSet: false,
      error: null,
    });
  },

  signInWithPhone: async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  verifyPhoneOTP: async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw error;
      set({ user: data.user as any, session: data.session, isAuthenticated: true });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) return { success: false, error: 'Not authenticated' };
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      set({ user: { ...user, ...updates }, profile: { ...user, ...updates } });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  setPIN: async (pin: string) => {
    const result = await setPinEngine(pin);
    if (result.success) {
      const pinState = await getPinState();
      set({ pinSet: true, pinLocked: false, pinAttemptsRemaining: pinState.attemptsRemaining });
    }
    return result;
  },

  verifyPIN: async (pin: string) => {
    const result = await verifyPin(pin);
    set({
      pinLocked: result.state.isLocked,
      pinAttemptsRemaining: result.state.attemptsRemaining,
    });
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, error: `Invalid PIN. ${result.state.attemptsRemaining} attempts remaining.` };
  },

  checkPinRequired: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return false;
    const pinState = await getPinState();
    set({ pinSet: pinState.isSet, pinLocked: pinState.isLocked });
    return pinState.isSet;
  },

  enableBiometric: (enabled: boolean) => {
    set({ biometricEnabled: enabled });
  },

  clearError: () => set({ error: null }),
  setUser: (user: User | null) => set({ user }),
  setSession: (session: any | null) => set({ session }),
}));
