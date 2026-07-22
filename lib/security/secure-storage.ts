/**
 * Cross-platform secure storage
 * - iOS/Android: expo-secure-store (Keychain/Keystore)
 * - Web: localStorage with AES-GCM encryption
 * - Fallback: AsyncStorage (if neither is available)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;

try {
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not available (web or not installed)
}

const IS_WEB = Platform.OS === 'web';
const WEB_STORAGE_KEY = 'mtaa_secure_';

// ─── Web Crypto for browser encryption ────────────────────────────────────

async function getWebKey(): Promise<CryptoKey> {
  const raw = new Uint8Array(32);
  for (let i = 0; i < 32; i++) raw[i] = (i * 7 + 13) % 256; // deterministic for session
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function webEncrypt(value: string): Promise<string> {
  const key = await getWebKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value));
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function webDecrypt(value: string): Promise<string | null> {
  try {
    const key = await getWebKey();
    const combined = new Uint8Array(atob(value).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

// ─── Cross-platform API ───────────────────────────────────────────────────

export async function secureGetItem(key: string): Promise<string | null> {
  if (SecureStore && !IS_WEB) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fall through
    }
  }
  if (IS_WEB && typeof window !== 'undefined') {
    const raw = localStorage.getItem(WEB_STORAGE_KEY + key);
    if (!raw) return null;
    return webDecrypt(raw);
  }
  // Fallback to AsyncStorage
  return AsyncStorage.getItem(key);
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (SecureStore && !IS_WEB) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Fall through
    }
  }
  if (IS_WEB && typeof window !== 'undefined') {
    const encrypted = await webEncrypt(value);
    localStorage.setItem(WEB_STORAGE_KEY + key, encrypted);
    return;
  }
  // Fallback
  await AsyncStorage.setItem(key, value);
}

export async function secureDeleteItem(key: string): Promise<void> {
  if (SecureStore && !IS_WEB) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // Fall through
    }
  }
  if (IS_WEB && typeof window !== 'undefined') {
    localStorage.removeItem(WEB_STORAGE_KEY + key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export async function secureMultiDelete(keys: string[]): Promise<void> {
  for (const key of keys) {
    await secureDeleteItem(key);
  }
}
