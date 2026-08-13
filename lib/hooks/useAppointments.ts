// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const QUERY_TIMEOUT = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface Appointment {
  id: string;
  garage_id: string;
  customer_id: string;
  vehicle_id?: string;
  mechanic_id?: string;
  service_ids: string[];
  service_notes?: string;
  customer_complaint?: string;
  estimated_cost?: number;
  final_cost?: number;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  status: string;
  vehicle_received_at?: string;
  diagnosis_completed_at?: string;
  customer_approved_at?: string;
  work_started_at?: string;
  work_completed_at?: string;
  customer_picked_up_at?: string;
  diagnosis_notes?: string;
  diagnosis_photos: string[];
  recommended_services: string[];
  customer_approved_services: string[];
  customer_declined_services: string[];
  parts_used: any[];
  before_photos: string[];
  after_photos: string[];
  before_video_url?: string;
  after_video_url?: string;
  mileage_in?: number;
  mileage_out?: number;
  fuel_level_in?: string;
  fuel_level_out?: string;
  customer_signature_url?: string;
  mechanic_signature_url?: string;
  garage_signature_url?: string;
  payment_status: string;
  payment_method?: string;
  wallet_transaction_id?: string;
  invoice_id?: string;
  warranty_days: number;
  warranty_expires_at?: string;
  customer_rating?: number;
  customer_review?: string;
  reminder_sent: boolean;
  status_update_sent: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AppointmentStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
  revenue: number;
}

export interface UseAppointmentsState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  stats: AppointmentStats;
  isLoading: boolean;
  error: string | null;
}

function calculateStats(appointments: Appointment[]): AppointmentStats {
  return {
    total: appointments.length,
    active: appointments.filter((a: any) => ['pending', 'vehicle_received', 'diagnosis', 'quote_sent', 'approved', 'in_progress', 'quality_check', 'ready_for_pickup'].includes(a.status)).length,
    completed: appointments.filter((a: any) => a.status === 'completed').length,
    pending: appointments.filter((a: any) => a.status === 'pending').length,
    cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
    revenue: appointments.reduce((sum, a) => sum + (a.final_cost || a.estimated_cost || 0), 0),
  };
}

