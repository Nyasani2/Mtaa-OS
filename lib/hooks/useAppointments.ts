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

export interface UseAppointmentsState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
}

export function useAppointments() {
  const [state, setState] = useState<UseAppointmentsState>({
    appointments: [],
    currentAppointment: null,
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
    setState(prev => ({ ...prev, ...updates, isLoading: false }));
  }, []);

  // ─── Load appointments for garage ───
  const loadGarageAppointments = useCallback(async (garageId: string, status?: string) => {
    setLoading();
    try {
      let query = supabase
        .from('garage_appointments')
        .select(`
          *,
          vehicle:vehicle_id(id, make, model, year, plate_number, color),
          mechanic:mechanic_id(id, full_name, avatar_url),
          customer:customer_id(id, full_name, phone, avatar_url)
        `)
        .eq('garage_id', garageId)
        .order('scheduled_date', { ascending: true });

      if (status) query = query.eq('status', status);

      const { data, error } = await withTimeout(query, QUERY_TIMEOUT, 'loadGarageAppointments');
      if (error) throw error;
      setData({ appointments: (data || []) as Appointment[] });
    } catch (err: any) {
      setError(err);
    }
  }, []);

  // ─── Load appointments for customer ───
  const loadCustomerAppointments = useCallback(async (customerId: string) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .select(`
            *,
            garage:garage_id(id, business_name, logo_url, rating, city),
            vehicle:vehicle_id(id, make, model, year, plate_number),
            mechanic:mechanic_id(id, full_name, avatar_url)
          `)
          .eq('customer_id', customerId)
          .order('scheduled_date', { ascending: false }),
        QUERY_TIMEOUT,
        'loadCustomerAppointments'
      );
      if (error) throw error;
      setData({ appointments: (data || []) as Appointment[] });
    } catch (err: any) {
      setError(err);
    }
  }, []);

  // ─── Load single appointment ───
  const loadAppointment = useCallback(async (id: string) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .select(`
            *,
            vehicle:vehicle_id(*),
            mechanic:mechanic_id(*),
            customer:customer_id(*),
            garage:garage_id(*)
          `)
          .eq('id', id)
          .single(),
        QUERY_TIMEOUT,
        'loadAppointment'
      );
      if (error) throw error;
      setData({ currentAppointment: data as Appointment });
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Create appointment (customer booking) ───
  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status' | 'created_at' | 'updated_at' | 'payment_status' | 'warranty_days' | 'reminder_sent' | 'status_update_sent' | 'diagnosis_photos' | 'recommended_services' | 'customer_approved_services' | 'customer_declined_services' | 'parts_used' | 'before_photos' | 'after_photos'>) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .insert({
            ...appointmentData,
            status: 'pending',
            payment_status: 'pending',
            warranty_days: 0,
            reminder_sent: false,
            status_update_sent: false,
            diagnosis_photos: [],
            recommended_services: [],
            customer_approved_services: [],
            customer_declined_services: [],
            parts_used: [],
            before_photos: [],
            after_photos: [],
          })
          .select()
          .single(),
        QUERY_TIMEOUT,
        'createAppointment'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: [data as Appointment, ...prev.appointments],
        currentAppointment: data as Appointment,
        isLoading: false,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Update appointment status ───
  const updateStatus = useCallback(async (id: string, status: string, updates?: Partial<Appointment>) => {
    setLoading();
    try {
      const statusTimestamps: Record<string, string> = {
        vehicle_received: 'vehicle_received_at',
        diagnosis_completed: 'diagnosis_completed_at',
        awaiting_approval: 'diagnosis_completed_at',
        in_progress: 'work_started_at',
        completed: 'work_completed_at',
        ready_for_pickup: 'work_completed_at',
      };

      const updateData: any = { status, ...updates };
      const timestampField = statusTimestamps[status];
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString();
      }

      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update(updateData)
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'updateStatus'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        isLoading: false,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Add diagnosis ───
  const addDiagnosis = useCallback(async (id: string, diagnosis: { notes: string; photos?: string[]; recommended_services?: string[] }) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update({
            diagnosis_notes: diagnosis.notes,
            diagnosis_photos: diagnosis.photos || [],
            recommended_services: diagnosis.recommended_services || [],
            diagnosis_completed_at: new Date().toISOString(),
            status: 'awaiting_approval',
          })
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'addDiagnosis'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        isLoading: false,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Customer approves services ───
  const approveServices = useCallback(async (id: string, approvedServiceIds: string[]) => {
    setLoading();
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update({
            customer_approved_services: approvedServiceIds,
            customer_approved_at: new Date().toISOString(),
            status: 'in_progress',
          })
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'approveServices'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        isLoading: false,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Add parts used ───
  const addParts = useCallback(async (id: string, parts: any[]) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update({ parts_used: parts })
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'addParts'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  // ─── Complete job ───
  const completeJob = useCallback(async (id: string, completionData: { final_cost: number; after_photos?: string[]; mileage_out?: number; fuel_level_out?: string; warranty_days?: number }) => {
    setLoading();
    try {
      const warrantyExpires = completionData.warranty_days
        ? new Date(Date.now() + completionData.warranty_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update({
            ...completionData,
            status: 'completed',
            work_completed_at: new Date().toISOString(),
            warranty_expires_at: warrantyExpires,
          })
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'completeJob'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        isLoading: false,
        error: null,
      }));
      return data as Appointment;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Add customer review ───
  const addReview = useCallback(async (id: string, review: { rating: number; review?: string }) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('garage_appointments')
          .update({
            customer_rating: review.rating,
            customer_review: review.review,
          })
          .eq('id', id)
          .select()
          .single(),
        QUERY_TIMEOUT,
        'addReview'
      );
      if (error) throw error;
      setState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === id ? (data as Appointment) : a),
        currentAppointment: prev.currentAppointment?.id === id ? (data as Appointment) : prev.currentAppointment,
        error: null,
      }));
      return data as Appointment;
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
  };
}
