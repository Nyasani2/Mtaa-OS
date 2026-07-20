import { Platform } from 'react-native';

// Lazy-load SecureStore to prevent web crash on module import
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Web or missing module — will fall through to localStorage
}

export type HealthAuthLevel = 0 | 1 | 2 | 3;

export interface HealthAuthState {
  isAuthenticated: boolean;
  authLevel: HealthAuthLevel;
  lastAuthTime: number;
  sessionTimeoutMs: number;
  failedAttempts: number;
  lockoutUntil: number | null;
  biometricAvailable: boolean;
}

export interface HealthAuthConfig {
  requireBiometric: boolean;
  pinLength: 6 | 8;
  sessionTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

const DEFAULT_CONFIG: HealthAuthConfig = {
  requireBiometric: true,
  pinLength: 6,
  sessionTimeoutMinutes: 5,
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
};

const AUTH_STATE_KEY = 'health_auth_state';
const HEALTH_PIN_KEY = 'health_pin_hash';
const BIOMETRIC_ENABLED_KEY = 'health_biometric_enabled';

let _state: HealthAuthState | null = null;
let _config: HealthAuthConfig = DEFAULT_CONFIG;
let _sessionTimer: ReturnType<typeof setTimeout> | null = null;

// Unified storage: SecureStore on native, localStorage on web
const webStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch (e: any) { console.error("[HealthAuth] Storage read failed:", e?.message || e); return null; }
    }
    if (SecureStore?.getItemAsync) {
      try { return await SecureStore.getItemAsync(key); } catch (e: any) { console.error("[HealthAuth] Storage read failed:", e?.message || e); return null; }
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch (e: any) { console.error("[HealthAuth] Storage write failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.setItemAsync) {
      try { await SecureStore.setItemAsync(key, value); } catch (e: any) { console.error("[HealthAuth] Storage write failed:", e?.message || e); }
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch (e: any) { console.error("[HealthAuth] Storage write failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.deleteItemAsync) {
      try { await SecureStore.deleteItemAsync(key); } catch (e: any) { console.error("[HealthAuth] Storage write failed:", e?.message || e); }
    }
  },
};

function getDefaultState(): HealthAuthState {
  return {
    isAuthenticated: false,
    authLevel: 0,
    lastAuthTime: 0,
    sessionTimeoutMs: _config.sessionTimeoutMinutes * 60 * 1000,
    failedAttempts: 0,
    lockoutUntil: null,
    biometricAvailable: false,
  };
}

async function loadState(): Promise<HealthAuthState> {
  if (_state) return _state;
  try {
    const raw = await webStore.getItem(AUTH_STATE_KEY);
    if (raw) {
      _state = { ...getDefaultState(), ...JSON.parse(raw) };
    } else {
      _state = getDefaultState();
    }
  } catch {
    _state = getDefaultState();
  }
  return _state!;
}

async function saveState(): Promise<void> {
  if (!_state) return;
  await webStore.setItem(AUTH_STATE_KEY, JSON.stringify(_state));
}

export async function initializeHealthAuth(config?: Partial<HealthAuthConfig>): Promise<void> {
  _config = { ...DEFAULT_CONFIG, ...config };
  let biometric = false;
  if (Platform.OS !== 'web') {
    try {
      const LocalAuthentication = require('expo-local-authentication');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      biometric = hasHardware && enrolled;
    } catch (e: any) { console.error("[HealthAuth] Storage write failed:", e?.message || e); }
  }
  const state = await loadState();
  state.biometricAvailable = biometric;
  state.sessionTimeoutMs = _config.sessionTimeoutMinutes * 60 * 1000;
  await saveState();
}

export async function isBiometricAvailable(): Promise<boolean> {
  const state = await loadState();
  return state.biometricAvailable;
}

export async function isHealthPinSet(): Promise<boolean> {
  const pin = await webStore.getItem(HEALTH_PIN_KEY);
  return !!pin;
}

export async function setupHealthPin(pin: string): Promise<boolean> {
  if (pin.length !== _config.pinLength || !/^\d+$/.test(pin)) {
    return false;
  }
  const hash = await hashPin(pin);
  await webStore.setItem(HEALTH_PIN_KEY, hash);
  return true;
}

export async function authenticateBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const state = await loadState();
  if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
    return false;
  }
  try {
    const LocalAuthentication = require('expo-local-authentication');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock MTAA Health',
      fallbackLabel: 'Use Health PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });
    if (result.success) {
      state.isAuthenticated = true;
      state.authLevel = 2;
      state.lastAuthTime = Date.now();
      state.failedAttempts = 0;
      state.lockoutUntil = null;
      await saveState();
      startSessionTimer();
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

export async function authenticatePin(pin: string): Promise<boolean> {
  const state = await loadState();
  if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
    return false;
  }
  const storedHash = await webStore.getItem(HEALTH_PIN_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  if (inputHash === storedHash) {
    state.isAuthenticated = true;
    state.authLevel = 3;
    state.lastAuthTime = Date.now();
    state.failedAttempts = 0;
    state.lockoutUntil = null;
    await saveState();
    startSessionTimer();
    return true;
  }
  state.failedAttempts++;
  if (state.failedAttempts >= _config.maxFailedAttempts) {
    state.lockoutUntil = Date.now() + _config.lockoutDurationMinutes * 60 * 1000;
    state.failedAttempts = 0;
  }
  await saveState();
  return false;
}

export async function requireAuth(minLevel: 2 | 3 = 2): Promise<boolean> {
  const state = await loadState();
  if (state.isAuthenticated && state.authLevel >= minLevel) {
    const elapsed = Date.now() - state.lastAuthTime;
    if (elapsed < state.sessionTimeoutMs) {
      state.lastAuthTime = Date.now();
      await saveState();
      startSessionTimer();
      return true;
    }
  }
  state.isAuthenticated = false;
  state.authLevel = 0;
  await saveState();
  return false;
}

export async function getAuthState(): Promise<HealthAuthState> {
  return loadState();
}

export async function lockHealth(): Promise<void> {
  const state = await loadState();
  state.isAuthenticated = false;
  state.authLevel = 0;
  await saveState();
  stopSessionTimer();
}

export async function isLockedOut(): Promise<boolean> {
  const state = await loadState();
  return !!(state.lockoutUntil && Date.now() < state.lockoutUntil);
}

export async function getLockoutRemaining(): Promise<number> {
  const state = await loadState();
  if (!state.lockoutUntil) return 0;
  return Math.max(0, state.lockoutUntil - Date.now());
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const ok = await authenticatePin(currentPin);
  if (!ok) return false;
  return setupHealthPin(newPin);
}

export async function resetVault(): Promise<void> {
  await webStore.deleteItem(HEALTH_PIN_KEY);
  await webStore.deleteItem(AUTH_STATE_KEY);
  await webStore.deleteItem(BIOMETRIC_ENABLED_KEY);
  _state = null;
}

function startSessionTimer(): void {
  stopSessionTimer();
  _sessionTimer = setTimeout(async () => {
    await lockHealth();
  }, _config.sessionTimeoutMinutes * 60 * 1000);
}

function stopSessionTimer(): void {
  if (_sessionTimer) {
    clearTimeout(_sessionTimer);
    _sessionTimer = null;
  }
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'MTAA_HEALTH_SALT_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
