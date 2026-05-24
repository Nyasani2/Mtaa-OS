/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 2: PIN ENGINE — Device Lock (Local Security)          ║
 * ║  MTAA_OS_V10 — PIN is NOT login. PIN is OS unlock.           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. PIN is stored in AsyncStorage (local device only)
 * 2. PIN does NOT replace Supabase auth
 * 3. PIN is required ONLY to unlock OS after session exists
 * 4. No Zustand here — pure AsyncStorage + simple hash
 * 5. Biometric is alternative unlock method (falls back to PIN)
 * 6. App resume requires re-verification
 * 7. Inactivity timeout support
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

// ─── Storage Keys ──────────────────────────────────────────

const PIN_HASH_KEY = "@mtaa/pin_hash";
const PIN_ENABLED_KEY = "@mtaa/pin_enabled";
const PIN_VERIFIED_KEY = "@mtaa/pin_verified_session";
const PIN_LAST_ACTIVE_KEY = "@mtaa/pin_last_active";

// ─── Config ────────────────────────────────────────────────

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Simple Hash (not cryptographic — PIN is device-local) ───

function _hashPin(pin: string): string {
  let hash = 0;
  const salt = "mtaa_os_v10_pin_salt_2026";
  const str = pin + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `sha256_${Math.abs(hash).toString(16)}_${pin.length}`;
}

// ─── Module State ──────────────────────────────────────────

let _isVerified = false;
const _listeners = new Set<(verified: boolean) => void>();

function _notify() {
  _listeners.forEach((fn) => fn(_isVerified));
}

function _setVerified(v: boolean) {
  _isVerified = v;
  _notify();
}

// ─── Public API ────────────────────────────────────────────

export const pinEngine = {
  /**
   * Check if PIN is enabled for this device
   */
  async isEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(PIN_ENABLED_KEY);
    return enabled === "true";
  },

  /**
   * Check if PIN is currently verified for this session
   */
  isVerified(): boolean {
    return _isVerified;
  },

  /**
   * Set up a new PIN
   */
  async setPin(pin: string): Promise<void> {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error("PIN must be 4–6 digits");
    }

    const hash = _hashPin(pin);
    await AsyncStorage.setItem(PIN_HASH_KEY, hash);
    await AsyncStorage.setItem(PIN_ENABLED_KEY, "true");
    await AsyncStorage.setItem(PIN_LAST_ACTIVE_KEY, Date.now().toString());
    _setVerified(true);
  },

  /**
   * Verify PIN against stored hash
   */
  async verifyPin(pin: string): Promise<boolean> {
    const storedHash = await AsyncStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) {
      _setVerified(true);
      return true;
    }

    const inputHash = _hashPin(pin);
    const valid = storedHash === inputHash;

    if (valid) {
      await AsyncStorage.setItem(PIN_VERIFIED_KEY, "true");
      await AsyncStorage.setItem(PIN_LAST_ACTIVE_KEY, Date.now().toString());
      _setVerified(true);
    }

    return valid;
  },

  /**
   * Attempt biometric unlock
   */
  async biometricUnlock(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock MTAA OS",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        await AsyncStorage.setItem(PIN_VERIFIED_KEY, "true");
        await AsyncStorage.setItem(PIN_LAST_ACTIVE_KEY, Date.now().toString());
        _setVerified(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error("[PinEngine] Biometric error:", err);
      return false;
    }
  },

  /**
   * Lock the OS (clear verification state)
   */
  async lock(): Promise<void> {
    await AsyncStorage.removeItem(PIN_VERIFIED_KEY);
    _setVerified(false);
  },

  /**
   * Disable PIN entirely
   */
  async disable(): Promise<void> {
    await AsyncStorage.multiRemove([
      PIN_HASH_KEY,
      PIN_ENABLED_KEY,
      PIN_VERIFIED_KEY,
      PIN_LAST_ACTIVE_KEY,
    ]);
    _setVerified(false);
  },

  /**
   * Check if we have a stored PIN
   */
  async hasPin(): Promise<boolean> {
    const hash = await AsyncStorage.getItem(PIN_HASH_KEY);
    return hash !== null;
  },

  /**
   * Subscribe to verification state changes
   */
  subscribe(fn: (verified: boolean) => void): () => void {
    _listeners.add(fn);
    fn(_isVerified);
    return () => {
      _listeners.delete(fn);
    };
  },

  /**
   * Record user activity (resets inactivity timer)
   */
  async recordActivity(): Promise<void> {
    await AsyncStorage.setItem(PIN_LAST_ACTIVE_KEY, Date.now().toString());
  },

  /**
   * Check if inactivity timeout has expired
   */
  async checkInactivity(): Promise<boolean> {
    const lastActive = await AsyncStorage.getItem(PIN_LAST_ACTIVE_KEY);
    if (!lastActive) return false;

    const elapsed = Date.now() - parseInt(lastActive, 10);
    return elapsed > INACTIVITY_TIMEOUT_MS;
  },

  /**
   * Handle app state change
   * FIX: Called on ACTIVE (foreground) to require re-verify
   * Called on BACKGROUND to record timestamp
   */
  async onAppStateChange(nextAppState: string): Promise<void> {
    if (nextAppState === "active") {
      // App came to foreground — check if we need to lock
      const enabled = await this.isEnabled();
      if (!enabled) return;

      const wasVerified = _isVerified;
      const expired = await this.checkInactivity();

      if (expired || !wasVerified) {
        // Require re-verification
        await this.lock();
      }
      // If not expired and was verified, stay verified
    } else if (nextAppState === "background" || nextAppState === "inactive") {
      // App went to background — record timestamp for inactivity check
      await AsyncStorage.setItem(PIN_LAST_ACTIVE_KEY, Date.now().toString());
      // Note: we do NOT lock here — we lock when returning if expired
    }
  },

  /**
   * Legacy compatibility — redirects to onAppStateChange
   * @deprecated Use onAppStateChange instead
   */
  async onAppResume(): Promise<void> {
    return this.onAppStateChange("active");
  },
};

// ─── React Hook ────────────────────────────────────────────

import { useState, useEffect } from "react";

export function usePinVerified(): {
  isVerified: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  verify: (pin: string) => Promise<boolean>;
  biometric: () => Promise<boolean>;
  lock: () => Promise<void>;
  recordActivity: () => Promise<void>;
} {
  const [isVerified, setIsVerified] = useState(_isVerified);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const enabled = await pinEngine.isEnabled();
      if (!mounted) return;
      setIsEnabled(enabled);
      setIsLoading(false);
    };

    check();

    const unsub = pinEngine.subscribe((v) => {
      if (mounted) setIsVerified(v);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return {
    isVerified,
    isEnabled,
    isLoading,
    verify: pinEngine.verifyPin.bind(pinEngine),
    biometric: pinEngine.biometricUnlock.bind(pinEngine),
    lock: pinEngine.lock.bind(pinEngine),
    recordActivity: pinEngine.recordActivity.bind(pinEngine),
  };
}
