import { useState, useEffect, useCallback } from 'react';
import {
  getComplianceReviews,
  getComplianceReports,
  getComplianceChecks,
  getComplianceRules,
  getRegulatoryCompliance,
  submitComplianceReview,
  updateComplianceReview,
  runComplianceCheck,
  type ComplianceReview,
  type ComplianceReport,
  type ComplianceCheck,
  type ComplianceRule,
  type RegulatoryCompliance,
} from '../services/complianceService';

export function useComplianceReviews(filters?: Parameters<typeof getComplianceReviews>[0]) {
  const [reviews, setReviews] = useState<ComplianceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplianceReviews(filters);
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submit = useCallback(async (review: Omit<ComplianceReview, 'id' | 'created_at'>) => {
    await submitComplianceReview(review);
    await fetchReviews();
  }, [fetchReviews]);

  const update = useCallback(async (reviewId: string, updates: Partial<ComplianceReview>) => {
    await updateComplianceReview(reviewId, updates);
    await fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, refresh: fetchReviews, submit, update };
}

export function useComplianceReports(businessId?: string) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplianceReports(businessId);
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reports'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refresh: fetchReports };
}

export function useComplianceChecks(businessId?: string) {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChecks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplianceChecks(businessId);
      setChecks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load checks'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const runCheck = useCallback(async (checkType: string, checklist: Record<string, boolean>) => {
    if (!businessId) return;
    await runComplianceCheck(businessId, checkType, checklist);
    await fetchChecks();
  }, [businessId, fetchChecks]);

  return { checks, loading, error, refresh: fetchChecks, runCheck };
}

export function useComplianceRules(category?: string) {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplianceRules(category);
      setRules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load rules'));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, refresh: fetchRules };
}

export function useRegulatoryCompliance(businessId?: string) {
  const [compliance, setCompliance] = useState<RegulatoryCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRegulatoryCompliance(businessId);
      setCompliance(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load compliance'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  return { compliance, loading, error, refresh: fetchCompliance };
}
