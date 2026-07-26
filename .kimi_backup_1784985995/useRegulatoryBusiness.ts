/**
 * MTAA OS V10 — useRegulatoryBusiness Hook
 * My businesses + registration + compliance management
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchMyBusinesses,
  registerBusiness,
  updateBusinessStatus,
  fetchBusinessCompliance,
  updateComplianceStatus,
  recordTaxPayment,
  RegulatoryBusiness,
  RegulatoryCompliance,
  RegulatoryTaxRecord,
} from '@/lib/services/regulatory-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useRegulatoryBusiness() {
  const [businesses, setBusinesses] = useState<RegulatoryBusiness[]>([]);
  const [compliance, setCompliance] = useState<RegulatoryCompliance[]>([]);
  const [taxRecords, setTaxRecords] = useState<RegulatoryTaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyBusinesses(userId);
      setBusinesses(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const register = useCallback(async (payload: Partial<RegulatoryBusiness>) => {
    if (!userId) throw new Error('Not authenticated');
    const biz = await registerBusiness({ ...payload, owner_id: userId, status: 'pending' });
    setBusinesses((prev) => [biz, ...prev]);
    return biz;
  }, [userId]);

  const loadCompliance = useCallback(async (businessId: string) => {
    try {
      const data = await fetchBusinessCompliance(businessId);
      setCompliance(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const updateCompliance = useCallback(async (complianceId: string, status: RegulatoryCompliance['status'], notes?: string) => {
    const updated = await updateComplianceStatus(complianceId, status, notes);
    setCompliance((prev) => prev.map((c) => (c.id === complianceId ? updated : c)));
    return updated;
  }, []);

  const payTax = useCallback(async (businessId: string, taxYear: string, amount: number) => {
    const record = await recordTaxPayment(businessId, taxYear, amount);
    setTaxRecords((prev) => {
      const exists = prev.find((r) => r.id === record.id);
      if (exists) return prev.map((r) => (r.id === record.id ? record : r));
      return [record, ...prev];
    });
    return record;
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    businesses, compliance, taxRecords, isLoading, error,
    refresh: load, register, loadCompliance, updateCompliance, payTax,
  };
}
