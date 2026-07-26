/**
 * MTAA OS V10 — useRegulatory Hook
 * Business search + compliance dashboard
 */
import { useCallback, useEffect, useState } from 'react';
import {
  searchRegulatoryBusinesses,
  fetchRegulatoryBusinessById,
  fetchBusinessCompliance,
  fetchBusinessTaxRecords,
  RegulatoryBusiness,
  RegulatoryCompliance,
  RegulatoryTaxRecord,
} from '@/lib/services/regulatory-service';

export function useRegulatory() {
  const [businesses, setBusinesses] = useState<RegulatoryBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<RegulatoryBusiness | null>(null);
  const [compliance, setCompliance] = useState<RegulatoryCompliance[]>([]);
  const [taxRecords, setTaxRecords] = useState<RegulatoryTaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, countryCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchRegulatoryBusinesses(query, countryCode);
      setBusinesses(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectBusiness = useCallback(async (businessId: string) => {
    setIsLoading(true);
    try {
      const [biz, comp, tax] = await Promise.all([
        fetchRegulatoryBusinessById(businessId),
        fetchBusinessCompliance(businessId),
        fetchBusinessTaxRecords(businessId),
      ]);
      setSelectedBusiness(biz);
      setCompliance(comp);
      setTaxRecords(tax);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    businesses, selectedBusiness, compliance, taxRecords,
    isLoading, error, search, selectBusiness,
  };
}
