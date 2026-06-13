import { supabase } from '@/lib/supabase';

export interface Garage {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  email?: string;
  services_offered: string[];
  operating_hours: Record<string, string>;
  rating: number;
  review_count: number;
  is_24h: boolean;
  status: 'active' | 'closed' | 'suspended';
  created_at: string;
}

export interface ServiceBooking {
  id: string;
  garage_id: string;
  customer_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  service_type: string;
  description: string;
  preferred_date: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  final_cost?: number;
  created_at: string;
}

export async function listGarages(limit = 20, services?: string[]) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'list_garages', limit, services }
  });
  if (error) throw error;
  return data;
}

export async function getGarage(garage_id: string) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'get_garage', garage_id }
  });
  if (error) throw error;
  return data;
}

export async function getGarageServices(garage_id: string) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'get_services', garage_id }
  });
  if (error) throw error;
  return data;
}

export async function bookService(params: Omit<ServiceBooking, 'id' | 'status' | 'estimated_cost' | 'final_cost' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'book_service', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getMyBookings(customer_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'get_my_bookings', customer_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(booking_id: string, status: ServiceBooking['status'], final_cost?: number) {
  const { data, error } = await supabase.functions.invoke('garage-operations', {
    body: { action: 'update_booking_status', booking_id, status, final_cost }
  });
  if (error) throw error;
  return data;
}
