import { supabase } from '@/lib/supabase';
import { HealthEHRRecord, HealthPharmacyOrder, HealthVaccinationRecord } from '../types';

export class EHRService {
  static async getRecords(patientId: string) {
    const { data, error } = await supabase.from('health_ehr_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthEHRRecord[];
  }

  static async getRecordById(id: string) {
    const { data, error } = await supabase.from('health_ehr_records').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as HealthEHRRecord;
  }

  static async createRecord(record: Omit<HealthEHRRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('health_ehr_records').insert(record).select().maybeSingle();
    if (error) throw error;
    return data as HealthEHRRecord;
  }

  static async getPharmacyOrders(patientId?: string) {
    let query = supabase.from('health_pharmacy_orders').select('*');
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthPharmacyOrder[];
  }

  static async getVaccinationRecords(patientId: string) {
    const { data, error } = await supabase.from('health_vaccination_records').select('*').eq('patient_id', patientId).order('administered_at', { ascending: false });
    if (error) throw error;
    return data as HealthVaccinationRecord[];
  }
}

export const ehrService = new EHRService();
