import { supabase } from '@/lib/supabase';
import { VehicleRegistration, DrivingLicense, InspectionRecord, Sacco, TrafficOffence, NTSAApplication, RoadIncident } from '../types';

export class NTSAService {
  async getVehicles(filters?: { status?: VehicleRegistration['status']; ownerId?: string }) {
    let query = supabase.from('ntsa_vehicles').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as VehicleRegistration[];
  }

  async getVehicleById(id: string) {
    const { data, error } = await supabase.from('ntsa_vehicles').select('*').eq('id', id).single();
    if (error) throw error;
    return data as VehicleRegistration;
  }

  async registerVehicle(vehicle: Omit<VehicleRegistration, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('ntsa_vehicles').insert(vehicle).select().single();
    if (error) throw error;
    return data as VehicleRegistration;
  }

  async getLicenses(filters?: { status?: DrivingLicense['status']; holderId?: string }) {
    let query = supabase.from('ntsa_licenses').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.holderId) query = query.eq('holder_id', filters.holderId);
    const { data, error } = await query.order('issue_date', { ascending: false });
    if (error) throw error;
    return data as DrivingLicense[];
  }

  async getInspections(filters?: { status?: InspectionRecord['status']; vehicleId?: string }) {
    let query = supabase.from('ntsa_inspections').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
    const { data, error } = await query.order('inspection_date', { ascending: false });
    if (error) throw error;
    return data as InspectionRecord[];
  }

  async scheduleInspection(vehicleId: string, inspectorId: string, date: string) {
    const { data, error } = await supabase.from('ntsa_inspections').insert({
      vehicle_id: vehicleId, inspector_id: inspectorId, inspection_date: date,
      status: 'pending', created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as InspectionRecord;
  }

  async completeInspection(inspectionId: string, findings: string, status: InspectionRecord['status'], recommendations?: string) {
    const { data, error } = await supabase.from('ntsa_inspections')
      .update({ findings, status, recommendations, expiry_date: status === 'passed' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined })
      .eq('id', inspectionId).select().single();
    if (error) throw error;
    return data as InspectionRecord;
  }

  async getSaccos(filters?: { status?: Sacco['status'] }) {
    let query = supabase.from('ntsa_saccos').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data as Sacco[];
  }

  async getOffences(filters?: { status?: TrafficOffence['status']; vehicleId?: string; driverId?: string }) {
    let query = supabase.from('ntsa_offences').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
    if (filters?.driverId) query = query.eq('driver_id', filters.driverId);
    const { data, error } = await query.order('issued_at', { ascending: false });
    if (error) throw error;
    return data as TrafficOffence[];
  }

  async payFine(offenceId: string, paymentRef: string) {
    const { data, error } = await supabase.from('ntsa_offences')
      .update({ status: 'paid', paid_at: new Date().toISOString(), payment_reference: paymentRef })
      .eq('id', offenceId).select().single();
    if (error) throw error;
    return data as TrafficOffence;
  }

  async getApplications(filters?: { status?: NTSAApplication['status']; applicantId?: string }) {
    let query = supabase.from('ntsa_applications').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.applicantId) query = query.eq('applicant_id', filters.applicantId);
    const { data, error } = await query.order('submitted_at', { ascending: false });
    if (error) throw error;
    return data as NTSAApplication[];
  }

  async getIncidents(filters?: { status?: RoadIncident['status'] }) {
    let query = supabase.from('ntsa_incidents').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as RoadIncident[];
  }

  async getStats() {
    const { data: vehicles, error: vError } = await supabase.from('ntsa_vehicles').select('status', { count: 'exact' });
    if (vError) throw vError;
    const { data: licences, error: lError } = await supabase.from('ntsa_licenses').select('status', { count: 'exact' });
    if (lError) throw lError;
    return {
      totalVehicles: vehicles?.length || 0,
      activeVehicles: vehicles?.filter((v: any) => v.status === 'active').length || 0,
      totalLicenses: licences?.length || 0,
      activeLicenses: licences?.filter((l: any) => l.status === 'active').length || 0,
    };
  }
}

export const ntsaService = new NTSAService();
