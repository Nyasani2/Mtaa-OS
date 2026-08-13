import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const isServer = typeof window === 'undefined';

const safeStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (isServer) return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (isServer) return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (isServer) return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

if (isServer) {
  const NoopWebSocket = class {
    constructor() {
      throw new Error('Realtime WebSocket not available during SSR');
    }
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    readonly readyState = 3;
    readonly bufferedAmount = 0;
    onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
    onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
    onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
    send(): void {}
    close(): void {}
  } as unknown as typeof WebSocket;

  (globalThis as Record<string, unknown>).WebSocket = NoopWebSocket;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isServer,
  },
});

export default supabase;
