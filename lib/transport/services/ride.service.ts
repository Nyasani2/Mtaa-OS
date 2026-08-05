import { supabase } from '@/lib/supabase';

// ============================================================
// REAL WORLD FARE RATES (Kenya market-aligned)
// ============================================================
export const FARE_RATES: Record<string, {
  base: number;      // KES — fixed pickup fee
  perKm: number;     // KES per km
  perMin: number;    // KES per minute
  minFare: number;   // minimum fare floor
  surgeCap: number;  // max surge multiplier
}> = {
  economy:  { base: 50,  perKm: 35, perMin: 4, minFare: 100, surgeCap: 3.0 },
  comfort:  { base: 80,  perKm: 50, perMin: 6, minFare: 150, surgeCap: 2.5 },
  xl:       { base: 120, perKm: 70, perMin: 8, minFare: 250, surgeCap: 2.0 },
  boda:     { base: 30,  perKm: 20, perMin: 3, minFare: 50,  surgeCap: 2.0 },
  delivery: { base: 60,  perKm: 40, perMin: 5, minFare: 120, surgeCap: 2.5 },
};

export function calculateFare(
  rideType: string,
  distanceKm: number,
  estimatedMinutes: number,
  surgeMultiplier: number = 1
): { base: number; distanceFare: number; timeFare: number; surge: number; total: number } {
  const rate = FARE_RATES[rideType] || FARE_RATES.economy;
  const distFare = Math.round(rate.perKm * distanceKm);
  const timeFare = Math.round(rate.perMin * estimatedMinutes);
  const rawTotal = rate.base + distFare + timeFare;
  const surge = Math.max(1, Math.min(surgeMultiplier, rate.surgeCap));
  const total = Math.max(rate.minFare, Math.round(rawTotal * surge));

  return {
    base: rate.base,
    distanceFare: distFare,
    timeFare,
    surge,
    total,
  };
}

