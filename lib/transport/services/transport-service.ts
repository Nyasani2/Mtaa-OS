// lib/transport/services/transport-service.ts
// Unified transport service — orchestrates boda-ops + mtaxi-ops edge functions

import { supabase } from '@/lib/supabase';
import type {
  ServiceType, TransportVehicleType, PaymentMethod, LocationPoint,
  TransportRide, VehicleTier, FareEstimate, DriverAvailability, RecentPlace,
} from '../types';

// Fallback Vehicle Tiers
const CAR_TIERS: VehicleTier[] = [
  { id: 'economy', name: 'Economy', description: 'Affordable everyday rides', base_fare: 100, per_km_rate: 35, per_min_rate: 4, icon: 'car-outline', color: '#3b82f6', service_type: 'car', capacity: 4 },
  { id: 'comfort', name: 'Comfort', description: 'Newer cars, top drivers', base_fare: 150, per_km_rate: 50, per_min_rate: 6, icon: 'car-sport-outline', color: '#8B5CF6', service_type: 'car', capacity: 4 },
  { id: 'premium', name: 'Premium', description: 'Luxury vehicles', base_fare: 300, per_km_rate: 90, per_min_rate: 10, icon: 'diamond-outline', color: '#f59e0b', service_type: 'car', capacity: 4 },
  { id: 'xl', name: 'XL', description: 'Spacious SUVs for groups', base_fare: 200, per_km_rate: 60, per_min_rate: 7, icon: 'people-outline', color: '#10b981', service_type: 'car', capacity: 6 },
];

const BODA_TIERS: VehicleTier[] = [
  { id: 'boda', name: 'Boda Boda', description: 'Fast motorcycle rides', base_fare: 50, per_km_rate: 25, per_min_rate: 3, icon: 'bicycle-outline', color: '#8B5CF6', service_type: 'boda', capacity: 1 },
  { id: 'boda_xl', name: 'Boda XL', description: 'Larger bike, extra helmet', base_fare: 70, per_km_rate: 30, per_min_rate: 3, icon: 'bicycle-outline', color: '#f59e0b', service_type: 'boda', capacity: 1 },
  { id: 'tuk_tuk', name: 'Tuk Tuk', description: 'Three-wheeler comfort', base_fare: 80, per_km_rate: 28, per_min_rate: 3, icon: 'car-outline', color: '#10b981', service_type: 'boda', capacity: 3 },
];

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateFare(pickup: LocationPoint, dropoff: LocationPoint, vehicleType: string, countryCode = 'kenya'): FareEstimate {
  const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const durationMinutes = Math.max(5, Math.round(distanceKm * 3));
  const baseFare = vehicleType.startsWith('boda') ? 50 : 100;
  const perKm = vehicleType.startsWith('boda') ? 25 : 45;
  const perMin = vehicleType.startsWith('boda') ? 3 : 5;
  const distanceFare = Math.round(distanceKm * perKm);
  const timeFare = Math.round(durationMinutes * perMin);
  const total = baseFare + distanceFare + timeFare;
  return {
    amount: total,
    formatted: `KES ${total.toLocaleString()}`,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes,
    baseFare,
    distanceFare,
    timeFare,
    surgeMultiplier: 1,
    currency: 'KES',
  };
}

export async function fetchVehicleTiers(serviceType: ServiceType): Promise<VehicleTier[]> {
  if (serviceType === 'boda') return BODA_TIERS;
  try {
    const { data, error } = await supabase.from('mtaxi_vehicle_types').select('*').eq('status', 'active').order('base_fare', { ascending: true });
    if (error || !data?.length) return CAR_TIERS;
    return data.map((v: any) => ({
      id: v.id, name: v.name, description: v.description || '', base_fare: v.base_fare || 100,
      per_km_rate: v.per_km_rate || 35, per_min_rate: v.per_minute_rate || 4,
      icon: v.icon || 'car-outline', color: v.color || '#3b82f6', service_type: 'car' as ServiceType, capacity: v.capacity || 4,
    }));
  } catch { return CAR_TIERS; }
}

export function getFareEstimate(pickup: LocationPoint, dropoff: LocationPoint, vehicleType: TransportVehicleType, countryCode = 'kenya'): FareEstimate {
  return calculateFare(pickup, dropoff, vehicleType, countryCode);
}

