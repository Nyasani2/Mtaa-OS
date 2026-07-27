// domains/health/state/healthStore.ts
// Zustand store for MTAA Health module
// Provides: useHealthStore hook for ambulance, insurance, radiology, audit screens

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ─── Types ───
interface DispatchDetails {
  id: string;
  patient_id: string;
  ambulance_unit_id: string;
  pickup_location: string;
  destination_facility_id: string;
  status: string;
  dispatched_at: string;
  eta_minutes?: number;
}

interface ClaimDetail {
  id: string;
  patient_id: string;
  provider_id: string;
  policy_number: string;
  claim_amount: number;
  approved_amount?: number;
  status: string;
  diagnosis_codes: string[];
  submitted_at: string;
  documents?: any[];
}

interface Policy {
  id: string;
  user_id: string;
  provider_id: string;
  policy_number: string;
  coverage_type: string;
  premium_amount: number;
  coverage_limit: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  details: any;
  created_at: string;
}

interface HealthState {
  dispatchDetails: DispatchDetails | null;
  claimDetail: ClaimDetail | null;
  policies: Policy[];
  claims: ClaimDetail[];
  auditEntries: AuditEntry[];
  loading: boolean;
  error: string | null;

  // Actions
  getDispatchDetails: (dispatchId: string) => Promise<DispatchDetails | null>;
  completeHandover: (dispatchId: string, notes?: string) => Promise<boolean>;
  getInsuranceClaimDetail: (claimId: string) => Promise<ClaimDetail | null>;
  fetchInsurancePolicies: (userId: string) => Promise<Policy[]>;
  fetchInsuranceClaims: (userId: string) => Promise<ClaimDetail[]>;
  fetchAuditLog: (filters?: { entityType?: string; limit?: number }) => Promise<AuditEntry[]>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  dispatchDetails: null,
  claimDetail: null,
  policies: [],
  claims: [],
  auditEntries: [],
  loading: false,
  error: null,

  getDispatchDetails: async (dispatchId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_ambulance_dispatches')
        .select('*')
        .eq('id', dispatchId)
        .single();
      if (error) throw error;
      const details = data as DispatchDetails;
      set({ dispatchDetails: details, loading: false });
      return details;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  completeHandover: async (dispatchId: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('health_ambulance_dispatches')
        .update({ status: 'completed', handover_notes: notes, completed_at: new Date().toISOString() })
        .eq('id', dispatchId);
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return false;
    }
  },

  getInsuranceClaimDetail: async (claimId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_insurance_claims')
        .select('*')
        .eq('id', claimId)
        .single();
      if (error) throw error;
      const detail = data as ClaimDetail;
      set({ claimDetail: detail, loading: false });
      return detail;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  fetchInsurancePolicies: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_insurance_policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const policies = (data || []) as Policy[];
      set({ policies, loading: false });
      return policies;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return [];
    }
  },

  fetchInsuranceClaims: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_insurance_claims')
        .select('*')
        .eq('patient_id', userId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      const claims = (data || []) as ClaimDetail[];
      set({ claims, loading: false });
      return claims;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return [];
    }
  },

  fetchAuditLog: async (filters?: { entityType?: string; limit?: number }) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('health_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      const { data, error } = await query;
      if (error) throw error;
      const entries = (data || []) as AuditEntry[];
      set({ auditEntries: entries, loading: false });
      return entries;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return [];
    }
  },
}));

export default useHealthStore;
