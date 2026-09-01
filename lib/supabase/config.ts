// lib/supabase/config.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Build-time fallbacks (public anon key + URL; security enforced by RLS).
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://exfmzfrgsxnwwwliatva.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Zm16ZnJnc3hud3d3bGlhdHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDE3ODMsImV4cCI6MjA4Mzk3Nzc4M30.Uurwh406aEd2B4nxMQdEJUppwhQURo7f8AlhuKAh3nw";


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || '';

// Guard against SSR (Node has no window/localStorage)
const isWeb = Platform.OS === 'web';
const storageAdapter = isWeb
  ? {
      getItem: (key: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
      setItem: (key: string, value: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.setItem(key, value) : undefined),
      removeItem: (key: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.removeItem(key) : undefined),
    }
  : AsyncStorage;

export const supabase = 
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
