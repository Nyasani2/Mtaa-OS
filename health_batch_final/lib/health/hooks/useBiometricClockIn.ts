import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '@/lib/supabase';

interface BiometricResult {
  success: boolean;
  method: 'biometric' | 'pin' | 'cancelled' | 'unavailable';
  error?: string;
}

export function useBiometricClockIn() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  const checkBiometricSupport = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Fingerprint');
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      setBiometricType('Iris Scan');
    }

    return { hasHardware, isEnrolled, supported: hasHardware && isEnrolled };
  }, []);

  const authenticate = useCallback(async (): Promise<BiometricResult> => {
    setIsAuthenticating(true);
    try {
      const { hasHardware, isEnrolled } = await checkBiometricSupport();

      if (!hasHardware || !isEnrolled) {
        return { success: false, method: 'unavailable', error: 'Biometric authentication not available on this device' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate to Clock In/Out`,
        fallbackLabel: 'Use Device PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true, method: 'biometric' };
      }

      if (result.error === 'user_cancel') {
        return { success: false, method: 'cancelled', error: 'Authentication cancelled' };
      }

      return { success: false, method: 'cancelled', error: result.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, method: 'unavailable', error: err.message || 'Biometric error' };
    } finally {
      setIsAuthenticating(false);
    }
  }, [checkBiometricSupport]);

  const clockInWithBiometric = useCallback(async (staffId: string, facilityId: string | null): Promise<boolean> => {
    const auth = await authenticate();
    if (!auth.success) return false;

    const { error } = await supabase.rpc('health_staff_clock_in', {
      p_staff_id: staffId,
      p_facility_id: facilityId,
      p_auth_method: auth.method,
    });

    return !error;
  }, [authenticate]);

  const clockOutWithBiometric = useCallback(async (staffId: string): Promise<boolean> => {
    const auth = await authenticate();
    if (!auth.success) return false;

    const { error } = await supabase.rpc('health_staff_clock_out', {
      p_staff_id: staffId,
      p_auth_method: auth.method,
    });

    return !error;
  }, [authenticate]);

  return {
    isAuthenticating,
    biometricType,
    checkBiometricSupport,
    authenticate,
    clockInWithBiometric,
    clockOutWithBiometric,
  };
}
