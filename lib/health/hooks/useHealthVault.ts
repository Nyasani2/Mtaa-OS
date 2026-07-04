import { useState, useCallback } from 'react';
import {
  initializeVault,
  isVaultInitialized,
  storeRecord,
  getRecord,
  listRecords,
  deleteRecord,
  getVaultStats,
  HealthRecord,
  RecordFilter,
  VaultStats,
} from '../security/health-vault';

export function useHealthVault() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initVault = useCallback(async (masterKey: CryptoKey) => {
    setLoading(true);
    try {
      await initializeVault(masterKey);
      const s = await getVaultStats();
      setStats(s);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(async (record: HealthRecord) => {
    setLoading(true);
    try {
      await storeRecord(record);
      const s = await getVaultStats();
      setStats(s);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecord = useCallback(async (recordId: string) => {
    setLoading(true);
    try {
      return await getRecord(recordId);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (filter?: RecordFilter) => {
    setLoading(true);
    try {
      const r = await listRecords(filter);
      setRecords(r);
      return r;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRecord = useCallback(async (recordId: string) => {
    setLoading(true);
    try {
      await deleteRecord(recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
      const s = await getVaultStats();
      setStats(s);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getVaultStats();
      setStats(s);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return {
    records,
    stats,
    loading,
    error,
    isInitialized: isVaultInitialized,
    initVault,
    addRecord,
    fetchRecord,
    fetchRecords,
    removeRecord,
    refreshStats,
  };
}
