// lib/health/services/patient.service.ts
import { supabase } from '@/lib/supabase';
import { HealthPatient, HealthRecord, HealthAppointment, HealthLabTest } from '../types';

export class PatientService {
  static async getPatientByUserId(userId: string): Promise<HealthPatient | null> {
    const { data, error } = await supabase
      .from('health_patients')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data as HealthPatient | null;
  }

  static async createPatient(patient: Omit<HealthPatient, 'id' | 'created_at' | 'updated_at'>): Promise<HealthPatient> {
    const { data, error } = await supabase
      .from('health_patients')
      .insert(patient)
      .select()
      .single();
    if (error) throw error;
    return data as HealthPatient;
  }

  static async updatePatient(patientId: string, updates: Partial<HealthPatient>): Promise<HealthPatient> {
    const { data, error } = await supabase
      .from('health_patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', patientId)
      .select()
      .single();
    if (error) throw error;
    return data as HealthPatient;
  }

  static async getPatientRecords(patientId: string): Promise<HealthRecord[]> {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthRecord[] || [];
  }

  static async getPatientAppointments(patientId: string): Promise<HealthAppointment[]> {
    const { data, error } = await supabase
      .from('health_appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data as HealthAppointment[] || [];
  }

  static async getPatientLabTests(patientId: string): Promise<HealthLabTest[]> {
    const { data, error } = await supabase
      .from('health_lab_tests')
      .select('*')
      .eq('patient_id', patientId)
      .order('ordered_date', { ascending: false });
    if (error) throw error;
    return data as HealthLabTest[] || [];
  }

  static async searchPatients(query: string): Promise<HealthPatient[]> {
    const { data, error } = await supabase
      .from('health_patients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,patient_code.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return data as HealthPatient[] || [];
  }
}
