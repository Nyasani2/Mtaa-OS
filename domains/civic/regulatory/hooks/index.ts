import { useState, useEffect, useCallback } from 'react';
import { CountryCode, TaxRevenue, BusinessRegistration, TaxPayment, ComplianceReport } from '../types';
import * as services from '../services';

export function useTaxRevenue(country: CountryCode, period?: string) {
  const [data, setData] = useState<TaxRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await services.getTaxRevenue(country, period);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [country, period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}

export function useBusinessRegistrations(country: CountryCode, search?: string) {
  const [data, setData] = useState<BusinessRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await services.getBusinessRegistrations(country, search);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [country, search]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}

export function useTaxPayments(country: CountryCode, status?: string) {
  const [data, setData] = useState<TaxPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await services.getTaxPayments(country, status);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [country, status]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}

export function useComplianceReport(country: CountryCode, period: string) {
  const [data, setData] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await services.getComplianceReport(country, period);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [country, period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}

export function useRevenueSummary(country: CountryCode) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await services.getRevenueSummary(country);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refresh: fetch };
}
