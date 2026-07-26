import { supabase } from '@/lib/supabase';
import type { FunctionsHttpError } from '@supabase/supabase-js';

export interface Ride {
  id: string;
  driver_id: string | null;
  rider_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  status: string;
  fare: number | null;
  created_at: string;
}

export interface Driver {
  user_id: string;
  vehicle_type: string;
  license_number: string | null;
  verified: boolean;
  current_lat: number | null;
  current_lng: number | null;
  is_available: boolean;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

async function invokeEdgeFunction<T>(functionName: string, body?: Record<string, any>): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) {
      const httpError = error as FunctionsHttpError;
      return { data: null, error: httpError.message || `Edge function ${functionName} failed` };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || `Failed to call ${functionName}` };
  }
}

// MTaxi
export async function requestRide(riderId: string, pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }, vehicleType: string = 'taxi'): Promise<ServiceResult<Ride>> {
  return invokeEdgeFunction('mtaxi-operations', { action: 'request_ride', rider_id: riderId, pickup, dropoff, vehicle_type: vehicleType });
}

export async function getRideStatus(rideId: string): Promise<ServiceResult<Ride>> {
  return invokeEdgeFunction('mtaxi-operations', { action: 'get_ride_status', ride_id: rideId });
}

export async function cancelRide(rideId: string, riderId: string): Promise<ServiceResult<null>> {
  return invokeEdgeFunction('mtaxi-operations', { action: 'cancel_ride', ride_id: rideId, rider_id: riderId });
}

export async function getNearbyDrivers(lat: number, lng: number, radius: number = 5): Promise<ServiceResult<Driver[]>> {
  return invokeEdgeFunction('mtaxi-operations', { action: 'get_nearby_drivers', lat, lng, radius_km: radius });
}

// MTruck
export async function requestTruck(userId: string, pickup: string, dropoff: string, tonnes: number): Promise<ServiceResult<any>> {
  return invokeEdgeFunction('mtruck-operations', { action: 'request_truck', user_id: userId, pickup_location: pickup, dropoff_location: dropoff, required_tonnage: tonnes });
}

export async function getTruckJobs(userId: string): Promise<ServiceResult<any[]>> {
  return invokeEdgeFunction('mtruck-operations', { action: 'get_jobs', user_id: userId });
}

// Boda
export async function requestBoda(riderId: string, pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }): Promise<ServiceResult<any>> {
  return invokeEdgeFunction('boda-operations', { action: 'request_boda', rider_id: riderId, pickup, dropoff });
}
