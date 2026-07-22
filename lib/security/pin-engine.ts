import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// ─── Storage Keys ───────────────────────────────────────────
const LEGACY_PIN_KEY = '@mtaa_pin';           // Your original Jul 10 key
const LEGACY_LOCKOUT_KEY = '@mtaa_pin_lockout';
const LEGACY_ATTEMPTS_KEY = '@mtaa_pin_attempts';

const PIN_HASH_KEY = 'mtaa_pin_hash';         // New canonical key
const PIN_ATTEMPTS_KEY = 'mtaa_pin_attempts';
const PIN_LOCK_UNTIL_KEY = 'mtaa_pin_lock_until';
const PIN_ENABLED_KEY = 'mtaa_pin_enabled';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

export interface PinState {
  isSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutUntil: number | null;
}

// ─── Hash function (IDENTICAL to your original Jul 10 version) ───
function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ─── Migration: one-time copy from legacy to canonical ──────
let migrationDone = false;

async function runMigration(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    const legacyHash = await AsyncStorage.getItem(LEGACY_PIN_KEY);
    const canonicalHash = await AsyncStorage.getItem(PIN_HASH_KEY);

    if (legacyHash && !canonicalHash) {
      // Migrate legacy PIN to canonical storage
      await AsyncStorage.setItem(PIN_HASH_KEY, legacyHash);
      await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');

      // Migrate attempts
      const legacyAttempts = await AsyncStorage.getItem(LEGACY_ATTEMPTS_KEY);
      if (legacyAttempts) {
        await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, legacyAttempts);
      }

      // Migrate lockout
      const legacyLockout = await AsyncStorage.getItem(LEGACY_LOCKOUT_KEY);
      if (legacyLockout) {
        await AsyncStorage.setItem(PIN_LOCK_UNTIL_KEY, legacyLockout);
      }

      console.log('[PinEngine] ✅ Migrated legacy 6-digit PIN to canonical storage');
    }
  } catch (e) {
    console.warn('[PinEngine] Migration error:', e);
  }
}

// ─── Public API ─────────────────────────────────────────────

export async function setPin(pin: string): Promise<void> {
  if (!pin || pin.length !== 6) {
    throw new Error('PIN must be exactly 6 digits');
  }
  const hash = simpleHash(pin);

  // Write all canonical keys
  await AsyncStorage.setItem(PIN_HASH_KEY, hash);
  await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
  await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
  await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);

  // Clear legacy keys to prevent confusion
  await AsyncStorage.removeItem(LEGACY_PIN_KEY);
  await AsyncStorage.removeItem(LEGACY_LOCKOUT_KEY);
  await AsyncStorage.removeItem(LEGACY_ATTEMPTS_KEY);

  console.log('[PinEngine] PIN set successfully');
}

export async function verifyPin(pin: string): Promise<boolean> {
  await runMigration();

  // Check lockout
  const lockUntilStr = await AsyncStorage.getItem(PIN_LOCK_UNTIL_KEY);
  if (lockUntilStr) {
    const lockUntil = parseInt(lockUntilStr, 10);
    if (Date.now() < lockUntil) {
      console.log('[PinEngine] PIN locked until', new Date(lockUntil).toISOString());
      return false;
    }
    // Lockout expired, clear it
    await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
  }

  const storedHash = await AsyncStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) {
    console.log('[PinEngine] No PIN stored');
    return false;
  }

  const inputHash = simpleHash(pin);
  if (inputHash === storedHash) {
    // Success: clear attempts and lockout
    await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
    await AsyncStorage.removeItem(PIN_LOCK_UNTIL_KEY);
    console.log('[PinEngine] PIN verified successfully');
    return true;
  }

  // Wrong PIN: increment attempts
  const attemptsStr = await AsyncStorage.getItem(PIN_ATTEMPTS_KEY);
  const attempts = (parseInt(attemptsStr || '0', 10)) + 1;
  await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, attempts.toString());

  console.log(`[PinEngine] Wrong PIN. Attempt ${attempts}/${MAX_ATTEMPTS}`);

  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    await AsyncStorage.setItem(PIN_LOCK_UNTIL_KEY, lockUntil.toString());
    console.log('[PinEngine] PIN locked for 5 minutes');
  }

  return false;
}

export async function hasPin(): Promise<boolean> {
  await runMigration();
  const stored = await AsyncStorage.getItem(PIN_HASH_KEY);
  return !!stored;
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.multiRemove([
    PIN_HASH_KEY,
    PIN_ATTEMPTS_KEY,
    PIN_LOCK_UNTIL_KEY,
    PIN_ENABLED_KEY,
    LEGACY_PIN_KEY,
    LEGACY_LOCKOUT_KEY,
    LEGACY_ATTEMPTS_KEY,
  ]);
  console.log('[PinEngine] PIN cleared');
}

export async function getPinState(): Promise<PinState> {
  await runMigration();

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
    const pinHash = await AsyncStorage.getItem(PIN_HASH_KEY);
    await supabase
      .from('user_profiles')
      .update({
        pin_enabled: !!pinHash,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (e) {
    console.warn('[PinEngine] Supabase sync failed:', e);
  }
}
