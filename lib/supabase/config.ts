// lib/supabase/config.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Guard against SSR (Node has no window/localStorage)
const isWeb = Platform.OS === 'web';
const storageAdapter = isWeb
  ? {
      getItem: (key: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
      setItem: (key: string, value: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.setItem(key, value) : undefined),
      removeItem: (key: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.removeItem(key) : undefined),
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
