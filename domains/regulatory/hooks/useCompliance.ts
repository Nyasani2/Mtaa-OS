"use client";

import { useState, useEffect, useCallback } from 'react';
import { complianceService, type ComplianceReport, type TaxRecord, type CBKReport } from "../services/complianceService";

export function useComplianceReports(options?: { type?: string; status?: string; limit?: number }) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.getReports(options);
      if (result.error) throw new Error(result.error);
      setReports(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}

export function useTaxRecords(options?: { userId?: string; taxType?: string; status?: string; limit?: number }) {
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.getTaxRecords(options);
      if (result.error) throw new Error(result.error);
      setRecords(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export function useCBKReportData(period: string) {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.getCBKReportData(period);
      if (result.error) throw new Error(result.error);
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useGenerateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (reportType: string, periodStart: string, periodEnd: string, jurisdiction?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.generateReport(reportType, periodStart, periodEnd, jurisdiction);
      if (result.error) throw new Error(result.error);
      return result.report;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading, error };
}