export function estimateMinutes(distanceKm: number, rideType: string): number {
  // Average speeds: economy 25km/h, boda 35km/h, comfort 30km/h, xl 25km/h, delivery 20km/h
  const speeds: Record<string, number> = { economy: 25, comfort: 30, xl: 25, boda: 35, delivery: 20 };
  const speed = speeds[rideType] || 25;
  return Math.round((distanceKm / speed) * 60);
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// RIDE OPERATIONS
// ============================================================
export interface CreateRidePayload {
  passenger_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address?: string;
  dropoff_address?: string;
  ride_type: string;
  payment_method: string;
  fare_estimate: number;
  distance_km: number;
  base_fare?: number;
  time_fare?: number;
  surge_multiplier?: number;
}

export interface NearbyDriver {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating: number;
  current_lat: number | null;
  current_lng: number | null;
  is_online: boolean;
}

export async function createRide(payload: CreateRidePayload) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .insert({
      passenger_id: payload.passenger_id,
      pickup_lat: payload.pickup_lat,
      pickup_lng: payload.pickup_lng,
      dropoff_lat: payload.dropoff_lat,
      dropoff_lng: payload.dropoff_lng,
      pickup_address: payload.pickup_address,
      dropoff_address: payload.dropoff_address,
      ride_type: payload.ride_type,
      payment_method: payload.payment_method,
      fare_estimate: payload.fare_estimate,
      distance_km: payload.distance_km,
      base_fare: payload.base_fare || 0,
      time_fare: payload.time_fare || 0,
      surge_multiplier: payload.surge_multiplier || 1,
      status: 'searching',
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRideById(rideId: string) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .select('*')
    .eq('id', rideId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPassengerRides(passengerId: string) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .select(`
      *,
      mtaxi_drivers(id, full_name, phone, vehicle_plate, rating)
    `)
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function findNearbyDrivers(lat: number, lng: number, radiusKm: number = 10) {
  const { data, error } = await supabase
    .from('mtaxi_drivers')
    .select('*')
    .eq('is_online', true)
    .eq('is_active', true)
    .eq('background_check_passed', true);

  if (error) throw error;
  if (!data) return [];

  return data.filter((d: any) => {
    if (!d.current_lat || !d.current_lng) return false;
    const dist = haversine(lat, lng, d.current_lat as number, d.current_lng as number);
    return dist <= radiusKm;
  }) as NearbyDriver[];
}

// ============================================================
// WALLET
// ============================================================
export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('id, balance, available_balance, currency')
    .eq('user_id', userId)
    .eq('currency', 'KES')
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return { balance: 0, available_balance: 0, currency: 'KES' };
    throw error;
  }
  return data;
}

export async function deductRideFare(userId: string, amount: number, rideId: string) {
  const { data: wallet, error: wErr } = await supabase
    .from('wallet_accounts')
    .select('id, available_balance')
    .eq('user_id', userId)
    .eq('currency', 'KES')
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (wErr || !wallet) throw new Error('No active KES wallet found');
  if ((wallet.available_balance as number) < amount) throw new Error('Insufficient balance');

  const newBal = (wallet.available_balance as number) - amount;
  const { error: updErr } = await supabase
    .from('wallet_accounts')
    .update({
      balance: newBal,
      available_balance: newBal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wallet.id);

  if (updErr) throw updErr;

  const { error: txErr } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    wallet_id: wallet.id,
    type: 'debit',
    amount: amount,
    currency: 'KES',
    status: 'completed',
    description: 'Ride fare deduction',
    reference_id: rideId,
    reference_type: 'mtaxi_ride',
    metadata: { direction: 'out', auto_deducted: true },
  });

  if (txErr) throw txErr;
  return true;
}

// ============================================================
// MTRUCK
// ============================================================
export interface CreateHaulPayload {
  shipper_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address?: string;
  dropoff_address?: string;
  cargo_type?: string;
  weight_kg?: number;
  payment_method?: string;
  fare_estimate?: number;
  base_fare?: number;
  distance_fare?: number;
  time_fare?: number;
}

export async function createHaul(payload: CreateHaulPayload) {
  const { data, error } = await supabase
    .from('mtruck_hauls')
    .insert({
      shipper_id: payload.shipper_id,
      pickup_lat: payload.pickup_lat,
      pickup_lng: payload.pickup_lng,
      dropoff_lat: payload.dropoff_lat,
      dropoff_lng: payload.dropoff_lng,
      pickup_address: payload.pickup_address,
      dropoff_address: payload.dropoff_address,
      cargo_type: payload.cargo_type,
      weight_kg: payload.weight_kg,
      payment_method: payload.payment_method || 'wallet',
      fare_estimate: payload.fare_estimate,
      base_fare: payload.base_fare || 0,
      distance_fare: payload.distance_fare || 0,
      time_fare: payload.time_fare || 0,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getShipperHauls(shipperId: string) {
  const { data, error } = await supabase
    .from('mtruck_hauls')
    .select('*')
    .eq('shipper_id', shipperId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTruckCompany(payload: {
  owner_id: string;
  company_name: string;
  registration_number?: string;
  kra_pin?: string;
  email: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  county?: string;
}) {
  const { data, error } = await supabase
    .from('mtruck_companies')
    .insert({ ...payload, country: 'Kenya', status: 'pending' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================================
// GARAGE
// ============================================================
export async function getGarageByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('garages')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGarageDevices(garageId: string) {
  const { data, error } = await supabase
    .from('garage_devices')
    .select('*')
    .eq('garage_id', garageId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function registerGarageDevice(payload: {
  garage_id: string;
  device_name: string;
  device_type: string;
  serial_number?: string;
}) {
  const { data, error } = await supabase
    .from('garage_devices')
    .insert({ ...payload, status: 'active' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGarageInspections(garageId: string) {
  const { data, error } = await supabase
    .from('garage_inspections')
    .select(`
      *,
      mtaxi_vehicles(id, plate_number, make, model)
    `)
    .eq('garage_id', garageId)
    .order('inspected_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInspection(payload: {
  garage_id: string;
  vehicle_id: string;
  inspector_id: string;
  inspection_type?: string;
  result?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('garage_inspections')
    .insert({
      garage_id: payload.garage_id,
      vehicle_id: payload.vehicle_id,
      inspector_id: payload.inspector_id,
      inspection_type: payload.inspection_type || 'routine',
      result: payload.result || 'pending',
      notes: payload.notes,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}


// ============================================================
// DRIVER FUNCTIONS
// ============================================================

export async function getDriverProfile(driverId: string) {
  const { data, error } = await supabase
    .from('mtaxi_drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDriverByUserId(userId: string) {
  const { data, error } = await supabase
    .from('mtaxi_drivers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDriverOnlineStatus(driverId: string, isOnline: boolean, lat?: number, lng?: number) {
  const { data, error } = await supabase.rpc('update_driver_status', {
    p_driver_id: driverId,
    p_is_online: isOnline,
    p_lat: lat || null,
    p_lng: lng || null,
  });
  if (error) throw error;
  return data;
}

export async function findNearbyRideRequests(driverLat: number, driverLng: number, radiusKm: number = 10) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .select(`
      *,
      mtaxi_drivers!mtaxi_rides_driver_id_fkey(id, full_name, phone)
    `)
    .eq('status', 'searching')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.filter((r: any) => {
    if (!r.pickup_lat || !r.pickup_lng) return false;
    const d = haversine(driverLat, driverLng, r.pickup_lat, r.pickup_lng);
    return d <= radiusKm;
  });
}

export async function acceptRide(rideId: string, driverId: string) {
  const { data, error } = await supabase.rpc('driver_accept_ride', {
    p_ride_id: rideId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return data;
}

export async function updateRideStatus(rideId: string, status: string) {
  const { data, error } = await supabase.rpc('update_ride_status', {
    p_ride_id: rideId,
    p_status: status,
  });
  if (error) throw error;
  return data;
}

export async function getDriverRides(driverId: string) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .select(`
      *,
      mtaxi_drivers!mtaxi_rides_driver_id_fkey(id, full_name, phone, vehicle_plate)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDriverEarnings(driverId: string, period: 'today' | 'week' | 'month' = 'today') {
  let startDate = new Date();
  if (period === 'today') startDate.setHours(0, 0, 0, 0);
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', driverId)
    .eq('type', 'credit')
    .eq('reference_type', 'driver_earnings')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  const total = (data || []).reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  return { transactions: data || [], total };
}

export async function getDriverWalletBalance(driverUserId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('id, balance, available_balance, currency')
    .eq('user_id', driverUserId)
    .eq('currency', 'KES')
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return { balance: 0, available_balance: 0, currency: 'KES' };
    throw error;
  }
  return data;
}
