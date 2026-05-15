import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;

const anon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    'Missing Supabase environment variables. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(url, anon);
