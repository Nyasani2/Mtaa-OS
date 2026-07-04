import { useState, useCallback } from 'react';
import {
  initializeVault,
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

  const init = useCallback(async (masterKey: CryptoKey) => {
    setLoading(true);
    try {
      await initializeVault(masterKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const store = useCallback(async (record: HealthRecord) => {
    setLoading(true);
    try {
      await storeRecord(record);
      await refresh();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(async (id: string) => {
    try {
      return await getRecord(id);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const list = useCallback(async (filter?: RecordFilter) => {
    setLoading(true);
    try {
      const data = await listRecords(filter);
      setRecords(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await deleteRecord(id);
      await refresh();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await listRecords();
      setRecords(data);
      const s = await getVaultStats();
      setStats(s);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return { records, stats, loading, error, init, store, get, list, remove, refresh };
}
