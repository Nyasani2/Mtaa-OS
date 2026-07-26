import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const QUERY_TIMEOUT = 10000;

export interface FleetContract {
  id: string;
  garage_id: string;
  fleet_owner_id: string;
  company_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  contract_start: string;
  contract_end: string;
  contract_value: number;
  payment_terms: string;
  services_included: string[];
  vehicle_count: number;
  status: 'active' | 'suspended' | 'expired' | 'terminated';
  termination_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FleetVehicle {
  id: string;
  contract_id: string;
  make: string;
  model: string;
  year: number;
  registration_plate: string;
  vin: string;
  mileage: number;
  last_service_date: string;
  next_service_due: string;
  status: string;
}

export interface UseFleetState {
  contracts: FleetContract[];
  activeContracts: number;
  totalVehicles: number;
  monthlyRevenue: number;
  isLoading: boolean;
  error: string | null;
}

export function useFleet(garageId?: string) {
  const [state, setState] = useState<UseFleetState>({
    contracts: [],
    activeContracts: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading, error: null }));
  }, []);

  const setError = useCallback((err: any) => {
    const message = err?.message || String(err);
    const isMissingTable = message.includes('does not exist') || message.includes('relation');
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: isMissingTable ? null : message,
    }));
  }, []);

  // Load fleet contracts
  const loadContracts = useCallback(async () => {
    if (!garageId) {
      setState(prev => ({ ...prev, contracts: [], isLoading: false }));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('garage_fleet_contracts')
        .select('*')
        .eq('garage_id', garageId)
        .order('contract_start', { ascending: false });

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setState(prev => ({
            ...prev,
            contracts: [],
            activeContracts: 0,
            totalVehicles: 0,
            monthlyRevenue: 0,
            isLoading: false,
            error: null,
          }));
          return;
        }
        throw error;
      }

      const contracts = (data || []) as FleetContract[];
      const activeContracts = contracts.filter(c => c.status === 'active').length;
      const totalVehicles = contracts.reduce((sum, c) => sum + (c.vehicle_count || 0), 0);
      const monthlyRevenue = contracts
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.contract_value || 0), 0);

      setState(prev => ({
        ...prev,
        contracts,
        activeContracts,
        totalVehicles,
        monthlyRevenue,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError(err);
    }
  }, [garageId, setLoading, setError]);

  // Add contract
  const addContract = useCallback(async (contract: Omit<FleetContract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('garage_fleet_contracts')
        .insert(contract)
        .select()
        .single();

      if (error) throw error;
      await loadContracts();
      return data as FleetContract;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadContracts, setError]);

  // Update contract
  const updateContract = useCallback(async (id: string, updates: Partial<FleetContract>) => {
    try {
      const { data, error } = await supabase
        .from('garage_fleet_contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadContracts();
      return data as FleetContract;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loadContracts, setError]);

  // Load on mount
  useEffect(() => {
    loadContracts();
  }, [garageId, loadContracts]);

  return {
    ...state,
    loadContracts,
    addContract,
    updateContract,
  };
}

export default useFleet;
