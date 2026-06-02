// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Platform-safe storage: use AsyncStorage on mobile, memory on web/Node
const isWeb = typeof window !== 'undefined'
const isNode = typeof process !== 'undefined' && process.versions?.node

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb && window.localStorage) {
      return window.localStorage.getItem(key)
    }
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb && window.localStorage) {
      window.localStorage.setItem(key, value)
      return
    }
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // silent fail
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb && window.localStorage) {
      window.localStorage.removeItem(key)
      return
    }
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      // silent fail
    }
  },
}

// Build client options
const clientOptions: any = {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}

// Node.js < 22 needs explicit ws transport for realtime
if (isNode && !isWeb) {
  try {
    const ws = require('ws')
    clientOptions.realtime = { transport: ws }
  } catch {
    // ws not installed, realtime will be disabled in Node
    console.warn('[Supabase] ws package not found. Realtime disabled in Node.js.')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)
