import { supabase } from '@/lib/supabase';
import { HealthPharmacy, HealthPharmacyOrder } from '../types';

export class PharmacyService {
  static async getPharmacies(filters?: { status?: HealthPharmacy['status']; ownerId?: string }) {
    let query = supabase.from('health_pharmacies').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data as HealthPharmacy[];
  }

  static async getPharmacyById(id: string) {
    const { data, error } = await supabase.from('health_pharmacies').select('*').eq('id', id).single();
    if (error) throw error;
    return data as HealthPharmacy;
  }

  static async getMedications(pharmacyId: string) {
    const { data, error } = await supabase.from('health_medications').select('*').eq('pharmacy_id', pharmacyId).order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async searchMedications(query: string) {
    const { data, error } = await supabase.from('health_medications')
      .select('*').or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (error) throw error;
    return data;
  }

  static async getOrders(patientId?: string) {
    let query = supabase.from('health_pharmacy_orders').select('*');
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as HealthPharmacyOrder[];
  }

  static async createOrder(order: Omit<HealthPharmacyOrder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('health_pharmacy_orders').insert(order).select().single();
    if (error) throw error;
    return data as HealthPharmacyOrder;
  }

  static async updateOrderStatus(id: string, status: HealthPharmacyOrder['status']) {
    const { data, error } = await supabase.from('health_pharmacy_orders')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data as HealthPharmacyOrder;
  }
}

export const pharmacyService = new PharmacyService();
