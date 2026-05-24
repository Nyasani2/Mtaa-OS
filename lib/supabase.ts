import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("[SUPABASE] Missing env vars");
}

/**
 * Storage layer
 */
const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          typeof window !== "undefined"
            ? window.localStorage.getItem(key)
            : null,

        setItem: async (key: string, value: string) =>
          typeof window !== "undefined"
            ? window.localStorage.setItem(key, value)
            : undefined,

        removeItem: async (key: string) =>
          typeof window !== "undefined"
            ? window.localStorage.removeItem(key)
            : undefined,
      }
    : AsyncStorage;

/**
 * Realtime transport (CRITICAL FIX)
 * - Node (Vercel SSR) => requires ws
 * - Browser => native WebSocket (do nothing)
 */
let realtime: any = {};

if (typeof window === "undefined") {
  // Node.js environment (Vercel SSR / server runtime)
  const ws = require("ws");
  realtime.transport = ws;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },

  realtime,
});

export default supabase;
