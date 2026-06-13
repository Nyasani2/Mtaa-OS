import { supabase } from '@/lib/supabase';

export interface Truck {
  id: string;
  owner_id: string;
  plate_number: string;
  truck_type: string;
  capacity_kg: number;
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  current_lat?: number;
  current_lng?: number;
  driver_id?: string;
  insurance_expiry?: string;
  inspection_status: 'valid' | 'expired' | 'pending';
  created_at: string;
}

export interface FreightRequest {
  id: string;
  requester_id: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  cargo_type: string;
  weight_kg: number;
  truck_type_preference?: string;
  budget: number;
  status: 'pending' | 'quoted' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_truck_id?: string;
  created_at: string;
}

export async function listTrucks(status?: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'list_trucks', status, limit }
  });
  if (error) throw error;
  return data;
}

export async function getTruck(truck_id: string) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'get_truck', truck_id }
  });
  if (error) throw error;
  return data;
}

export async function estimateFreight(origin: string, destination: string, weight_kg: number, cargo_type: string) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'estimate_freight', origin, destination, weight_kg, cargo_type }
  });
  if (error) throw error;
  return data;
}

export async function requestFreight(params: Omit<FreightRequest, 'id' | 'status' | 'assigned_truck_id' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'request_freight', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getMyFreightRequests(requester_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'get_my_freight_requests', requester_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function updateTruckLocation(truck_id: string, lat: number, lng: number) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'update_truck_location', truck_id, lat, lng }
  });
  if (error) throw error;
  return data;
}

export async function getDriverFreightJobs(driver_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('mtruck-operations', {
    body: { action: 'get_driver_jobs', driver_id, limit }
  });
  if (error) throw error;
  return data;
}
