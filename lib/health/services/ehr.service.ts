// lib/health/services/ehr.service.ts
import { supabase } from '@/lib/supabase';
import { HealthEHRRecord, HealthLabTest, HealthPharmacyOrder, HealthVaccinationRecord } from '../types';

export class EHRService {
  static async getPatientEHR(patientId: string): Promise<HealthEHRRecord[]> {
    const { data, error } = await supabase.from('health_ehr_records').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false });
    if (error) throw error;
    return data as HealthEHRRecord[] || [];
  }

  static async createEHRRecord(record: Omit<HealthEHRRecord, 'id' | 'created_at' | 'updated_at'>): Promise<HealthEHRRecord> {
    const { data, error } = await supabase.from('health_ehr_records').insert(record).select().single();
    if (error) throw error;
    return data as HealthEHRRecord;
  }

  static async getLabTestsByEHR(ehrRecordId: string): Promise<HealthLabTest[]> {
    const { data, error } = await supabase.from('health_lab_tests').select('*').eq('ehr_record_id', ehrRecordId).order('ordered_date', { ascending: false });
    if (error) throw error;
    return data as HealthLabTest[] || [];
  }

  static async createLabTest(test: Omit<HealthLabTest, 'id' | 'created_at' | 'updated_at'>): Promise<HealthLabTest> {
    const { data, error } = await supabase.from('health_lab_tests').insert(test).select().single();
    if (error) throw error;
    return data as HealthLabTest;
  }

  static async updateLabResults(testId: string, results: Record<string, any>, status: HealthLabTest['result_status']): Promise<HealthLabTest> {
    const { data, error } = await supabase.from('health_lab_tests').update({ results, result_status: status, result_date: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', testId).select().single();
    if (error) throw error;
    return data as HealthLabTest;
  }

  static async getPharmacyOrders(patientId?: string): Promise<HealthPharmacyOrder[]> {
    let query = supabase.from('health_pharmacy_orders').select('*');
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthPharmacyOrder[] || [];
  }

  static async createPharmacyOrder(order: Omit<HealthPharmacyOrder, 'id' | 'created_at' | 'updated_at'>): Promise<HealthPharmacyOrder> {
    const { data, error } = await supabase.from('health_pharmacy_orders').insert(order).select().single();
    if (error) throw error;
    return data as HealthPharmacyOrder;
  }

  static async getVaccinationRecords(patientId: string): Promise<HealthVaccinationRecord[]> {
    const { data, error } = await supabase.from('health_vaccination_records').select('*').eq('patient_id', patientId).order('administered_date', { ascending: false });
    if (error) throw error;
    return data as HealthVaccinationRecord[] || [];
  }

  static async addVaccinationRecord(record: Omit<HealthVaccinationRecord, 'id' | 'created_at'>): Promise<HealthVaccinationRecord> {
    const { data, error } = await supabase.from('health_vaccination_records').insert(record).select().single();
    if (error) throw error;
    return data as HealthVaccinationRecord;
  }
}
