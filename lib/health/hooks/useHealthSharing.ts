import { useState, useCallback } from 'react';
import {
  generateShareQR,
  generateEmergencyQR,
  scanAndProcessQR,
  approveShareRequest,
  getActiveShares,
  revokeShare,
  cleanupExpiredShares,
} from '../services/health-sharing.service';
import { SharePermission } from '../types';

export function useHealthSharing(patientId: string) {
  const [shares, setShares] = useState<SharePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getActiveShares(patientId);
      setShares(s);
      return s;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createShareQR = useCallback(async (
    hospitalId: string,
    hospitalName: string,
    scope: string[],
    expiryMinutes: number
  ) => {
    setLoading(true);
    try {
      const qr = await generateShareQR(patientId, hospitalId, scope, expiryMinutes);
      await approveShareRequest(patientId, hospitalId, hospitalName, scope, expiryMinutes);
      await loadShares();
      return qr;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createEmergencyQR = useCallback(async (emergencyData: any) => {
    return generateEmergencyQR(emergencyData);
  }, []);

  const scanQR = useCallback(async (qrData: string) => {
    setLoading(true);
    try {
      return await scanAndProcessQR(qrData);
    } catch (e: any) {
      setError(e.message);
      return { valid: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(async (shareId: string) => {
    setLoading(true);
    try {
      const ok = await revokeShare(shareId);
      if (ok) await loadShares();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadShares]);

  const cleanup = useCallback(async () => {
    return cleanupExpiredShares();
  }, []);

  return {
    shares,
    loading,
    error,
    loadShares,
    createShareQR,
    createEmergencyQR,
    scanQR,
    revoke,
    cleanup,
  };
}
