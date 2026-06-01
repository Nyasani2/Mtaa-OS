// lib/supabase/client.ts
// Fixed for Node.js 20 — injects ws transport when native WebSocket unavailable
// FIXED: Renamed re-export to avoid collision with supabase-js createClient

import { createClient as _createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://exfmzfrgsxnwwwliatva.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Detect if we need a WebSocket polyfill (Node.js < 22, SSR, etc.)
let realtimeOptions: Record<string, any> = {};

try {
  // Native WebSocket check — if this throws, we need ws
  if (typeof WebSocket === "undefined" || (typeof process !== "undefined" && process.versions?.node && parseInt(process.versions.node) < 22)) {
    // Dynamic import ws only when needed (avoids bundling ws into native builds)
    const ws = require("ws");
    realtimeOptions = { transport: ws };
  }
} catch {
  // ws not installed — realtime will degrade gracefully to polling or fail cleanly
  console.warn("[Supabase] ws package not found. Realtime subscriptions may not work in Node.js < 22. Install: npm install ws");
}

const clientConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: realtimeOptions,
};

export const supabase: SupabaseClient = _createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientConfig);

// Re-export createClient for files that import it — renamed to avoid collision
export function createClient(url: string, key: string, options?: any): SupabaseClient {
  return _createClient(url, key, options);
}
