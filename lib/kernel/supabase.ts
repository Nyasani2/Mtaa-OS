// Bridge: lib/kernel/supabase.ts
// Tries to find actual supabase client, falls back to stub
let supabaseClient: any = null;

try {
  // Try common locations
  const mod = require("@supabase/supabase-js");
  const { createClient } = mod;
  // Attempt to create from env or fallback
  supabaseClient = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  );
} catch (e) {
  // Stub supabase for when real client is unavailable
  supabaseClient = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), order: () => Promise.resolve({ data: [], error: null }) }), in: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), ilike: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), order: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

export const supabase = supabaseClient;
