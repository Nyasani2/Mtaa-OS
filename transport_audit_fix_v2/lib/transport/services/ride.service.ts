import { supabase } from '@/lib/supabase';

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
      status: 'searching',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRideById(rideId: string) {
  const { data, error } = await supabase
    .from('mtaxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();
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
    const dLat = ((d.current_lat as number) - lat) * (Math.PI / 180);
    const dLng = ((d.current_lng as number) - lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos((d.current_lat as number) * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = 6371 * c;
    return dist <= radiusKm;
  }) as NearbyDriver[];
}

export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('id, balance, available_balance, currency')
    .eq('user_id', userId)
    .eq('currency', 'KES')
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .limit(1)
    .single();

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
    .single();

  if (wErr || !wallet) throw new Error('No active KES wallet found');
  if ((wallet.available_balance as number) < amount) throw new Error('Insufficient balance');

  const { error: updErr } = await supabase
    .from('wallet_accounts')
    .update({
      balance: supabase.rpc('subtract', { a: wallet.available_balance, b: amount }),
      available_balance: supabase.rpc('subtract', { a: wallet.available_balance, b: amount }),
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

// ---- MTruck ----

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
      status: 'pending',
    })
    .select()
    .single();

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
    .single();
  if (error) throw error;
  return data;
}

// ---- Garage ----

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
    .single();
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
    .single();
  if (error) throw error;
  return data;
}
