import { useState, useEffect, useCallback } from 'react';
import {
  getTaxRevenue,
  getTaxPayments,
  makeTaxPayment,
  getTaxRecords,
  getTaxLiabilities,
  getTaxReports,
  getTaxStatements,
  getTaxTransactions,
  type TaxRevenue,
  type TaxPayment,
  type TaxRecord,
  type TaxLiability,
} from '../services/taxService';

export function useTaxRevenue(filters?: Parameters<typeof getTaxRevenue>[0]) {
  const [revenue, setRevenue] = useState<TaxRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxRevenue(filters);
      setRevenue(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tax revenue'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { revenue, loading, error, refresh: fetchRevenue };
}

export function useTaxPayments(taxpayerId?: string) {
  const [payments, setPayments] = useState<TaxPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxPayments(taxpayerId);
      setPayments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tax payments'));
    } finally {
      setLoading(false);
    }
  }, [taxpayerId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const pay = useCallback(async (paymentId: string, paymentData: Parameters<typeof makeTaxPayment>[1]) => {
    await makeTaxPayment(paymentId, paymentData);
    await fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refresh: fetchPayments, pay };
}

export function useTaxRecords(taxpayerId?: string) {
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxRecords(taxpayerId);
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tax records'));
    } finally {
      setLoading(false);
    }
  }, [taxpayerId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refresh: fetchRecords };
}

export function useTaxLiabilities(taxpayerId?: string) {
  const [liabilities, setLiabilities] = useState<TaxLiability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLiabilities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxLiabilities(taxpayerId);
      setLiabilities(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load liabilities'));
    } finally {
      setLoading(false);
    }
  }, [taxpayerId]);

  useEffect(() => {
    fetchLiabilities();
  }, [fetchLiabilities]);

  return { liabilities, loading, error, refresh: fetchLiabilities };
}

export function useTaxReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxReports();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tax reports'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refresh: fetchReports };
}

export function useTaxStatements(taxpayerId: string) {
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxStatements(taxpayerId);
      setStatements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load statements'));
    } finally {
      setLoading(false);
    }
  }, [taxpayerId]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  return { statements, loading, error, refresh: fetchStatements };
}
