import { useState, useEffect, useCallback } from 'react';
import {
  searchBusinesses,
  getBusinessById,
  getBusinessProfile,
  getBusinessOwners,
  getBusinessBranches,
  getBusinessDocuments,
  getBusinessTransactions,
  getBusinessStaff,
  registerBusiness,
  updateBusinessStatus,
  type Business,
  type BusinessProfile,
  type BusinessOwner,
  type BusinessBranch,
  type BusinessDocument,
} from '../services/businessService';

export function useBusinessSearch(query: string, filters?: Parameters<typeof searchBusinesses>[1]) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) {
      setBusinesses([]);
      return;
    }
    try {
      setLoading(true);
      const data = await searchBusinesses(query, filters);
      setBusinesses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return { businesses, loading, error, search };
}

export function useBusinessDetail(businessId: string | null) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [branches, setBranches] = useState<BusinessBranch[]>([]);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const [biz, prof, own, branch, doc, trans, stf] = await Promise.all([
        getBusinessById(businessId),
        getBusinessProfile(businessId),
        getBusinessOwners(businessId),
        getBusinessBranches(businessId),
        getBusinessDocuments(businessId),
        getBusinessTransactions(businessId),
        getBusinessStaff(businessId),
      ]);
      setBusiness(biz);
      setProfile(prof);
      setOwners(own);
      setBranches(branch);
      setDocuments(doc);
      setTransactions(trans);
      setStaff(stf);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load business'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatus = useCallback(async (status: Business['status']) => {
    if (!businessId) return;
    await updateBusinessStatus(businessId, status);
    await fetchDetail();
  }, [businessId, fetchDetail]);

  return {
    business, profile, owners, branches, documents, transactions, staff,
    loading, error, refresh: fetchDetail, updateStatus,
  };
}

export function useBusinessRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const register = useCallback(async (businessData: Parameters<typeof registerBusiness>[0]) => {
    try {
      setLoading(true);
      const data = await registerBusiness(businessData);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}
