import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const BIOMETRIC_STORAGE_KEY = 'mtaa_biometric_device_token';

export interface BiometricDevice {
  deviceId: string;
  deviceName: string;
  platform: string;
  enrolledAt: string;
  lastUsed: string;
}

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: string;
  devices: BiometricDevice[];
}

/**
 * Check if biometric hardware is available on THIS device
 */
export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  enrolled: boolean;
  types: string[];
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  const typeNames: string[] = [];
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    typeNames.push('Face ID');
  }
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    typeNames.push('Fingerprint');
  }
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    typeNames.push('Iris');
  }

  return {
    available: hasHardware && isEnrolled,
    enrolled: isEnrolled,
    types: typeNames.length > 0 ? typeNames : ['Biometric'],
  };
}

/**
 * Get device fingerprint (unique per device, not biometric data)
 */
function getDeviceId(): string {
  // Use a combination of platform + stored UUID
  // Never use actual biometric data
  const stored = localStorage?.getItem?.('mtaa_device_id');
  if (stored) return stored;

  const newId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage?.setItem?.('mtaa_device_id', newId);
  return newId;
}

/**
 * Check if user has biometric enrolled on ANY device
 */
export async function getBiometricStatus(userId: string): Promise<{
  enrolledAnywhere: boolean;
  thisDeviceEnrolled: boolean;
  devices: BiometricDevice[];
}> {
  const { data } = await supabase
    .from('user_profiles')
    .select('biometric_devices, biometric_enrolled')
    .eq('user_id', userId)
    .single();

  const devices: BiometricDevice[] = data?.biometric_devices || [];
  const deviceId = getDeviceId();
  const thisDeviceEnrolled = devices.some(d => d.deviceId === deviceId);

  return {
    enrolledAnywhere: data?.biometric_enrolled || false,
    thisDeviceEnrolled,
    devices,
  };
}

/**
 * Enroll biometric on THIS device
 */
export async function enrollBiometric(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Authenticate locally first
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable biometric login',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { success: false, error: 'Biometric authentication cancelled' };
    }

    // 2. Generate device token (NOT biometric data — just a proof-of-enrollment)
    const deviceId = getDeviceId();
    const deviceName = `${Platform.OS === 'ios' ? 'iPhone/iPad' : 'Android Device'} ${new Date().getFullYear()}`;

    // 3. Get current devices list
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('biometric_devices')
      .eq('user_id', userId)
      .single();

    const devices: BiometricDevice[] = profile?.biometric_devices || [];

    // 4. Add this device
    const newDevice: BiometricDevice = {
      deviceId,
      deviceName,
      platform: Platform.OS,
      enrolledAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    const updatedDevices = [...devices.filter(d => d.deviceId !== deviceId), newDevice];

    // 5. Update profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        biometric_enrolled: true,
        biometric_devices: updatedDevices,
      })
      .eq('user_id', userId);

    if (error) throw error;

    // 6. Store local token
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify({
        enrolled: true,
        deviceId,
        enrolledAt: newDevice.enrolledAt,
      }));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to enroll biometric' };
  }
}

/**
 * Authenticate with biometric on THIS device
 */
export async function authenticateWithBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock MTAA with biometric',
      fallbackLabel: 'Use PIN instead',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      // Update lastUsed
      const { user } = useAuthStore.getState();
      if (user?.id) {
        const deviceId = getDeviceId();
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('biometric_devices')
          .eq('user_id', user.id)
          .single();

        const devices = (profile?.biometric_devices || []).map((d: BiometricDevice) =>
          d.deviceId === deviceId ? { ...d, lastUsed: new Date().toISOString() } : d
        );

        await supabase
          .from('user_profiles')
          .update({ biometric_devices: devices })
          .eq('user_id', user.id);
      }

      return { success: true };
    }

    return { success: false, error: 'Biometric authentication failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Biometric error' };
  }
}

/**
 * Revoke biometric from ALL devices
 */
export async function revokeAllBiometric(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        biometric_enrolled: false,
        biometric_devices: [],
      })
      .eq('user_id', userId);

    if (error) throw error;

    // Clear local token
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke biometric' };
  }
}

/**
 * Remove THIS device from biometric devices
 */
export async function removeThisDevice(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const deviceId = getDeviceId();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('biometric_devices')
      .eq('user_id', userId)
      .single();

    const devices = (profile?.biometric_devices || []).filter(
      (d: BiometricDevice) => d.deviceId !== deviceId
    );

    const { error } = await supabase
      .from('user_profiles')
      .update({
        biometric_enrolled: devices.length > 0,
        biometric_devices: devices,
      })
      .eq('user_id', userId);

    if (error) throw error;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove device' };
  }
}
