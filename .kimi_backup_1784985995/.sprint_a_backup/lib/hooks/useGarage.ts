import { useState, useCallback, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';

const QUERY_TIMEOUT = 15000;

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
    const message = err?.message || String(err);
    const isTimeout = message.includes('timed out');
    const isMissingTable = message.includes('does not exist') || message.includes('relation');

    // Don't show errors for timeouts or missing tables — UI handles those states
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: (isTimeout || isMissingTable) ? null : message,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load my garage — tries edge function first, falls back to direct query
  const loadMyGarage = useCallback(async () => {
    setLoading();
    try {
      // Try the service function first
      const garage = await withTimeout(getMyGarage(), QUERY_TIMEOUT, 'loadMyGarage');
      setState(prev => ({
        ...prev,
        myGarage: garage,
        currentGarage: garage,
        isLoading: false,
        error: null,
      }));
      return garage;
    } catch (err: any) {
      const message = err?.message || String(err);

      // If table missing or timeout, try direct Supabase query as fallback
      if (message.includes('does not exist') || message.includes('relation') || message.includes('timed out')) {
        try {
          const { data, error } = await supabase
            .from('garages')
            .select('*')
            .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
            .single();

          if (error) throw error;

          setState(prev => ({
            ...prev,
            myGarage: data as Garage,
            currentGarage: data as Garage,
            isLoading: false,
            error: null,
          }));
          return data as Garage;
        } catch (fallbackErr) {
          // No garage found — this is OK, show "Not registered" UI
          setState(prev => ({
            ...prev,
            myGarage: null,
            currentGarage: null,
            isLoading: false,
            error: null,
          }));
          return null;
        }
      }

      setError(err);
      return null;
    }
  }, [setLoading, setError]);

  // Load garage stats with fallback
  const loadGarageStats = useCallback(async (garageId: string) => {
    if (!garageId) return null;
    try {
      const stats = await withTimeout(getGarageStats(garageId), QUERY_TIMEOUT, 'loadGarageStats');
      setState(prev => ({ ...prev, stats }));
      return stats;
    } catch {
      // Silently fail for stats
      setState(prev => ({ ...prev, stats: null }));
      return null;
    }
  }, []);

  // Register garage
  const createGarage = useCallback(async (garageData: Parameters<typeof registerGarage>[0]) => {
    setLoading();
    try {
      const garage = await withTimeout(registerGarage(garageData), QUERY_TIMEOUT, 'createGarage');
      setState(prev => ({
        ...prev,
        myGarage: garage,
        currentGarage: garage,
        isLoading: false,
        error: null,
      }));
      return garage;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [setLoading, setError]);

  // Update garage
  const updateMyGarage = useCallback(async (updates: Partial<Garage>) => {
    if (!state.myGarage?.id) return null;
    setLoading();
    try {
      const updated = await withTimeout(
        updateGarage(state.myGarage.id, updates),
        QUERY_TIMEOUT,
        'updateMyGarage'
      );
      setState(prev => ({
        ...prev,
        myGarage: updated,
        currentGarage: updated,
        isLoading: false,
        error: null,
      }));
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [state.myGarage?.id, setLoading, setError]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadMyGarage();
    if (state.myGarage?.id) {
      await loadGarageStats(state.myGarage.id);
    }
  }, [loadMyGarage, loadGarageStats, state.myGarage?.id]);

  // Auto-load on mount
  useEffect(() => {
    loadMyGarage();
  }, [loadMyGarage]);

  return {
    ...state,
    loadMyGarage,
    loadGarageStats,
    createGarage,
    updateMyGarage,
    refresh,
    clearError,
  };
}

export default useGarage;
