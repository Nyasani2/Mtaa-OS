// hooks/useHealth.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface HealthRecord {
  id: string;
  user_id: string;
  record_type: 'consultation' | 'prescription' | 'lab_result' | 'vaccination' | 'allergy' | 'chronic_condition';
  title: string;
  description: string;
  provider: string;
  facility: string;
  date: string;
  status: 'active' | 'resolved' | 'ongoing' | 'scheduled';
  attachments?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthAppointment {
  id: string;
  user_id: string;
  provider_id: string;
  provider_name: string;
  type: 'consultation' | 'follow_up' | 'emergency' | 'vaccination' | 'lab_test';
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  location?: string;
  created_at: string;
}

export interface HealthState {
  records: HealthRecord[];
  appointments: HealthAppointment[];
  isLoading: boolean;
  error: string | null;

  loadRecords: () => Promise<void>;
  loadAppointments: () => Promise<void>;
  createRecord: (record: Partial<HealthRecord>) => Promise<boolean>;
  createAppointment: (appointment: Partial<HealthAppointment>) => Promise<boolean>;
  cancelAppointment: (appointmentId: string) => Promise<boolean>;
  getRecordsByType: (type: HealthRecord['record_type']) => HealthRecord[];
  getUpcomingAppointments: () => HealthAppointment[];
  clearError: () => void;
}

export const useHealth = create<HealthState>((set, get) => ({
  records: [],
  appointments: [],
  isLoading: false,
  error: null,

  loadRecords: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ records: (data || []) as HealthRecord[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAppointments: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      set({ appointments: (data || []) as HealthAppointment[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createRecord: async (record: Partial<HealthRecord>) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert({
          ...record,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ records: [data as HealthRecord, ...state.records] }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  createAppointment: async (appointment: Partial<HealthAppointment>) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('health_appointments')
        .insert({
          ...appointment,
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ appointments: [...state.appointments, data as HealthAppointment] }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelAppointment: async (appointmentId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('health_appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        appointments: state.appointments.map(a =>
          a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  getRecordsByType: (type: HealthRecord['record_type']) => {
    return get().records.filter(r => r.record_type === type);
  },

  getUpcomingAppointments: () => {
    const now = new Date().toISOString();
    return get().appointments
      .filter(a => a.scheduled_at > now && ['pending', 'confirmed'].includes(a.status))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  clearError: () => set({ error: null }),
}));

export default useHealth;
