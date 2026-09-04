"use client";

import { useState, useEffect, useCallback } from 'react';
import { fraudService, type FraudFlag, type FraudMetrics, type FraudQuery } from "../services/fraudService";

export function useFraudFlags(query: FraudQuery = {}) {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fraudService.queryFlags(query);
      if (result.error) throw new Error(result.error);
      setFlags(result.data);
      setCount(result.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return { flags, count, loading, error, refetch: fetchFlags };
}

export function useFraudMetrics(days: number = 30) {
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fraudService.getMetrics(days);
      setMetrics(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

export function useUpdateFraudFlag() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFlag = async (flagId: string, updates: {
    status?: string;
    assigned_to?: string;
    resolution_notes?: string;
    reviewed_by?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fraudService.updateFlag(flagId, updates);
      if (result.error) throw new Error(result.error);
      return result.success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateFlag, loading, error };
}
