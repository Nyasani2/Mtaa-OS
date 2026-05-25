import { supabase } from '@/lib/supabase/client';

export interface HealthRecord {
  id: string;
  user_id: string;
  record_type: 'vitals' | 'lab' | 'prescription' | 'visit' | 'vaccination';
  data: Record<string, any>;
  provider_id?: string;
  facility_id?: string;
  created_at: string;
}

export interface HealthAppointment {
  id: string;
  user_id: string;
  provider_id: string;
  facility_id: string;
  appointment_date: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  created_at: string;
}

class HealthService {
  async getRecords(userId: string, type?: string): Promise<HealthRecord[]> {
    let query = supabase.from('health_records').select('*').eq('user_id', userId);
    if (type) query = query.eq('record_type', type);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async addRecord(record: Omit<HealthRecord, 'id' | 'created_at'>): Promise<HealthRecord> {
    const { data, error } = await supabase.from('health_records').insert(record).select().single();
    if (error) throw error;
    return data;
  }

  async getAppointments(userId: string): Promise<HealthAppointment[]> {
    const { data, error } = await supabase.from('health_appointments').select('*').eq('user_id', userId).order('appointment_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async bookAppointment(appointment: Omit<HealthAppointment, 'id' | 'created_at' | 'status'>): Promise<HealthAppointment> {
    const { data, error } = await supabase.from('health_appointments').insert({ ...appointment, status: 'scheduled' }).select().single();
    if (error) throw error;
    return data;
  }
}

export const healthService = new HealthService();
