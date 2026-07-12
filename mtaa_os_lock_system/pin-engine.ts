import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const PIN_STORAGE_KEY = 'mtaa_pin_hash';
const PIN_ATTEMPTS_KEY = 'mtaa_pin_attempts';
const PIN_LOCK_UNTIL_KEY = 'mtaa_pin_lock_until';
const PIN_ENABLED_KEY = 'mtaa_pin_enabled';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface PinState {
  isSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutUntil: number | null;
}

function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export async function setPin(pin: string): Promise<void> {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  const hash = simpleHash(pin);
  await AsyncStorage.setItem(PIN_STORAGE_KEY, hash);
  await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
  await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
  await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
}

export async function verifyPin(pin: string): Promise<boolean> {
  const lockUntil = await AsyncStorage.getItem(PIN_LOCK_UNTIL_KEY);
  if (lockUntil) {
    const until = parseInt(lockUntil, 10);
    if (Date.now() < until) {
      return false;
    }
    await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
  }

  const storedHash = await AsyncStorage.getItem(PIN_STORAGE_KEY);
  if (!storedHash) return false;

  const inputHash = simpleHash(pin);
  if (inputHash === storedHash) {
    await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
    await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
    return true;
  }

  const attemptsStr = await AsyncStorage.getItem(PIN_ATTEMPTS_KEY);
  const attempts = (parseInt(attemptsStr || '0', 10)) + 1;
  await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, attempts.toString());

  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    await AsyncStorage.setItem(PIN_LOCK_UNTIL_KEY, lockUntil.toString());
  }

  return false;
}

export async function hasPin(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PIN_STORAGE_KEY);
  return !!stored;
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.removeItem(PIN_STORAGE_KEY);
  await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
  await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
  await AsyncStorage.removeItem(PIN_ENABLED_KEY);
}

export async function getPinState(): Promise<PinState> {
  const isSet = await hasPin();
  const lockUntilStr = await AsyncStorage.getItem(PIN_LOCK_UNTIL_KEY);
  const attemptsStr = await AsyncStorage.getItem(PIN_ATTEMPTS_KEY);

  const lockoutUntil = lockUntilStr ? parseInt(lockUntilStr, 10) : null;
  const isLocked = lockoutUntil ? Date.now() < lockoutUntil : false;
  const attempts = parseInt(attemptsStr || '0', 10);
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attempts);

  return { isSet, isLocked, attemptsRemaining, lockoutUntil };
}

export async function syncPinWithSupabase(userId: string): Promise<void> {
  try {
    const pinHash = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (!pinHash) return;
    await supabase
      .from('user_profiles')
      .update({ pin_enabled: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (e) {
    console.warn('[PinEngine] Sync failed:', e);
  }
}
