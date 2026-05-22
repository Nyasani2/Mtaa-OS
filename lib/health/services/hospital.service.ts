import { supabase } from '@/lib/supabase';
import { HealthHospital, HealthDepartment, HealthBed, HealthPractitioner, HealthAlert } from '../types';

export class HospitalService {
  static async getHospitals(filters?: { status?: HealthHospital['status']; level?: string }) {
    let query = supabase.from('health_hospitals').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.level) query = query.eq('level', filters.level);
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data as HealthHospital[];
  }

  static async getHospitalById(id: string) {
    const { data, error } = await supabase.from('health_hospitals').select('*').eq('id', id).single();
    if (error) throw error;
    return data as HealthHospital;
  }

  static async getDepartments(hospitalId: string) {
    const { data, error } = await supabase.from('health_departments').select('*').eq('hospital_id', hospitalId).order('name', { ascending: true });
    if (error) throw error;
    return data as HealthDepartment[];
  }

  static async getBeds(departmentId: string) {
    const { data, error } = await supabase.from('health_beds').select('*').eq('department_id', departmentId).order('bed_number', { ascending: true });
    if (error) throw error;
    return data as HealthBed[];
  }

  static async getPractitioners(filters?: { hospitalId?: string; status?: HealthPractitioner['status'] }) {
    let query = supabase.from('health_practitioners').select('*');
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthPractitioner[];
  }

  static async getAlerts(hospitalId?: string) {
    let query = supabase.from('health_alerts').select('*');
    if (hospitalId) query = query.eq('hospital_id', hospitalId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthAlert[];
  }
}

export const hospitalService = new HospitalService();
