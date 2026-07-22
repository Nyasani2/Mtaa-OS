/**
 * MTAA PIN Engine — Production Hardened (Backward Compatible)
 * 
 * Same API as original: setPin, verifyPin, hasPin, clearPin, getPinState, syncPinWithSupabase
 * Security upgrades:
 * - Storage: AsyncStorage → Cross-platform secure storage (SecureStore native, AES-GCM web)
 * - Hash: simpleHash (djb2) → PBKDF2-SHA256, 100,000 iterations
 * - Server sync: optional hash backup to Supabase
 * - Migration: auto-migrates old AsyncStorage PINs to secure storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureGetItem, secureSetItem, secureDeleteItem, secureMultiDelete } from './secure-storage';
import { supabase } from '@/lib/supabase';

// ─── Storage Keys ───────────────────────────────────────────
const LEGACY_PIN_KEY = '@mtaa_pin';
const LEGACY_LOCKOUT_KEY = '@mtaa_pin_lockout';
const LEGACY_ATTEMPTS_KEY = '@mtaa_pin_attempts';

const PIN_HASH_KEY = 'mtaa_pin_hash_v2';
const PIN_SALT_KEY = 'mtaa_pin_salt_v2';
const PIN_ATTEMPTS_KEY = 'mtaa_pin_attempts_v2';
const PIN_LOCK_UNTIL_KEY = 'mtaa_pin_lock_until_v2';
const PIN_ENABLED_KEY = 'mtaa_pin_enabled_v2';
const MIGRATION_DONE_KEY = 'mtaa_pin_migration_done_v2';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

export interface PinState {
  isSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutUntil: number | null;
}

// ─── PBKDF2-SHA256 Hash (production grade) ──────────────────
async function pbkdf2Hash(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Legacy simpleHash (for migration comparison) ────────────
function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ─── Secure random bytes ────────────────────────────────────
function secureRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Migration: one-time AsyncStorage → Secure Storage ─────────
async function runMigration(): Promise<void> {
  const done = await secureGetItem(MIGRATION_DONE_KEY);
  if (done === 'true') return;

  try {
    const legacyHash = await AsyncStorage.getItem(LEGACY_PIN_KEY);
    const canonicalHash = await secureGetItem(PIN_HASH_KEY);

    if (legacyHash && !canonicalHash) {
      const salt = bytesToHex(secureRandomBytes(32));
      await secureSetItem(PIN_HASH_KEY, legacyHash);
      await secureSetItem(PIN_SALT_KEY, 'LEGACY_' + salt);
      await secureSetItem(PIN_ENABLED_KEY, 'true');

      const legacyAttempts = await AsyncStorage.getItem(LEGACY_ATTEMPTS_KEY);
      if (legacyAttempts) await secureSetItem(PIN_ATTEMPTS_KEY, legacyAttempts);

      const legacyLockout = await AsyncStorage.getItem(LEGACY_LOCKOUT_KEY);
      if (legacyLockout) await secureSetItem(PIN_LOCK_UNTIL_KEY, legacyLockout);

      console.log('[PinEngine] ✅ Migrated legacy PIN to secure storage');
    }

    await secureSetItem(MIGRATION_DONE_KEY, 'true');
  } catch (e) {
    console.warn('[PinEngine] Migration error:', e);
  }
}

// ─── Public API (IDENTICAL to original) ─────────────────────

export async function setPin(pin: string): Promise<void> {
  if (!pin || pin.length !== 6) {
    throw new Error('PIN must be exactly 6 digits');
  }

  const salt = bytesToHex(secureRandomBytes(32));
  const hash = await pbkdf2Hash(pin, salt);

  await secureSetItem(PIN_HASH_KEY, hash);
  await secureSetItem(PIN_SALT_KEY, salt);
  await secureSetItem(PIN_ENABLED_KEY, 'true');
  await secureDeleteItem(PIN_ATTEMPTS_KEY);
  await secureDeleteItem(PIN_LOCK_UNTIL_KEY);

  await AsyncStorage.multiRemove([LEGACY_PIN_KEY, LEGACY_LOCKOUT_KEY, LEGACY_ATTEMPTS_KEY]);

  console.log('[PinEngine] PIN set securely with PBKDF2-SHA256');
}

export async function verifyPin(pin: string): Promise<boolean> {
  await runMigration();

  const lockUntilStr = await secureGetItem(PIN_LOCK_UNTIL_KEY);
  if (lockUntilStr) {
    const lockUntil = parseInt(lockUntilStr, 10);
    if (Date.now() < lockUntil) {
      console.log('[PinEngine] PIN locked until', new Date(lockUntil).toISOString());
      return false;
    }
    await secureDeleteItem(PIN_LOCK_UNTIL_KEY);
  }

  const storedHash = await secureGetItem(PIN_HASH_KEY);
  if (!storedHash) {
    console.log('[PinEngine] No PIN stored');
    return false;
  }

  let valid = false;
  const salt = await secureGetItem(PIN_SALT_KEY);

  if (salt && salt.startsWith('LEGACY_')) {
    const inputHash = simpleHash(pin);
    valid = inputHash === storedHash;
    if (valid) {
      const newSalt = bytesToHex(secureRandomBytes(32));
      const newHash = await pbkdf2Hash(pin, newSalt);
      await secureSetItem(PIN_HASH_KEY, newHash);
      await secureSetItem(PIN_SALT_KEY, newSalt);
      console.log('[PinEngine] Legacy PIN re-hashed to PBKDF2');
    }
  } else if (salt) {
    const inputHash = await pbkdf2Hash(pin, salt);
    valid = inputHash === storedHash;
  } else {
    const inputHash = simpleHash(pin);
    valid = inputHash === storedHash;
  }

  if (valid) {
    await secureDeleteItem(PIN_ATTEMPTS_KEY);
    await secureDeleteItem(PIN_LOCK_UNTIL_KEY);
    console.log('[PinEngine] PIN verified successfully');
    return true;
  }

  const attemptsStr = await secureGetItem(PIN_ATTEMPTS_KEY);
  const attempts = (parseInt(attemptsStr || '0', 10)) + 1;
  await secureSetItem(PIN_ATTEMPTS_KEY, attempts.toString());

  console.log(`[PinEngine] Wrong PIN. Attempt ${attempts}/${MAX_ATTEMPTS}`);

  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    await secureSetItem(PIN_LOCK_UNTIL_KEY, lockUntil.toString());
    console.log('[PinEngine] PIN locked for 5 minutes');
  }

  return false;
}

export async function hasPin(): Promise<boolean> {
  await runMigration();
  const stored = await secureGetItem(PIN_HASH_KEY);
  return !!stored;
}

export async function clearPin(): Promise<void> {
  await secureDeleteItem(PIN_HASH_KEY);
  await secureDeleteItem(PIN_SALT_KEY);
  await secureDeleteItem(PIN_ATTEMPTS_KEY);
  await secureDeleteItem(PIN_LOCK_UNTIL_KEY);
  await secureDeleteItem(PIN_ENABLED_KEY);
  await secureDeleteItem(MIGRATION_DONE_KEY);
  await AsyncStorage.multiRemove([LEGACY_PIN_KEY, LEGACY_LOCKOUT_KEY, LEGACY_ATTEMPTS_KEY]);
  console.log('[PinEngine] PIN cleared');
}

export async function getPinState(): Promise<PinState> {
  await runMigration();

  const isSet = await hasPin();
  const lockUntilStr = await secureGetItem(PIN_LOCK_UNTIL_KEY);
  const attemptsStr = await secureGetItem(PIN_ATTEMPTS_KEY);

  const lockoutUntil = lockUntilStr ? parseInt(lockUntilStr, 10) : null;
  const isLocked = lockoutUntil ? Date.now() < lockoutUntil : false;
  const attempts = parseInt(attemptsStr || '0', 10);
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attempts);

  return { isSet, isLocked, attemptsRemaining, lockoutUntil };
}

export async function syncPinWithSupabase(userId: string): Promise<void> {
  try {
    const pinHash = await secureGetItem(PIN_HASH_KEY);
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
