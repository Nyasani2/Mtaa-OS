import { useState, useCallback } from 'react';
import {
  registerGarage,
  getGarages,
  getGarageById,
  getMyGarage,
  updateGarage,
  uploadVerificationDocument,
  approveGarage,
  rejectGarage,
  suspendGarage,
  getGarageStats,
  subscribeGarage,
  searchGarages,
  GARAGE_SUBSCRIPTION_PLANS,
  type Garage,
  type GarageFilters,
  type GarageStats,
} from '@/lib/services/garage.service';

const QUERY_TIMEOUT = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface UseGarageState {
  garages: Garage[];
  myGarage: Garage | null;
  currentGarage: Garage | null;
  stats: GarageStats | null;
  subscriptionPlans: typeof GARAGE_SUBSCRIPTION_PLANS;
  isLoading: boolean;
  error: string | null;
}

export function useGarage() {
  const [state, setState] = useState<UseGarageState>({
    garages: [],
    myGarage: null,
    currentGarage: null,
    stats: null,
    subscriptionPlans: GARAGE_SUBSCRIPTION_PLANS,
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
  }, []);

  const setError = useCallback((err: any) => {
    setState(prev => ({ ...prev, isLoading: false, error: err?.message || String(err) }));
  }, []);

  const setData = useCallback((updates: Partial<UseGarageState>) => {
    setState(prev => ({ ...prev, ...updates, isLoading: false }));
  }, []);

  // ─── Load all garages (for customer search) ───
  const loadGarages = useCallback(async (filters?: GarageFilters) => {
    setLoading();
    try {
      const data = await withTimeout(getGarages(filters), QUERY_TIMEOUT, 'loadGarages');
      setData({ garages: data });
    } catch (err: any) {
      setError(err);
    }
  }, []);

  // ─── Load my garage (for garage owner) ───
  const loadMyGarage = useCallback(async () => {
    setLoading();
    try {
      const data = await withTimeout(getMyGarage(), QUERY_TIMEOUT, 'loadMyGarage');
      setData({ myGarage: data });
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Load single garage by ID ───
  const loadGarage = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await withTimeout(getGarageById(id), QUERY_TIMEOUT, 'loadGarage');
      setData({ currentGarage: data });
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Create garage (onboarding step 1) ───
  const createGarage = useCallback(async (garageData: Parameters<typeof registerGarage>[0]) => {
    setLoading();
    try {
      const data = await withTimeout(registerGarage(garageData), QUERY_TIMEOUT, 'createGarage');
      setState(prev => ({
        ...prev,
        myGarage: data,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Update garage ───
  const editGarage = useCallback(async (id: string, updates: Partial<Garage>) => {
    setLoading();
    try {
      const data = await withTimeout(updateGarage(id, updates), QUERY_TIMEOUT, 'editGarage');
      setState(prev => ({
        ...prev,
        myGarage: prev.myGarage?.id === id ? data : prev.myGarage,
        currentGarage: prev.currentGarage?.id === id ? data : prev.currentGarage,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Upload verification document ───
  const uploadDoc = useCallback(async (garageId: string, file: File) => {
    setLoading();
    try {
      const data = await withTimeout(uploadVerificationDocument(garageId, file), QUERY_TIMEOUT, 'uploadDoc');
      setState(prev => ({
        ...prev,
        myGarage: prev.myGarage?.id === garageId ? data : prev.myGarage,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Load garage stats ───
  const loadStats = useCallback(async (garageId: string) => {
    try {
      const data = await withTimeout(getGarageStats(garageId), QUERY_TIMEOUT, 'loadStats');
      setState(prev => ({ ...prev, stats: data }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  // ─── Subscribe to plan ───
  const subscribe = useCallback(async (garageId: string, planId: string) => {
    setLoading();
    try {
      const data = await withTimeout(subscribeGarage(garageId, planId), QUERY_TIMEOUT, 'subscribe');
      setState(prev => ({
        ...prev,
        myGarage: prev.myGarage?.id === garageId ? data : prev.myGarage,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Search garages ───
  const search = useCallback(async (query: string, filters?: GarageFilters) => {
    setLoading();
    try {
      const data = await withTimeout(searchGarages(query, filters), QUERY_TIMEOUT, 'search');
      setData({ garages: data });
    } catch (err: any) {
      setError(err);
    }
  }, []);

  // ─── Admin actions ───
  const approve = useCallback(async (garageId: string) => {
    try {
      const data = await withTimeout(approveGarage(garageId), QUERY_TIMEOUT, 'approve');
      setState(prev => ({
        ...prev,
        currentGarage: prev.currentGarage?.id === garageId ? data : prev.currentGarage,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  const reject = useCallback(async (garageId: string, reason: string) => {
    try {
      const data = await withTimeout(rejectGarage(garageId, reason), QUERY_TIMEOUT, 'reject');
      setState(prev => ({
        ...prev,
        currentGarage: prev.currentGarage?.id === garageId ? data : prev.currentGarage,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  const suspend = useCallback(async (garageId: string, reason: string) => {
    try {
      const data = await withTimeout(suspendGarage(garageId, reason), QUERY_TIMEOUT, 'suspend');
      setState(prev => ({
        ...prev,
        currentGarage: prev.currentGarage?.id === garageId ? data : prev.currentGarage,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadGarages,
    loadMyGarage,
    loadGarage,
    createGarage,
    editGarage,
    uploadDoc,
    loadStats,
    subscribe,
    search,
    approve,
    reject,
    suspend,
    clearError,
  };
}