export function useAppointments() {
  const [state, setState] = useState<UseAppointmentsState>({
    appointments: [],
    currentAppointment: null,
    stats: { total: 0, active: 0, completed: 0, pending: 0, cancelled: 0, revenue: 0 },
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
  }, []);

  const setError = useCallback((err: any) => {
    setState(prev => ({ ...prev, isLoading: false, error: err?.message || String(err) }));
  }, []);

  const setData = useCallback((updates: Partial<UseAppointmentsState>) => {
    const newAppointments = updates.appointments !== undefined ? updates.appointments : state.appointments;
    setState(prev => ({
      ...prev,
      ...updates,
      stats: calculateStats(newAppointments),
      isLoading: false,
    }));
  }, [state.appointments]);

  // ── Load garage appointments ──
  const loadGarageAppointments = useCallback(async (garageId: string, statusFilter?: string) => {
    setLoading();
    try {
      let query = supabase
        .from('garage_appointments')
        .select(`*, customer:customer_id(full_name, phone, email), vehicle:vehicle_id(make, model, year, license_plate, color)`)
        .eq('garage_id', garageId)
        .order('scheduled_date', { ascending: true });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await withTimeout(query as any as any, QUERY_TIMEOUT, 'loadGarageAppointments');
      if (error) throw error;
      setData({ appointments: data || [] });
    } catch (err) {
      setError(err);
    }
  }, [setLoading, setError, setData]);

  // ── Load customer appointments ──
  const loadCustomerAppointments = useCallback(async (customerId: string) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase
          .from('garage_appointments')
          .select(`* as any, garage:garage_id(name, address, phone), vehicle:vehicle_id(make, model, year, license_plate)`)
          .eq('customer_id', customerId)
          .order('scheduled_date', { ascending: false }),
        QUERY_TIMEOUT,
        'loadCustomerAppointments'
      );
      if (error) throw error;
      setData({ appointments: data || [] });
    } catch (err) {
      setError(err);
    }
  }, [setLoading, setError, setData]);

  // ── Load single appointment ──
  const loadAppointment = useCallback(async (appointmentId: string) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase
          .from('garage_appointments')
          .select(`* as any, customer:customer_id(*), vehicle:vehicle_id(*), garage:garage_id(*)`)
          .eq('id', appointmentId)
          .maybeSingle(),
        QUERY_TIMEOUT,
        'loadAppointment'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
    } catch (err) {
      setError(err);
    }
  }, [setLoading, setError, setData]);

  // ── Create appointment ──
  const createAppointment = useCallback(async (appointmentData: Partial<Appointment>) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase.from('garage_appointments').insert(appointmentData).select().maybeSingle() as any,
        QUERY_TIMEOUT,
        'createAppointment'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Update status ──
  const updateStatus = useCallback(async (appointmentId: string, status: string, extraData?: any) => {
    setLoading();
    try {
      const updatePayload: any = { status, updated_at: new Date().toISOString() };
      if (status === 'vehicle_received') updatePayload.vehicle_received_at = new Date().toISOString();
      if (status === 'diagnosis') updatePayload.diagnosis_completed_at = new Date().toISOString();
      if (status === 'approved') updatePayload.customer_approved_at = new Date().toISOString();
      if (status === 'in_progress') updatePayload.work_started_at = new Date().toISOString();
      if (status === 'completed') updatePayload.work_completed_at = new Date().toISOString();
      if (status === 'picked_up') updatePayload.customer_picked_up_at = new Date().toISOString();
      if (extraData) Object.assign(updatePayload, extraData);

      const { data, error } = await withTimeout(supabase.from('garage_appointments').update(updatePayload).eq('id' as any, appointmentId).select().maybeSingle(),
        QUERY_TIMEOUT,
        'updateStatus'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Add diagnosis ──
  const addDiagnosis = useCallback(async (appointmentId: string, diagnosis: string, photos: string[], services: string[]) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase.from('garage_appointments')
          .update({
            diagnosis_notes: diagnosis as any,
            diagnosis_photos: photos,
            recommended_services: services,
            status: 'diagnosis',
            diagnosis_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .maybeSingle(),
        QUERY_TIMEOUT,
        'addDiagnosis'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Approve services ──
  const approveServices = useCallback(async (appointmentId: string, approved: string[], declined: string[]) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase.from('garage_appointments')
          .update({
            customer_approved_services: approved as any,
            customer_declined_services: declined,
            status: 'approved',
            customer_approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .maybeSingle(),
        QUERY_TIMEOUT,
        'approveServices'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Add parts ──
  const addParts = useCallback(async (appointmentId: string, parts: any[]) => {
    setLoading();
    try {
      const { data: current } = await withTimeout(supabase.from('garage_appointments').select('parts_used').eq('id' as any, appointmentId).maybeSingle(),
        QUERY_TIMEOUT,
        'addParts-fetch'
      );
      const existing = current?.parts_used || [];
      const { data, error } = await withTimeout(supabase.from('garage_appointments')
          .update({ parts_used: [...existing as any, ...parts], updated_at: new Date().toISOString() })
          .eq('id', appointmentId)
          .select()
          .maybeSingle(),
        QUERY_TIMEOUT,
        'addParts-update'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Complete job ──
  const completeJob = useCallback(async (appointmentId: string, finalCost: number, afterPhotos: string[], mileageOut?: number) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase.from('garage_appointments')
          .update({
            final_cost: finalCost as any,
            after_photos: afterPhotos,
            mileage_out: mileageOut,
            status: 'completed',
            work_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .maybeSingle(),
        QUERY_TIMEOUT,
        'completeJob'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Add review ──
  const addReview = useCallback(async (appointmentId: string, rating: number, review: string) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(supabase.from('garage_appointments')
          .update({
            customer_rating: rating as any,
            customer_review: review,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId)
          .select()
          .maybeSingle(),
        QUERY_TIMEOUT,
        'addReview'
      );
      if (error) throw error;
      setData({ currentAppointment: data });
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setLoading, setError, setData]);

  // ── Clear error ──
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ALIASES — what the screens expect vs what we have
  // ═══════════════════════════════════════════════════════════════

  // Screen expects: refreshAppointments → we map to loadGarageAppointments
  const refreshAppointments = useCallback(async (garageId?: string, statusFilter?: string) => {
    if (!garageId) {
      // Try to get from current appointments
      const firstAppt = state.appointments[0];
      if (firstAppt) {
        await loadGarageAppointments(firstAppt.garage_id, statusFilter);
      }
      return;
    }
    await loadGarageAppointments(garageId, statusFilter);
  }, [loadGarageAppointments, state.appointments]);

  // Screen expects: updateAppointment → we map to updateStatus
  const updateAppointment = updateStatus;

  // Screen expects: addService → we map to addDiagnosis (service recommendations)
  const addService = addDiagnosis;

  // Screen expects: addPart → we map to addParts
  const addPart = addParts;

  // Screen expects: stats → we provide from state
  const stats = state.stats;

  // Screen expects: loading → we map to isLoading
  const loading = state.isLoading;

  return {
    // Core state
    appointments: state.appointments,
    currentAppointment: state.currentAppointment,
    stats,
    isLoading: state.isLoading,
    loading,
    error: state.error,

    // Core methods
    loadGarageAppointments,
    loadCustomerAppointments,
    loadAppointment,
    createAppointment,
    updateStatus,
    addDiagnosis,
    approveServices,
    addParts,
    completeJob,
    addReview,
    clearError,

    // Aliases for screen compatibility
    refreshAppointments,
    updateAppointment,
    addService,
    addPart,
  };
}
