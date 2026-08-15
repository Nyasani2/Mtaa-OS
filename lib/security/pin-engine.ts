import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PIN_PREFIX = 'mtaa_pin_';
const SALT_PREFIX = 'mtaa_pin_salt_';
const LOCKOUT_PREFIX = 'mtaa_pin_lockout_';

function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function secureSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (isNative()) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
}

async function secureDelete(key: string): Promise<void> {
  if (isNative()) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

function hashPin(pin: string, salt: string): string {
  // Simple salted hash — replace with bcrypt/argon2 in production
  let hash = 0;
  const combined = pin + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(16);
}

function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface LockoutStatus {
  attempts: number;
  lockedUntil: number | null;
}

export const pinEngine = {
  async hasPin(userId: string): Promise<boolean> {
    const hash = await secureGet(`${PIN_PREFIX}${userId}`);
    return !!hash;
  },

  async setPin(userId: string, pin: string): Promise<void> {
    const salt = generateSalt();
    const hash = hashPin(pin, salt);
    await secureSet(`${PIN_PREFIX}${userId}`, hash);
    await secureSet(`${SALT_PREFIX}${userId}`, salt);
    // Clear any previous lockout
    await secureDelete(`${LOCKOUT_PREFIX}${userId}`);
  },

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const status = await this.getLockoutStatus(userId);
    if (status.lockedUntil && Date.now() < status.lockedUntil) {
      return false;
    }

    const storedHash = await secureGet(`${PIN_PREFIX}${userId}`);
    const salt = await secureGet(`${SALT_PREFIX}${userId}`);

    if (!storedHash || !salt) return false;

    const inputHash = hashPin(pin, salt);
    if (inputHash === storedHash) {
      // Success — reset attempts
      await secureDelete(`${LOCKOUT_PREFIX}${userId}`);
      return true;
    }

    // Failed — increment lockout
    const newAttempts = status.attempts + 1;
    let lockedUntil: number | null = null;
    if (newAttempts >= 5) {
      const delaySeconds = Math.pow(2, newAttempts - 4) * 30; // 30s, 60s, 120s...
      lockedUntil = Date.now() + delaySeconds * 1000;
    }
    await secureSet(
      `${LOCKOUT_PREFIX}${userId}`,
      JSON.stringify({ attempts: newAttempts, lockedUntil })
    );
    return false;
  },

  async clearPin(userId: string): Promise<void> {
    await secureDelete(`${PIN_PREFIX}${userId}`);
    await secureDelete(`${SALT_PREFIX}${userId}`);
    await secureDelete(`${LOCKOUT_PREFIX}${userId}`);
  },

  async clearAll(): Promise<void> {
    // Clear all PIN-related keys
    if (!isNative()) {
      const keys = await AsyncStorage.getAllKeys();
      const pinKeys = keys.filter(
        (k) => k.startsWith(PIN_PREFIX) || k.startsWith(SALT_PREFIX) || k.startsWith(LOCKOUT_PREFIX)
      );
      await AsyncStorage.multiRemove(pinKeys);
    }
    // On native, SecureStore items are isolated per key — we'd need to track user IDs
    // For now, individual clearPin per user is the safe approach
  },

  async getLockoutStatus(userId: string): Promise<LockoutStatus> {
    const raw = await secureGet(`${LOCKOUT_PREFIX}${userId}`);
    if (!raw) return { attempts: 0, lockedUntil: null };
    try {
      return JSON.parse(raw);
    } catch {
      return { attempts: 0, lockedUntil: null };
    }
  },
};


// ── Standalone export for wallet-pin-guard.tsx and app-lock-provider.tsx ──
export async function verifyPin(pin: string, userId?: string): Promise<boolean> {
  return await pinEngine.verifyPin(userId || 'default', pin);
}