export async function checkAvailability(serviceType: ServiceType, lat: number, lng: number, vehicleType?: string, radiusKm = 5): Promise<DriverAvailability> {
  if (serviceType === 'boda') {
    const { data, error } = await supabase.from('boda_riders').select('id, current_lat, current_lng, is_online, is_approved')
      .eq('is_approved', true).eq('is_online', true)
      .gte('current_lat', lat - 0.045).lte('current_lat', lat + 0.045)
      .gte('current_lng', lng - 0.045).lte('current_lng', lng + 0.045).limit(20);
    if (error) return { available: false, count: 0, message: 'Unable to check availability. Try again.' };
    const nearby = (data || []).filter((r: any) => r.current_lat && r.current_lng && calculateDistanceKm(lat, lng, r.current_lat, r.current_lng) <= radiusKm);
    const avgDist = nearby.length > 0 ? nearby.reduce((sum: number, r: any) => sum + calculateDistanceKm(lat, lng, r.current_lat, r.current_lng), 0) / nearby.length : 0;
    const etaMinutes = avgDist > 0 ? Math.max(1, Math.ceil(avgDist * 3)) : undefined;
    return { available: nearby.length > 0, count: nearby.length, etaMinutes, message: nearby.length > 0 ? `${nearby.length} boda${nearby.length > 1 ? 's' : ''} nearby · ${etaMinutes} min away` : 'No bodas nearby. Try again shortly.' };
  }
  const { data, error } = await supabase.from('mtaxi_drivers').select('id, current_lat, current_lng, status')
    .eq('status', 'active')
    .gte('current_lat', lat - 0.045).lte('current_lat', lat + 0.045)
    .gte('current_lng', lng - 0.045).lte('current_lng', lng + 0.045).limit(20);
  if (error) return { available: false, count: 0, message: 'Unable to check availability. Try again.' };
  const nearby = (data || []).filter((d: any) => d.current_lat && d.current_lng && calculateDistanceKm(lat, lng, d.current_lat, d.current_lng) <= radiusKm);
  const avgDist = nearby.length > 0 ? nearby.reduce((sum: number, d: any) => sum + calculateDistanceKm(lat, lng, d.current_lat, d.current_lng), 0) / nearby.length : 0;
  const etaMinutes = avgDist > 0 ? Math.max(1, Math.ceil(avgDist * 2)) : undefined;
  return { available: nearby.length > 0, count: nearby.length, etaMinutes, message: nearby.length > 0 ? `${nearby.length} driver${nearby.length > 1 ? 's' : ''} nearby · ${etaMinutes} min away` : 'No drivers nearby. Try again shortly.' };
}

export async function requestTransportRide(params: {
  serviceType: ServiceType; passengerId: string; pickup: LocationPoint; dropoff: LocationPoint;
  vehicleType: TransportVehicleType; paymentMethod: PaymentMethod; estimatedFare: number; currency: string; scheduledAt?: string;
}): Promise<TransportRide> {
  const isBoda = params.serviceType === 'boda';
  const edgeFunction = isBoda ? 'boda-operations' : 'mtaxi-operations';
  const body = isBoda
    ? { action: 'request', riderId: params.passengerId, pickup: params.pickup, destination: params.dropoff, bodaType: params.vehicleType, paymentMethod: params.paymentMethod, estimatedFare: params.estimatedFare, currency: params.currency }
    : { action: 'create_ride', passenger_id: params.passengerId, pickup_lat: params.pickup.lat, pickup_lng: params.pickup.lng, pickup_address: params.pickup.address, dropoff_lat: params.dropoff.lat, dropoff_lng: params.dropoff.lng, dropoff_address: params.dropoff.address, ride_type: params.vehicleType, payment_method: params.paymentMethod, fare_estimate: params.estimatedFare, currency: params.currency, scheduled_at: params.scheduledAt };
  const { data, error } = await supabase.functions.invoke(edgeFunction, { body });
  if (error) throw error;
  const raw = data?.ride || data;
  return {
    id: raw.id, passenger_id: isBoda ? raw.rider_id : raw.passenger_id, driver_id: raw.driver_id, service_type: params.serviceType,
    pickup: { lat: raw.pickup_lat ?? params.pickup.lat, lng: raw.pickup_lng ?? params.pickup.lng, address: raw.pickup_address ?? params.pickup.address },
    dropoff: { lat: raw.dropoff_lat ?? params.dropoff.lat, lng: raw.dropoff_lng ?? params.dropoff.lng, address: raw.dropoff_address ?? params.dropoff.address },
    vehicle_type: isBoda ? raw.boda_type : raw.ride_type, payment_method: raw.payment_method || params.paymentMethod,
    status: raw.status || 'searching', fare_estimate: raw.estimated_fare ?? params.estimatedFare, final_fare: raw.final_fare,
    created_at: raw.created_at || new Date().toISOString(), updated_at: raw.updated_at || new Date().toISOString(),
  } as TransportRide;
}

