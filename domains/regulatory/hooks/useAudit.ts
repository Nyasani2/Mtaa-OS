"use client";

import { useState, useEffect, useCallback } from "react";
import { auditService, type AuditLogEntry, type AuditQuery } from "../services/auditService";

export function useAuditLogs(query: AuditQuery = {}) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditService.queryLogs(query);
      if (result.error) throw new Error(result.error);
      setLogs(result.data);
      setCount(result.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, count, loading, error, refetch: fetchLogs };
}

export function useAuditSummary(startDate: string, endDate: string) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditService.getSummary(startDate, endDate);
      setSummary(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
