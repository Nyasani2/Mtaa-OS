// lib/health/services/ambulance.service.ts
import { supabase } from '@/lib/supabase';
import { HealthAmbulanceRequest, HealthHospital } from '../types';

export class AmbulanceService {
  static async requestAmbulance(request: Omit<HealthAmbulanceRequest, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<HealthAmbulanceRequest> {
    const { data, error } = await supabase
      .from('health_ambulance_requests')
      .insert({ ...request, status: 'pending', cost: 0, payment_status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }

  static async getAmbulanceRequest(requestId: string): Promise<HealthAmbulanceRequest | null> {
    const { data, error } = await supabase.from('health_ambulance_requests').select('*').eq('id', requestId).single();
    if (error) throw error;
    return data as HealthAmbulanceRequest | null;
  }

  static async getUserAmbulanceRequests(userId: string): Promise<HealthAmbulanceRequest[]> {
    const { data, error } = await supabase.from('health_ambulance_requests').select('*').eq('requester_account_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthAmbulanceRequest[] || [];
  }

  static async updateAmbulanceStatus(requestId: string, status: HealthAmbulanceRequest['status'], updates?: Partial<HealthAmbulanceRequest>): Promise<HealthAmbulanceRequest> {
    const { data, error } = await supabase.from('health_ambulance_requests').update({ status, ...updates, updated_at: new Date().toISOString() }).eq('id', requestId).select().single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }

  static async findNearestHospitals(lat: number, lng: number, limit = 5): Promise<HealthHospital[]> {
    const { data, error } = await supabase.from('health_hospitals').select('*').eq('status', 'active').eq('emergency_services', true).order('name', { ascending: true }).limit(limit);
    if (error) throw error;
    return data as HealthHospital[] || [];
  }

  static async getActiveAmbulanceRequests(): Promise<HealthAmbulanceRequest[]> {
    const { data, error } = await supabase.from('health_ambulance_requests').select('*').in('status', ['pending', 'dispatched', 'en_route']).order('created_at', { ascending: true });
    if (error) throw error;
    return data as HealthAmbulanceRequest[] || [];
  }
}
