#!/usr/bin/env python3
import os, subprocess, shutil

ROOT = os.getcwd()

print('=' * 70)
print('MTAA OS V10 - PROPER WebSocket Fix')
print('=' * 70)

# Show current file
fp = os.path.join(ROOT, 'lib/supabase.ts')
with open(fp, 'r') as f:
    current = f.read()

print("\n--- CURRENT lib/supabase.ts ---")
for i, ln in enumerate(current.split('\n'), 1):
    print(f"{i:3d}: {ln}")

# Rewrite the file properly
new_content = """import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const storageAdapter = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },
};

// MTAA OS V10: Conditionally provide ws for Node.js SSR, native WebSocket for browser/RN
const realtimeOptions = (() => {
  if (typeof window === 'undefined') {
    // Node.js / SSR context - ws package is available
    try {
      const ws = require('ws');
      return { transport: ws };
    } catch (e) {
      console.warn('[MTAA] ws package not available, realtime disabled in SSR');
      return undefined;
    }
  }
  // Browser / React Native - use native WebSocket (Supabase default)
  return undefined;
})();

const supabaseOptions: any = {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

if (realtimeOptions) {
  supabaseOptions.realtime = realtimeOptions;
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export { supabase };
export default supabase;
"""

with open(fp, 'w') as f:
    f.write(new_content)

print("\n[FIXED] lib/supabase.ts - proper conditional ws configuration")

# Also fix lib/supabase/client.ts if it exists
client_fp = os.path.join(ROOT, 'lib/supabase/client.ts')
if os.path.exists(client_fp):
    with open(client_fp, 'r') as f:
        client_content = f.read()
    if 'createClient' in client_content:
        with open(client_fp, 'w') as f:
            f.write(new_content)
        print("[FIXED] lib/supabase/client.ts")

# Clear caches
print("\n[CLEARING CACHES]")
caches = [
    os.path.join(ROOT, '.expo'),
    os.path.join(ROOT, 'node_modules/.cache'),
]
for cache in caches:
    if os.path.exists(cache):
        print(f"  Removing {cache}...")
        shutil.rmtree(cache, ignore_errors=True)

print("\n" + '=' * 70)
print('Done. Restart your app with: npx expo start --clear')
print('=' * 70)
