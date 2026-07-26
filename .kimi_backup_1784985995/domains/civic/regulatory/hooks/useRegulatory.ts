import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardStats,
  getAuditLogs,
  getRegulatoryFlags,
  resolveFlag,
  getRegulatoryReports,
  getCBKReports,
  type DashboardStats,
  type AuditLog,
  type RegulatoryFlag,
  type RegulatoryReport,
  type CBKReport,
} from '../services/regulatoryService';

export function useRegulatoryDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

export function useAuditLogs(limit = 50) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(limit);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refresh: fetchLogs };
}

export function useRegulatoryFlags(status?: string) {
  const [flags, setFlags] = useState<RegulatoryFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRegulatoryFlags(status);
      setFlags(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load flags'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const resolve = useCallback(async (flagId: string, resolution: { resolved_by: string; resolution_notes?: string }) => {
    await resolveFlag(flagId, resolution);
    await fetchFlags();
  }, [fetchFlags]);

  return { flags, loading, error, refresh: fetchFlags, resolve };
}

export function useRegulatoryReports(reportType?: string) {
  const [reports, setReports] = useState<RegulatoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRegulatoryReports(reportType);
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reports'));
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refresh: fetchReports };
}

export function useCBKReports() {
  const [reports, setReports] = useState<CBKReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCBKReports();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load CBK reports'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refresh: fetchReports };
}
