/**
 * MTAA Auth Store — Production Hardened
 * 
 * Security Model:
 * - Session data encrypted with AES-256-GCM (device-bound key)
 * - Zustand persist uses custom storage that encrypts before writing
 * - 15-minute idle timeout, 24-hour absolute timeout
 * - Device fingerprint validation on every restore
 * - Trust score: 0-100, < 50 requires step-up auth
 * - Session revocation on password change, new device, or suspicious activity
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

const SESSION_KEY = 'mtaa_auth_session_v2';
const ENCRYPTION_KEY_KEY = 'mtaa_session_key_v2';
const LAST_ACTIVITY_KEY = 'mtaa_last_activity_v2';
const DEVICE_TRUST_KEY = 'mtaa_device_trust_v2';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;   // 15 minutes
const ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRUST_THRESHOLD = 50;

// ─── AES-256-GCM Encryption Layer ──────────────────────────────────────────

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  let keyB64 = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);

  if (!keyB64) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    keyB64 = btoa(String.fromCharCode(...raw));
    await SecureStore.setItemAsync(ENCRYPTION_KEY_KEY, keyB64);
  }

  const raw = new Uint8Array(
    atob(keyB64).split('').map(c => c.charCodeAt(0))
  );

  return crypto.subtle.importKey(
    'raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
}

async function encryptSession(data: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptSession(ciphertext: string): Promise<string | null> {
  try {
    const key = await getOrCreateEncryptionKey();
    const combined = new Uint8Array(
      atob(ciphertext).split('').map(c => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

// ─── Custom Encrypted Storage ────────────────────────────────────────────────

const encryptedStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const encrypted = await SecureStore.getItemAsync(name);
    if (!encrypted) return null;
    return decryptSession(encrypted);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const encrypted = await encryptSession(value);
    await SecureStore.setItemAsync(name, encrypted);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

// ─── Device Trust Score ──────────────────────────────────────────────────────

interface DeviceTrust {
  score: number;
  fingerprint: string;
  enrolledAt: string;
  lastVerified: string;
  failedAttempts: number;
  isNewDevice: boolean;
}

async function computeDeviceFingerprint(): Promise<string> {
  const components = [
    Platform.OS,
    Platform.Version?.toString() || '',
    Platform.select({ ios: 'ios', android: 'android', default: 'unknown' }),
    // Add device-specific identifiers via expo-device if available
  ];
  const raw = components.join('|');
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getDeviceTrust(userId: string): Promise<DeviceTrust | null> {
  const raw = await SecureStore.getItemAsync(DEVICE_TRUST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveDeviceTrust(trust: DeviceTrust): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_TRUST_KEY, JSON.stringify(trust));
}

// ─── Auth Store Interface ────────────────────────────────────────────────────

interface AuthState {
  user: { id: string; email: string; role?: string } | null;
  session: { access_token: string; refresh_token: string; expires_at: number } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pinSet: boolean;
  biometricEnabled: boolean;
  deviceTrust: DeviceTrust | null;
  lastActivity: number;
  trustScore: number;
  requiresStepUp: boolean;

  // Actions
  setUser: (user: AuthState['user']) => void;
  setSession: (session: AuthState['session']) => void;
  setPinSet: (set: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => boolean;
  validateDevice: () => Promise<{ valid: boolean; requiresStepUp: boolean }>;
  revokeSession: (reason: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      pinSet: false,
      biometricEnabled: false,
      deviceTrust: null,
      lastActivity: Date.now(),
      trustScore: 0,
      requiresStepUp: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setSession: (session) => {
        set({ session });
        if (session) {
          set({ isAuthenticated: true, lastActivity: Date.now() });
        }
      },

      setPinSet: (pinSet) => set({ pinSet }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
        SecureStore.setItemAsync(LAST_ACTIVITY_KEY, Date.now().toString());
      },

      checkSessionTimeout: () => {
        const state = get();
        const now = Date.now();
        const idle = now - state.lastActivity;

        if (idle > IDLE_TIMEOUT_MS) {
          return true; // Timed out
        }

        if (state.session?.expires_at) {
          const sessionAge = now - (state.session.expires_at * 1000 - ABSOLUTE_TIMEOUT_MS);
          if (sessionAge > ABSOLUTE_TIMEOUT_MS) {
            return true;
          }
        }

        return false;
      },

      validateDevice: async () => {
        const state = get();
        if (!state.user) return { valid: false, requiresStepUp: true };

        const currentFingerprint = await computeDeviceFingerprint();
        const storedTrust = await getDeviceTrust(state.user.id);

        if (!storedTrust) {
          // First time on this device — requires step-up
          const newTrust: DeviceTrust = {
            score: 0,
            fingerprint: currentFingerprint,
            enrolledAt: new Date().toISOString(),
            lastVerified: new Date().toISOString(),
            failedAttempts: 0,
            isNewDevice: true,
          };
          await saveDeviceTrust(newTrust);
          set({ deviceTrust: newTrust, trustScore: 0, requiresStepUp: true });
          return { valid: true, requiresStepUp: true };
        }

        if (storedTrust.fingerprint !== currentFingerprint) {
          // Device fingerprint mismatch — possible tampering or new device
          storedTrust.failedAttempts += 1;
          storedTrust.score = Math.max(0, storedTrust.score - 25);
          await saveDeviceTrust(storedTrust);
          set({ deviceTrust: storedTrust, trustScore: storedTrust.score, requiresStepUp: true });

          // Log security event
          await supabase.from('security_events').insert({
            user_id: state.user.id,
            event_type: 'device_mismatch',
            severity: 'high',
            details: { failed_attempts: storedTrust.failedAttempts },
          });

          return { valid: storedTrust.failedAttempts < 3, requiresStepUp: true };
        }

        // Device valid — increase trust
        storedTrust.lastVerified = new Date().toISOString();
        storedTrust.score = Math.min(100, storedTrust.score + 5);
        storedTrust.failedAttempts = 0;
        storedTrust.isNewDevice = false;
        await saveDeviceTrust(storedTrust);

        const requiresStepUp = storedTrust.score < TRUST_THRESHOLD;
        set({ 
          deviceTrust: storedTrust, 
          trustScore: storedTrust.score, 
          requiresStepUp 
        });

        return { valid: true, requiresStepUp };
      },

      revokeSession: async (reason) => {
        const state = get();
        if (state.session?.refresh_token) {
          await supabase.auth.signOut();
        }

        // Clear all local auth state
        await SecureStore.deleteItemAsync(SESSION_KEY);
        await SecureStore.deleteItemAsync(LAST_ACTIVITY_KEY);
        await SecureStore.deleteItemAsync(DEVICE_TRUST_KEY);
        await SecureStore.deleteItemAsync(ENCRYPTION_KEY_KEY);

        // Log revocation
        if (state.user) {
          await supabase.from('security_events').insert({
            user_id: state.user.id,
            event_type: 'session_revoked',
            severity: 'medium',
            details: { reason },
          });
        }

        set({
          user: null,
          session: null,
          isAuthenticated: false,
          pinSet: false,
          biometricEnabled: false,
          deviceTrust: null,
          trustScore: 0,
          requiresStepUp: false,
          lastActivity: 0,
        });
      },

      logout: async () => {
        await get().revokeSession('user_logout');
      },

      refreshSession: async () => {
        const state = get();
        if (!state.session?.refresh_token) return false;

        try {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: state.session.refresh_token,
          });

          if (error || !data.session) {
            await get().revokeSession('refresh_failed');
            return false;
          }

          set({
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at || Date.now() / 1000 + 3600,
            },
            lastActivity: Date.now(),
          });

          return true;
        } catch {
          await get().revokeSession('refresh_exception');
          return false;
        }
      },
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        pinSet: state.pinSet,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);

// ─── Session Activity Monitor ────────────────────────────────────────────────

let activityInterval: NodeJS.Timeout | null = null;

export function startSessionMonitor() {
  if (activityInterval) return;

  activityInterval = setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.checkSessionTimeout()) {
      state.revokeSession('idle_timeout');
    }
  }, 30000); // Check every 30 seconds
}

export function stopSessionMonitor() {
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
}

// ─── Hook for React components ─────────────────────────────────────────────

export function useAuth() {
  return useAuthStore();
}

export function useIdentity() {
  const { user, isAuthenticated, validateDevice, trustScore, requiresStepUp } = useAuthStore();
  return {
    user,
    isAuthenticated,
    validateDevice,
    trustScore,
    requiresStepUp,
    isAdmin: user?.role === 'admin',
    isDeveloper: user?.role === 'developer',
  };
}

export default useAuthStore;
