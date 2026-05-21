// lib/health/services/hospital.service.ts
import { supabase } from '@/lib/supabase';
import { HealthHospital, HealthDepartment, HealthBed, HealthPractitioner, HealthAlert } from '../types';

export class HospitalService {
  static async getHospitals(filters?: { county?: string; type?: string; level?: string }): Promise<HealthHospital[]> {
    let query = supabase.from('health_hospitals').select('*').eq('status', 'active');
    if (filters?.county) query = query.eq('county_name', filters.county);
    if (filters?.type) query = query.eq('hospital_type', filters.type);
    if (filters?.level) query = query.eq('level', filters.level);
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data as HealthHospital[] || [];
  }

  static async getHospitalById(hospitalId: string): Promise<HealthHospital | null> {
    const { data, error } = await supabase.from('health_hospitals').select('*').eq('id', hospitalId).single();
    if (error) throw error;
    return data as HealthHospital | null;
  }

  static async getHospitalDepartments(hospitalId: string): Promise<HealthDepartment[]> {
    const { data, error } = await supabase
      .from('health_departments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return data as HealthDepartment[] || [];
  }

  static async getDepartmentBeds(departmentId: string): Promise<HealthBed[]> {
    const { data, error } = await supabase
      .from('health_beds')
      .select('*')
      .eq('department_id', departmentId)
      .order('bed_number', { ascending: true });
    if (error) throw error;
    return data as HealthBed[] || [];
  }

  static async getAvailableBeds(hospitalId: string, bedType?: string): Promise<HealthBed[]> {
    let query = supabase.from('health_beds').select('*').eq('hospital_id', hospitalId).eq('status', 'available').eq('is_active', true);
    if (bedType) query = query.eq('bed_type', bedType);
    const { data, error } = await query;
    if (error) throw error;
    return data as HealthBed[] || [];
  }

  static async getHospitalPractitioners(hospitalId: string): Promise<HealthPractitioner[]> {
    const { data, error } = await supabase.from('health_practitioners').select('*').eq('hospital_id', hospitalId).eq('status', 'active');
    if (error) throw error;
    return data as HealthPractitioner[] || [];
  }

  static async getHospitalAlerts(hospitalId: string, activeOnly = true): Promise<HealthAlert[]> {
    let query = supabase.from('health_alerts').select('*').eq('hospital_id', hospitalId);
    if (activeOnly) query = query.eq('is_resolved', false);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthAlert[] || [];
  }

  static async createAlert(alert: Omit<HealthAlert, 'id' | 'created_at' | 'updated_at'>): Promise<HealthAlert> {
    const { data, error } = await supabase.from('health_alerts').insert(alert).select().single();
    if (error) throw error;
    return data as HealthAlert;
  }

  static async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<HealthAlert> {
    const { data, error } = await supabase
      .from('health_alerts')
      .update({ is_resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString(), resolution_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', alertId)
      .select()
      .single();
    if (error) throw error;
    return data as HealthAlert;
  }

  static async getHospitalStats(hospitalId: string) {
    const { data: beds, error: bedsError } = await supabase.from('health_beds').select('status').eq('hospital_id', hospitalId);
    if (bedsError) throw bedsError;
    const { data: departments, error: deptError } = await supabase.from('health_departments').select('current_occupancy, max_capacity').eq('hospital_id', hospitalId);
    if (deptError) throw deptError;

    const totalBeds = beds?.length || 0;
    const occupiedBeds = beds?.filter(b => b.status === 'occupied').length || 0;
    const totalCapacity = departments?.reduce((sum, d) => sum + (d.max_capacity || 0), 0) || 0;
    const totalOccupancy = departments?.reduce((sum, d) => sum + (d.current_occupancy || 0), 0) || 0;

    return {
      totalBeds, occupiedBeds, availableBeds: totalBeds - occupiedBeds,
      bedOccupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
      totalCapacity, totalOccupancy,
      departmentOccupancyRate: totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0,
    };
  }
}