export async function getRideHistory(userId: string, serviceType?: ServiceType): Promise<TransportRide[]> {
  const rides: TransportRide[] = [];
  if (!serviceType || serviceType === 'car') {
    const { data, error } = await supabase.from('mtaxi_rides').select(`*, driver:mtaxi_drivers(id, full_name, phone, vehicle_plate, vehicle_type, rating, photo_url)`)
      .eq('passenger_id', userId).order('created_at', { ascending: false }).limit(50);
    if (!error && data) rides.push(...data.map((r: any) => ({
      id: r.id, passenger_id: r.passenger_id, driver_id: r.driver_id, service_type: 'car' as ServiceType,
      pickup: { lat: r.pickup_lat, lng: r.pickup_lng, address: r.pickup_address },
      dropoff: { lat: r.dropoff_lat, lng: r.dropoff_lng, address: r.dropoff_address },
      vehicle_type: r.ride_type, payment_method: r.payment_method, status: r.status,
      fare_estimate: r.fare_estimate, final_fare: r.final_fare, distance_km: r.distance_km, duration_minutes: r.duration_minutes,
      scheduled_at: r.scheduled_at, created_at: r.created_at, updated_at: r.updated_at, driver: r.driver,
    })));
  }
  if (!serviceType || serviceType === 'boda') {
    try {
      const { data, error } = await supabase.functions.invoke('boda-operations', { body: { action: 'get_history', riderId: userId } });
      if (!error && data?.rides) rides.push(...data.rides.map((r: any) => ({
        id: r.id, passenger_id: r.rider_id, driver_id: r.driver_id, service_type: 'boda' as ServiceType,
        pickup: { lat: r.pickup_lat, lng: r.pickup_lng, address: r.pickup_address },
        dropoff: { lat: r.dropoff_lat, lng: r.dropoff_lng, address: r.dropoff_address },
        vehicle_type: r.boda_type, payment_method: r.payment_method, status: r.status,
        fare_estimate: r.estimated_fare, final_fare: r.final_fare, created_at: r.created_at, updated_at: r.updated_at,
      })));
    } catch (e) { console.warn('[TransportService] Boda history fetch failed:', e); }
  }
  return rides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getRideById(rideId: string, serviceType: ServiceType): Promise<TransportRide | null> {
  if (serviceType === 'boda') {
    try {
      const { data, error } = await supabase.functions.invoke('boda-operations', { body: { action: 'get_ride', tripId: rideId } });
      if (error || !data?.ride) return null;
      const r = data.ride;
      return { id: r.id, passenger_id: r.rider_id, driver_id: r.driver_id, service_type: 'boda', pickup: { lat: r.pickup_lat, lng: r.pickup_lng, address: r.pickup_address }, dropoff: { lat: r.dropoff_lat, lng: r.dropoff_lng, address: r.dropoff_address }, vehicle_type: r.boda_type, payment_method: r.payment_method, status: r.status, fare_estimate: r.estimated_fare, final_fare: r.final_fare, created_at: r.created_at, updated_at: r.updated_at } as TransportRide;
    } catch { return null; }
  }
  const { data, error } = await supabase.from('mtaxi_rides').select(`*, driver:mtaxi_drivers(id, full_name, phone, vehicle_plate, vehicle_type, rating, photo_url)`).eq('id', rideId).single();
  if (error || !data) return null;
  return { id: data.id, passenger_id: data.passenger_id, driver_id: data.driver_id, service_type: 'car', pickup: { lat: data.pickup_lat, lng: data.pickup_lng, address: data.pickup_address }, dropoff: { lat: data.dropoff_lat, lng: data.dropoff_lng, address: data.dropoff_address }, vehicle_type: data.ride_type, payment_method: data.payment_method, status: data.status, fare_estimate: data.fare_estimate, final_fare: data.final_fare, distance_km: data.distance_km, duration_minutes: data.duration_minutes, scheduled_at: data.scheduled_at, created_at: data.created_at, updated_at: data.updated_at, driver: data.driver } as TransportRide;
}

export async function cancelTransportRide(rideId: string, serviceType: ServiceType, reason?: string): Promise<void> {
  const isBoda = serviceType === 'boda';
  const edgeFunction = isBoda ? 'boda-operations' : 'mtaxi-operations';
  const body = isBoda ? { action: 'cancel', tripId: rideId, cancelledBy: 'rider', reason } : { action: 'cancel_ride', ride_id: rideId, reason };
  const { error } = await supabase.functions.invoke(edgeFunction, { body });
  if (error) throw error;
}

const RECENT_PLACES_KEY = 'mtaa_transport_recent_places';

export async function getRecentPlaces(): Promise<RecentPlace[]> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const json = await AsyncStorage.getItem(RECENT_PLACES_KEY);
    if (!json) return [];
    const places = JSON.parse(json) as RecentPlace[];
    return places.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  } catch { return []; }
}

export async function addRecentPlace(place: Omit<RecentPlace, 'id' | 'timestamp'>): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const existing = await getRecentPlaces();
    const newPlace: RecentPlace = { ...place, id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
    const filtered = existing.filter(p => p.address !== place.address);
    const updated = [newPlace, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase.from('wallet_accounts').select('balance, available_balance').eq('user_id', userId).limit(1);
  if (error || !data?.length) return 0;
  return data[0].available_balance ?? data[0].balance ?? 0;
}

export async function geocodeAddress(address: string, nearLat: number, nearLng: number): Promise<LocationPoint | null> {
  if (!address.trim()) return null;
  return { lat: nearLat + (Math.random() - 0.5) * 0.02, lng: nearLng + (Math.random() - 0.5) * 0.02, address, name: address };
}
