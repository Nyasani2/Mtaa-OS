// lib/supabase/client.ts
// Re-exports canonical supabase client from lib/supabase.ts
// All imports should eventually migrate to @/lib/supabase directly

export { supabase } from '../supabase';
export type { SupabaseClient } from '../supabase';
