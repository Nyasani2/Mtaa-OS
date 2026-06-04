// lib/supabase.ts
// Supabase client singleton with WebSocket support for Node.js 20

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: ws as any,
  },
});
