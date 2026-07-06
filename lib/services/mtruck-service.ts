import { supabase } from '@/lib/supabase';
import { calculateFare, detectCountry, type FareEstimate } from '@/lib/services/fare-engine';

export interface Truck {
  id: string;
  driver_id: string;
  plate_number: string;
  vehicle_type: string;
  capacity: number;
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  current_lat?: number;
  current_lng?: number;
  rating: number;
  total_jobs: number;
  insurance_expiry?: string;
  inspection_status: string;
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
  estimated_fare: number;
  currency: string;
  status: 'pending' | 'quoted' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_truck_id?: string;
  created_at: string;
}

export interface HaulEstimate {
  haulType: 'local_haul' | 'long_haul' | 'heavy_load';
  distanceKm: number;
  estimatedFare: FareEstimate;
  durationHours: number;
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

export function estimateFreight(
  origin: { lat: number; lng: number; address?: string },
  destination: { lat: number; lng: number; address?: string },
  weight_kg: number,
  cargo_type: string,
  haulType: 'local_haul' | 'long_haul' | 'heavy_load' = 'local_haul',
  countryCode?: string
): HaulEstimate {
  const country = countryCode || detectCountry(origin.lat, origin.lng);
  const fare = calculateFare(origin, destination, haulType, country);

  const weightSurcharge = weight_kg > 1000 ? Math.ceil((weight_kg - 1000) / 1000) * 500 : 0;
  fare.amount += weightSurcharge;
  fare.breakdown.total += weightSurcharge;

  const { formatCurrency } = require('./fare-engine');
  fare.formatted = formatCurrency(fare.amount, fare.currency);

  const durationHours = Math.ceil(fare.durationMinutes / 60);

  return {
    haulType,
    distanceKm: fare.distanceKm,
    estimatedFare: fare,
    durationHours,
  };
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

export function getHaulTypes(countryCode: string = 'kenya') {
  const { getServiceTypes, getCountryInfo } = require('./fare-engine');
  const types = getServiceTypes(countryCode);
  const country = getCountryInfo(countryCode);

  return types
    .filter((t: any) => ['local_haul', 'long_haul', 'heavy_load'].includes(t.id))
    .map((t: any) => ({
      ...t,
      basePrice: Math.round(country.baseFare * t.baseMultiplier),
      currency: country.currency,
      currencySymbol: country.currencySymbol,
    }));
}

export async function checkTruckAvailability(
  originLat: number,
  originLng: number,
  truckType?: string
): Promise<{
  available: boolean;
  count: number;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('status', 'available')
      .gte('current_lat', originLat - 0.09)
      .lte('current_lat', originLat + 0.09)
      .gte('current_lng', originLng - 0.09)
      .lte('current_lng', originLng + 0.09)
      .limit(20);

    if (error) throw error;

    const trucks = data || [];
    const filtered = truckType
      ? trucks.filter((t: any) => t.vehicle_type === truckType)
      : trucks;

    if (filtered.length === 0) {
      return {
        available: false,
        count: 0,
        message: 'No trucks available for this route. Try again later or contact support.',
      };
    }

    return {
      available: true,
      count: filtered.length,
      message: `${filtered.length} truck${filtered.length > 1 ? 's' : ''} available nearby`,
    };
  } catch (e) {
    return {
      available: false,
      count: 0,
      message: 'Unable to check truck availability. Please try again.',
    };
  }
}
