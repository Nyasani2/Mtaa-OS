import { supabase } from '@/lib/supabase';

export interface TransportRoute {
  id: string;
  institution_id: string;
  route_name: string;
  route_code: string;
  vehicle_plate: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  stops: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTransportRoutes(filters?: {
  institution_id?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_transport_routes')
      .select('*')
      .order('route_name', { ascending: true });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as TransportRoute[], error: null };
  } catch (error: any) {
    console.error('getTransportRoutes error:', error);
    return { data: [], error };
  }
}

export async function getTransportRouteById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_transport_routes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as TransportRoute, error: null };
  } catch (error: any) {
    console.error('getTransportRouteById error:', error);
    return { data: null, error };
  }
}

export async function createTransportRoute(route: Partial<TransportRoute>) {
  try {
    const { data, error } = await supabase
      .from('education_transport_routes')
      .insert([route])
      .select()
      .single();
    if (error) throw error;
    return { data: data as TransportRoute, error: null };
  } catch (error: any) {
    console.error('createTransportRoute error:', error);
    return { data: null, error };
  }
}

export async function updateTransportRoute(id: string, updates: Partial<TransportRoute>) {
  try {
    const { data, error } = await supabase
      .from('education_transport_routes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as TransportRoute, error: null };
  } catch (error: any) {
    console.error('updateTransportRoute error:', error);
    return { data: null, error };
  }
}
