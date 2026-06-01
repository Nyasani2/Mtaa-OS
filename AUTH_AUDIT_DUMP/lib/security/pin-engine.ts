import * as SecureStore from 'expo-secure-store';

// ── Constants ───────────────────────────────────────────────────────────────
const PIN_STORAGE_KEY    = 'mtaa_pin_hash';
const PIN_ATTEMPTS_KEY   = 'mtaa_pin_attempts';
const PIN_LOCKOUT_KEY    = 'mtaa_pin_lockout_end';
const PIN_MAX_ATTEMPTS   = 5;
const PIN_LOCKOUT_MINUTES = 30;

// ── Types ───────────────────────────────────────────────────────────────────
export interface PinState {
  isSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEnd: Date | null;
}

// ── Environment Detection ───────────────────────────────────────────────────
const isNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isWeb    = !isNative;

// In-memory fallback for web preview (survives soft reloads, not hard)
const memoryStore: Record<string, string> = {};

// ── Safe Storage Wrappers ───────────────────────────────────────────────────
function safeGetItem(key: string): string | null {
  try {
    if (isNative && SecureStore?.getItemAsync) {
      // Native: use SecureStore (async, handled by callers)
      return null; // caller must use async version
    }
    // Web: try localStorage first
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
    // Fallback to memory
    return memoryStore[key] ?? null;
  } catch (e) {
    console.warn(`[pin-engine] getItem failed for ${key}:`, e);
    return memoryStore[key] ?? null;
  }
}

async function safeGetItemAsync(key: string): Promise<string | null> {
  try {
    if (isNative && SecureStore?.getItemAsync) {
      return await SecureStore.getItemAsync(key);
    }
    return safeGetItem(key);
  } catch (e) {
    console.warn(`[pin-engine] getItemAsync failed for ${key}:`, e);
    return safeGetItem(key);
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    memoryStore[key] = value;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    if (isNative && SecureStore?.setItemAsync) {
      SecureStore.setItemAsync(key, value).catch((e: any) => {
        console.warn(`[pin-engine] SecureStore.setItemAsync failed:`, e);
      });
    }
  } catch (e) {
    console.warn(`[pin-engine] setItem failed for ${key}:`, e);
    memoryStore[key] = value;
  }
}

function safeDeleteItem(key: string): void {
  try {
    delete memoryStore[key];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    if (isNative && SecureStore?.deleteItemAsync) {
      SecureStore.deleteItemAsync(key).catch((e: any) => {
        console.warn(`[pin-engine] SecureStore.deleteItemAsync failed:`, e);
      });
    }
  } catch (e) {
    console.warn(`[pin-engine] deleteItem failed for ${key}:`, e);
    delete memoryStore[key];
  }
}

// ── Synchronous Hash (no crypto.subtle) ─────────────────────────────────────
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  return hash.toString(16);
}

function hashPin(pin: string): string {
  // Simple but deterministic hash — NOT for production crypto,
  // but works synchronously everywhere (web preview, native, etc.)
  const salt = 'mtaa_pin_salt_v2_2025';
  return djb2Hash(pin + salt + pin.length);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get current PIN state (is set, locked, attempts remaining)
 */
export async function getPinState(): Promise<PinState> {
  const [attemptsStr, lockoutStr, pinHash] = await Promise.all([
    safeGetItemAsync(PIN_ATTEMPTS_KEY),
    safeGetItemAsync(PIN_LOCKOUT_KEY),
    safeGetItemAsync(PIN_STORAGE_KEY),
  ]);

  const attempts = parseInt(attemptsStr ?? '0', 10) || 0;
  const lockoutEnd = lockoutStr ? new Date(parseInt(lockoutStr, 10)) : null;
  const now = new Date();

  // Check if lockout has expired
  if (lockoutEnd && now >= lockoutEnd) {
    safeDeleteItem(PIN_ATTEMPTS_KEY);
    safeDeleteItem(PIN_LOCKOUT_KEY);
    return {
      isSet: !!pinHash,
      isLocked: false,
      attemptsRemaining: PIN_MAX_ATTEMPTS,
      lockoutEnd: null,
    };
  }

  const isLocked = lockoutEnd ? now < lockoutEnd : false;
  const attemptsRemaining = Math.max(0, PIN_MAX_ATTEMPTS - attempts);

  return {
    isSet: !!pinHash,
    isLocked,
    attemptsRemaining: isLocked ? 0 : attemptsRemaining,
    lockoutEnd: isLocked ? lockoutEnd : null,
  };
}

/**
 * Set a new PIN (must be 4+ digits)
 */
export async function setPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!pin || pin.length < 4) {
    return { success: false, error: 'PIN must be at least 4 digits' };
  }
  if (!/^\d+$/.test(pin)) {
    return { success: false, error: 'PIN must contain only digits' };
  }

  const hashed = hashPin(pin);
  safeSetItem(PIN_STORAGE_KEY, hashed);
  safeDeleteItem(PIN_ATTEMPTS_KEY);
  safeDeleteItem(PIN_LOCKOUT_KEY);

  return { success: true };
}

/**
 * Verify a PIN attempt
 */
export async function verifyPin(pin: string): Promise<{ valid: boolean; state: PinState }> {
  const state = await getPinState();

  if (!state.isSet) {
    return { valid: false, state };
  }

  if (state.isLocked) {
    return { valid: false, state };
  }

  const storedHash = await safeGetItemAsync(PIN_STORAGE_KEY);
  const hashed = hashPin(pin);

  if (storedHash === hashed) {
    // Correct — reset attempts
    safeDeleteItem(PIN_ATTEMPTS_KEY);
    safeDeleteItem(PIN_LOCKOUT_KEY);
    const freshState = await getPinState();
    return { valid: true, state: freshState };
  }

  // Wrong — increment attempts
  const attemptsStr = await safeGetItemAsync(PIN_ATTEMPTS_KEY);
  const attempts = (parseInt(attemptsStr ?? '0', 10) || 0) + 1;
  safeSetItem(PIN_ATTEMPTS_KEY, String(attempts));

  if (attempts >= PIN_MAX_ATTEMPTS) {
    const lockoutEnd = Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000;
    safeSetItem(PIN_LOCKOUT_KEY, String(lockoutEnd));
  }

  const newState = await getPinState();
  return { valid: false, state: newState };
}

/**
 * Change PIN (requires old PIN)
 */
export async function changePin(
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const verify = await verifyPin(oldPin);
  if (!verify.valid) {
    return { success: false, error: 'Current PIN is incorrect' };
  }
  return setPin(newPin);
}

/**
 * Remove PIN (disable device security)
 */
export async function removePin(): Promise<void> {
  safeDeleteItem(PIN_STORAGE_KEY);
  safeDeleteItem(PIN_ATTEMPTS_KEY);
  safeDeleteItem(PIN_LOCKOUT_KEY);
}

/**
 * Check if PIN is set (lightweight, no state object)
 */
export async function isPinSet(): Promise<boolean> {
  const hash = await safeGetItemAsync(PIN_STORAGE_KEY);
  return !!hash;
}

/**
 * Reset all PIN data (emergency unlock)
 */
export async function resetPinData(): Promise<void> {
  safeDeleteItem(PIN_STORAGE_KEY);
  safeDeleteItem(PIN_ATTEMPTS_KEY);
  safeDeleteItem(PIN_LOCKOUT_KEY);
}
