import { createClient } from '@supabase/supabase-js';

// Build-time fallbacks (public anon key + URL — protected by RLS).
const FALLBACK_URL = 'https://exfmzfrgsxnwwwliatva.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Zm16ZnJnc3hud3d3bGlhdHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDE3ODMsImV4cCI6MjA4Mzk3Nzc4M30.Uurwh406aEd2B4nxMQdEJUppwhQURo7f8AlhuKAh3nw';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
