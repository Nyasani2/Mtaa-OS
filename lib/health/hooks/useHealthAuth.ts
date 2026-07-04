import { useState, useEffect, useCallback } from 'react';
import {
  initializeHealthAuth,
  isBiometricAvailable,
  isHealthPinSet,
  setupHealthPin,
  authenticateBiometric,
  authenticatePin,
  requireAuth,
  getAuthState,
  lockHealth,
  isLockedOut,
  getLockoutRemaining,
  changePin,
  HealthAuthState,
} from '../security/health-auth';

export function useHealthAuth() {
  const [state, setState] = useState<HealthAuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      await initializeHealthAuth();
      const s = await getAuthState();
      setState(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const biometricAvailable = useCallback(async () => {
    return isBiometricAvailable();
  }, []);

  const pinSet = useCallback(async () => {
    return isHealthPinSet();
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      const ok = await setupHealthPin(pin);
      if (!ok) setError('Invalid PIN format');
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const authBiometric = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await authenticateBiometric();
      if (ok) {
        const s = await getAuthState();
        setState(s);
      }
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const authPin = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      const ok = await authenticatePin(pin);
      if (ok) {
        const s = await getAuthState();
        setState(s);
      }
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async (minLevel: 2 | 3 = 2) => {
    const ok = await requireAuth(minLevel);
    if (!ok) {
      const s = await getAuthState();
      setState(s);
    }
    return ok;
  }, []);

  const lock = useCallback(async () => {
    await lockHealth();
    const s = await getAuthState();
    setState(s);
  }, []);

  const lockedOut = useCallback(async () => {
    return isLockedOut();
  }, []);

  const lockoutRemaining = useCallback(async () => {
    return getLockoutRemaining();
  }, []);

  const changeHealthPin = useCallback(async (current: string, newPin: string) => {
    setLoading(true);
    try {
      return await changePin(current, newPin);
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    state,
    loading,
    error,
    isAuthenticated: state?.isAuthenticated || false,
    authLevel: state?.authLevel || 0,
    biometricAvailable,
    pinSet,
    setupPin,
    authBiometric,
    authPin,
    checkAuth,
    lock,
    lockedOut,
    lockoutRemaining,
    changeHealthPin,
  };
}
