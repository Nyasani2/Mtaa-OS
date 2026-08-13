import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIO_PREFIX = 'mtaa_bio_';

export const biometricEngine = {
  async hasHardwareAsync(): Promise<boolean> {
    return await (LocalAuthentication as any).hasHardwareAsync();
  },

  async isEnrolledAsync(): Promise<boolean> {
    return await (LocalAuthentication as any).isEnrolledAsync();
  },

  async supportedAuthenticationTypesAsync(): Promise<number[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  async authenticateBiometric(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await (LocalAuthentication as any).authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate',
        cancelLabel: options?.cancelLabel,
        fallbackLabel: options?.fallbackLabel,
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
      });
      return {
        success: result.success,
        error: (result as any).error || undefined,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async isBiometricEnabled(userId: string): Promise<boolean> {
    const val = await AsyncStorage.getItem(`${BIO_PREFIX}${userId}`);
    return val === 'true';
  },

  async setBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(`${BIO_PREFIX}${userId}`, enabled ? 'true' : 'false');
  },

  async clearBiometric(userId: string): Promise<void> {
    await AsyncStorage.removeItem(`${BIO_PREFIX}${userId}`);
  },

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const bioKeys = keys.filter((k) => k.startsWith(BIO_PREFIX));
    await AsyncStorage.multiRemove(bioKeys);
  },
};


// ── Compatibility exports for legacy callers ──
export async function checkBiometricStatus(): Promise<{ available: boolean; enrolled: boolean }> {
  try {
    const hasHardware = await hasHardwareAsync();
    const enrolled = await isEnrolledAsync();
    return { available: hasHardware, enrolled };
  } catch { return { available: false, enrolled: false }; }
}

export async function authenticateBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const result = await (LocalAuthentication as any).authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use PIN',
    });
    return { success: result.success, error: (result as any).error || undefined };
  } catch (e: any) { return { success: false, error: e?.message }; }
}

export async function setBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
  const { supabase } = await import('@/lib/supabase/client');
  await supabase.from('user_profiles').update({ biometric_enabled: enabled }).eq('user_id', userId);
}

export async function hasHardwareAsync(): Promise<boolean> {
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    return await (LocalAuthentication as any).hasHardwareAsync();
  } catch { return false; }
}

export async function isEnrolledAsync(): Promise<boolean> {
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    return await (LocalAuthentication as any).isEnrolledAsync();
  } catch { return false; }
}
