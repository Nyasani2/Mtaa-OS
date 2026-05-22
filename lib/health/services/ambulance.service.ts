import { supabase } from '@/lib/supabase';
import { HealthAmbulanceRequest } from '../types';

export class AmbulanceService {
  static async getRequests(filters?: { status?: HealthAmbulanceRequest['status']; requesterId?: string }) {
    let query = supabase.from('health_ambulance_requests').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.requesterId) query = query.eq('requester_id', filters.requesterId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthAmbulanceRequest[];
  }

  static async getRequestById(id: string) {
    const { data, error } = await supabase.from('health_ambulance_requests').select('*').eq('id', id).single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }

  static async createRequest(request: Omit<HealthAmbulanceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('health_ambulance_requests').insert(request).select().single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }

  static async updateRequest(id: string, updates: Partial<HealthAmbulanceRequest>) {
    const { data, error } = await supabase.from('health_ambulance_requests').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }

  static async updateStatus(id: string, status: HealthAmbulanceRequest['status']) {
    const { data, error } = await supabase.from('health_ambulance_requests')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data as HealthAmbulanceRequest;
  }
}

export const ambulanceService = new AmbulanceService();
