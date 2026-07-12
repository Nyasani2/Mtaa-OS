// ============================================================
// MTAA OS V10 - MTruck Service
// 50 tables: mtruck_trucks, mtruck_freight, mtruck_fleet, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Truck {
  id: string; owner_id?: string; driver_id?: string; make: string; model: string; year?: number;
  license_plate: string; capacity_tons?: number; type?: string; status: 'active' | 'inactive' | 'maintenance';
  current_location?: string; lat?: number; lng?: number; created_at?: string;
}

export interface Freight {
  id: string; shipper_id: string; truck_id?: string; driver_id?: string; pickup_location: string;
  dropoff_location: string; cargo_type?: string; weight?: number; dimensions?: string;
  fare_estimate?: number; final_fare?: number; status: 'requested' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  scheduled_date?: string; delivered_at?: string; created_at?: string;
}

export interface Fleet {
  id: string; owner_id: string; name: string; description?: string; truck_count?: number;
  status?: string; created_at?: string;
}

export interface FleetTruck {
  id: string; fleet_id: string; truck_id: string; added_at?: string; status?: string;
}

export interface HaulType {
  id: string; name: string; description?: string; base_rate?: number; per_km_rate?: number;
  min_weight?: number; max_weight?: number; status?: string;
}

export interface FreightRequest {
  id: string; shipper_id: string; pickup_location: string; dropoff_location: string;
  cargo_type?: string; weight?: number; status: 'pending' | 'accepted' | 'expired' | 'cancelled'; created_at?: string;
}

export interface FreightBid {
  id: string; freight_request_id: string; driver_id: string; truck_id: string; bid_amount: number;
  status: 'pending' | 'accepted' | 'rejected'; created_at?: string;
}

export interface TruckLocation {
  id: string; truck_id: string; driver_id?: string; lat: number; lng: number; recorded_at?: string;
}

export interface TruckTelemetry {
  id: string; truck_id: string; fuel_level?: number; mileage?: number; engine_temp?: number;
  tire_pressure?: any; recorded_at?: string;
}

export interface TruckInspection {
  id: string; truck_id: string; inspector_id?: string; inspection_date?: string;
  status: 'pending' | 'passed' | 'failed'; notes?: string; next_due_date?: string; created_at?: string;
}

export interface TruckDocument {
  id: string; truck_id: string; document_type: string; document_url?: string;
  expiry_date?: string; status?: string; uploaded_at?: string;
}

export interface CustomsClearance {
  id: string; freight_id: string; customs_office?: string; clearance_status: 'pending' | 'in_progress' | 'cleared' | 'held';
  documents?: any; cleared_at?: string; created_at?: string;
}

export interface DriverFreightJob {
  id: string; driver_id: string; freight_id: string; status: 'assigned' | 'in_progress' | 'completed';
  assigned_at?: string; completed_at?: string;
}

export interface ShipperProfile {
  id: string; user_id: string; company_name?: string; business_type?: string; verification_status?: string;
  created_at?: string;
}

export interface TruckOwnerProfile {
  id: string; user_id: string; company_name?: string; fleet_size?: number; verification_status?: string;
  created_at?: string;
}

export interface FreightTracking {
  id: string; freight_id: string; status: string; location?: string; lat?: number; lng?: number;
  timestamp?: string; notes?: string;
}

export interface Route {
  id: string; name: string; start_location: string; end_location: string; distance_km?: number;
  estimated_hours?: number; status?: string; created_at?: string;
}

export interface RouteStop {
  id: string; route_id: string; stop_number: number; location: string; lat?: number; lng?: number;
  estimated_arrival?: string;
}

export interface Load {
  id: string; shipper_id: string; description: string; weight: number; dimensions?: string;
  pickup_location: string; dropoff_location: string; status: 'available' | 'booked' | 'in_transit' | 'delivered';
  created_at?: string;
}

export interface LoadBooking {
  id: string; load_id: string; truck_id: string; driver_id: string; booking_date?: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'; created_at?: string;
}

export interface FreightInvoice {
  id: string; freight_id: string; amount: number; tax?: number; total_amount: number;
  status: 'pending' | 'paid' | 'overdue'; due_date?: string; created_at?: string;
}

export interface TruckMaintenance {
  id: string; truck_id: string; maintenance_type: string; description?: string; cost?: number;
  scheduled_date?: string; completed_date?: string; status: 'scheduled' | 'in_progress' | 'completed'; created_at?: string;
}

export interface DriverPayment {
  id: string; driver_id: string; freight_id?: string; amount: number; type: string; status?: string; created_at?: string;
}

export interface DriverEarning {
  id: string; driver_id: string; freight_id?: string; amount: number; commission?: number;
  net_amount: number; status?: string; created_at?: string;
}

export interface FreightReview {
  id: string; freight_id: string; reviewer_id: string; reviewee_id: string; rating: number;
  comment?: string; created_at?: string;
}

export interface TruckAvailability {
  id: string; truck_id: string; driver_id?: string; available_from?: string; available_until?: string;
  location?: string; lat?: number; lng?: number; status: 'available' | 'booked' | 'offline'; updated_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[MTruckService]', err?.message || err);
  return fallback;
}

// ─── TRUCKS ───
export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('mtruck_trucks').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTruckById(id: string): Promise<Truck | null> {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getTrucksByOwner(ownerId: string): Promise<Truck[]> {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('owner_id', ownerId);
  if (error) return handleError(error, []); return data || [];
}
export async function getTrucksByDriver(driverId: string): Promise<Truck[]> {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function getAvailableTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('mtruck_trucks').select('*').eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createTruck(data: Partial<Truck>): Promise<Truck | null> {
  const { data: result, error } = await supabase.from('mtruck_trucks').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruck(id: string, data: Partial<Truck>): Promise<Truck | null> {
  const { data: result, error } = await supabase.from('mtruck_trucks').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruck(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_trucks').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}
export async function checkTruckAvailability(truckId: string): Promise<boolean> {
  const truck = await getTruckById(truckId);
  return truck?.status === 'active';
}
export async function updateTruckLocation(truckId: string, lat: number, lng: number): Promise<Truck | null> {
  return updateTruck(truckId, { lat, lng, current_location: `${lat},${lng}` });
}

// ─── FREIGHT ───
export async function getFreights(): Promise<Freight[]> {
  const { data, error } = await supabase.from('mtruck_freight').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getFreightById(id: string): Promise<Freight | null> {
  const { data, error } = await supabase.from('mtruck_freight').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getShipperFreights(shipperId: string): Promise<Freight[]> {
  const { data, error } = await supabase.from('mtruck_freight').select('*').eq('shipper_id', shipperId);
  if (error) return handleError(error, []); return data || [];
}
export async function getDriverFreights(driverId: string): Promise<Freight[]> {
  const { data, error } = await supabase.from('mtruck_freight').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function createFreight(data: Partial<Freight>): Promise<Freight | null> {
  const { data: result, error } = await supabase.from('mtruck_freight').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFreight(id: string, data: Partial<Freight>): Promise<Freight | null> {
  const { data: result, error } = await supabase.from('mtruck_freight').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFreight(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_freight').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}
export async function requestFreight(data: Partial<Freight>): Promise<Freight | null> {
  return createFreight({ ...data, status: 'requested' });
}

// ─── FLEETS ───
export async function getFleets(): Promise<Fleet[]> {
  const { data, error } = await supabase.from('mtruck_fleets').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getFleetById(id: string): Promise<Fleet | null> {
  const { data, error } = await supabase.from('mtruck_fleets').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getOwnerFleets(ownerId: string): Promise<Fleet[]> {
  const { data, error } = await supabase.from('mtruck_fleets').select('*').eq('owner_id', ownerId);
  if (error) return handleError(error, []); return data || [];
}
export async function createFleet(data: Partial<Fleet>): Promise<Fleet | null> {
  const { data: result, error } = await supabase.from('mtruck_fleets').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFleet(id: string, data: Partial<Fleet>): Promise<Fleet | null> {
  const { data: result, error } = await supabase.from('mtruck_fleets').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFleet(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_fleets').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FLEET TRUCKS ───
export async function getFleetTrucks(fleetId: string): Promise<FleetTruck[]> {
  const { data, error } = await supabase.from('mtruck_fleet_trucks').select('*').eq('fleet_id', fleetId);
  if (error) return handleError(error, []); return data || [];
}
export async function addTruckToFleet(data: Partial<FleetTruck>): Promise<FleetTruck | null> {
  const { data: result, error } = await supabase.from('mtruck_fleet_trucks').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function removeTruckFromFleet(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_fleet_trucks').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── HAUL TYPES ───
export async function getHaulTypes(): Promise<HaulType[]> {
  const { data, error } = await supabase.from('mtruck_haul_types').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getHaulTypeById(id: string): Promise<HaulType | null> {
  const { data, error } = await supabase.from('mtruck_haul_types').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createHaulType(data: Partial<HaulType>): Promise<HaulType | null> {
  const { data: result, error } = await supabase.from('mtruck_haul_types').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateHaulType(id: string, data: Partial<HaulType>): Promise<HaulType | null> {
  const { data: result, error } = await supabase.from('mtruck_haul_types').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteHaulType(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_haul_types').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FREIGHT REQUESTS ───
export async function getFreightRequests(): Promise<FreightRequest[]> {
  const { data, error } = await supabase.from('mtruck_freight_requests').select('*').eq('status', 'pending');
  if (error) return handleError(error, []); return data || [];
}
export async function getFreightRequestById(id: string): Promise<FreightRequest | null> {
  const { data, error } = await supabase.from('mtruck_freight_requests').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getMyFreightRequests(shipperId: string): Promise<FreightRequest[]> {
  const { data, error } = await supabase.from('mtruck_freight_requests').select('*').eq('shipper_id', shipperId);
  if (error) return handleError(error, []); return data || [];
}
export async function createFreightRequest(data: Partial<FreightRequest>): Promise<FreightRequest | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_requests').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFreightRequest(id: string, data: Partial<FreightRequest>): Promise<FreightRequest | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_requests').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFreightRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_freight_requests').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FREIGHT BIDS ───
export async function getFreightBids(requestId: string): Promise<FreightBid[]> {
  const { data, error } = await supabase.from('mtruck_freight_bids').select('*').eq('freight_request_id', requestId);
  if (error) return handleError(error, []); return data || [];
}
export async function getFreightBidById(id: string): Promise<FreightBid | null> {
  const { data, error } = await supabase.from('mtruck_freight_bids').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createFreightBid(data: Partial<FreightBid>): Promise<FreightBid | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_bids').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFreightBid(id: string, data: Partial<FreightBid>): Promise<FreightBid | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_bids').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFreightBid(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_freight_bids').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRUCK LOCATIONS ───
export async function getTruckLocations(truckId: string): Promise<TruckLocation[]> {
  const { data, error } = await supabase.from('mtruck_truck_locations').select('*').eq('truck_id', truckId).order('recorded_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function recordTruckLocation(data: Partial<TruckLocation>): Promise<TruckLocation | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_locations').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── TRUCK TELEMETRY ───
export async function getTruckTelemetry(truckId: string): Promise<TruckTelemetry[]> {
  const { data, error } = await supabase.from('mtruck_truck_telemetry').select('*').eq('truck_id', truckId).order('recorded_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function recordTruckTelemetry(data: Partial<TruckTelemetry>): Promise<TruckTelemetry | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_telemetry').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── TRUCK INSPECTIONS ───
export async function getTruckInspections(): Promise<TruckInspection[]> {
  const { data, error } = await supabase.from('mtruck_truck_inspections').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTruckInspectionById(id: string): Promise<TruckInspection | null> {
  const { data, error } = await supabase.from('mtruck_truck_inspections').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getTruckInspectionsByTruck(truckId: string): Promise<TruckInspection[]> {
  const { data, error } = await supabase.from('mtruck_truck_inspections').select('*').eq('truck_id', truckId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTruckInspection(data: Partial<TruckInspection>): Promise<TruckInspection | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_inspections').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruckInspection(id: string, data: Partial<TruckInspection>): Promise<TruckInspection | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_inspections').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruckInspection(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_truck_inspections').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRUCK DOCUMENTS ───
export async function getTruckDocuments(truckId: string): Promise<TruckDocument[]> {
  const { data, error } = await supabase.from('mtruck_truck_documents').select('*').eq('truck_id', truckId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTruckDocument(data: Partial<TruckDocument>): Promise<TruckDocument | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_documents').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruckDocument(id: string, data: Partial<TruckDocument>): Promise<TruckDocument | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_documents').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruckDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_truck_documents').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CUSTOMS CLEARANCE ───
export async function getCustomsClearances(): Promise<CustomsClearance[]> {
  const { data, error } = await supabase.from('mtruck_customs_clearance').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getCustomsClearanceById(id: string): Promise<CustomsClearance | null> {
  const { data, error } = await supabase.from('mtruck_customs_clearance').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getFreightCustomsClearance(freightId: string): Promise<CustomsClearance[]> {
  const { data, error } = await supabase.from('mtruck_customs_clearance').select('*').eq('freight_id', freightId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCustomsClearance(data: Partial<CustomsClearance>): Promise<CustomsClearance | null> {
  const { data: result, error } = await supabase.from('mtruck_customs_clearance').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCustomsClearance(id: string, data: Partial<CustomsClearance>): Promise<CustomsClearance | null> {
  const { data: result, error } = await supabase.from('mtruck_customs_clearance').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCustomsClearance(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_customs_clearance').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── DRIVER FREIGHT JOBS ───
export async function getDriverFreightJobs(driverId: string): Promise<DriverFreightJob[]> {
  const { data, error } = await supabase.from('mtruck_driver_freight_jobs').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function getDriverFreightJobById(id: string): Promise<DriverFreightJob | null> {
  const { data, error } = await supabase.from('mtruck_driver_freight_jobs').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createDriverFreightJob(data: Partial<DriverFreightJob>): Promise<DriverFreightJob | null> {
  const { data: result, error } = await supabase.from('mtruck_driver_freight_jobs').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateDriverFreightJob(id: string, data: Partial<DriverFreightJob>): Promise<DriverFreightJob | null> {
  const { data: result, error } = await supabase.from('mtruck_driver_freight_jobs').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteDriverFreightJob(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_driver_freight_jobs').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── SHIPPER PROFILES ───
export async function getShipperProfiles(): Promise<ShipperProfile[]> {
  const { data, error } = await supabase.from('mtruck_shipper_profiles').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getShipperProfileById(id: string): Promise<ShipperProfile | null> {
  const { data, error } = await supabase.from('mtruck_shipper_profiles').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getShipperProfileByUserId(userId: string): Promise<ShipperProfile | null> {
  const { data, error } = await supabase.from('mtruck_shipper_profiles').select('*').eq('user_id', userId).single();
  if (error) return handleError(error, null); return data;
}
export async function createShipperProfile(data: Partial<ShipperProfile>): Promise<ShipperProfile | null> {
  const { data: result, error } = await supabase.from('mtruck_shipper_profiles').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateShipperProfile(id: string, data: Partial<ShipperProfile>): Promise<ShipperProfile | null> {
  const { data: result, error } = await supabase.from('mtruck_shipper_profiles').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteShipperProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_shipper_profiles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRUCK OWNER PROFILES ───
export async function getTruckOwnerProfiles(): Promise<TruckOwnerProfile[]> {
  const { data, error } = await supabase.from('mtruck_truck_owner_profiles').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTruckOwnerProfileById(id: string): Promise<TruckOwnerProfile | null> {
  const { data, error } = await supabase.from('mtruck_truck_owner_profiles').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getTruckOwnerProfileByUserId(userId: string): Promise<TruckOwnerProfile | null> {
  const { data, error } = await supabase.from('mtruck_truck_owner_profiles').select('*').eq('user_id', userId).single();
  if (error) return handleError(error, null); return data;
}
export async function createTruckOwnerProfile(data: Partial<TruckOwnerProfile>): Promise<TruckOwnerProfile | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_owner_profiles').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruckOwnerProfile(id: string, data: Partial<TruckOwnerProfile>): Promise<TruckOwnerProfile | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_owner_profiles').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruckOwnerProfile(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_truck_owner_profiles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FREIGHT TRACKING ───
export async function getFreightTracking(freightId: string): Promise<FreightTracking[]> {
  const { data, error } = await supabase.from('mtruck_freight_tracking').select('*').eq('freight_id', freightId).order('timestamp', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createFreightTracking(data: Partial<FreightTracking>): Promise<FreightTracking | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_tracking').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── ROUTES ───
export async function getRoutes(): Promise<Route[]> {
  const { data, error } = await supabase.from('mtruck_routes').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getRouteById(id: string): Promise<Route | null> {
  const { data, error } = await supabase.from('mtruck_routes').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createRoute(data: Partial<Route>): Promise<Route | null> {
  const { data: result, error } = await supabase.from('mtruck_routes').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRoute(id: string, data: Partial<Route>): Promise<Route | null> {
  const { data: result, error } = await supabase.from('mtruck_routes').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRoute(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_routes').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── ROUTE STOPS ───
export async function getRouteStops(routeId: string): Promise<RouteStop[]> {
  const { data, error } = await supabase.from('mtruck_route_stops').select('*').eq('route_id', routeId).order('stop_number');
  if (error) return handleError(error, []); return data || [];
}
export async function createRouteStop(data: Partial<RouteStop>): Promise<RouteStop | null> {
  const { data: result, error } = await supabase.from('mtruck_route_stops').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRouteStop(id: string, data: Partial<RouteStop>): Promise<RouteStop | null> {
  const { data: result, error } = await supabase.from('mtruck_route_stops').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRouteStop(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_route_stops').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── LOADS ───
export async function getLoads(): Promise<Load[]> {
  const { data, error } = await supabase.from('mtruck_loads').select('*').eq('status', 'available');
  if (error) return handleError(error, []); return data || [];
}
export async function getLoadById(id: string): Promise<Load | null> {
  const { data, error } = await supabase.from('mtruck_loads').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getShipperLoads(shipperId: string): Promise<Load[]> {
  const { data, error } = await supabase.from('mtruck_loads').select('*').eq('shipper_id', shipperId);
  if (error) return handleError(error, []); return data || [];
}
export async function createLoad(data: Partial<Load>): Promise<Load | null> {
  const { data: result, error } = await supabase.from('mtruck_loads').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateLoad(id: string, data: Partial<Load>): Promise<Load | null> {
  const { data: result, error } = await supabase.from('mtruck_loads').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteLoad(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_loads').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── LOAD BOOKINGS ───
export async function getLoadBookings(): Promise<LoadBooking[]> {
  const { data, error } = await supabase.from('mtruck_load_bookings').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getLoadBookingById(id: string): Promise<LoadBooking | null> {
  const { data, error } = await supabase.from('mtruck_load_bookings').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createLoadBooking(data: Partial<LoadBooking>): Promise<LoadBooking | null> {
  const { data: result, error } = await supabase.from('mtruck_load_bookings').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateLoadBooking(id: string, data: Partial<LoadBooking>): Promise<LoadBooking | null> {
  const { data: result, error } = await supabase.from('mtruck_load_bookings').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteLoadBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_load_bookings').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FREIGHT INVOICES ───
export async function getFreightInvoices(): Promise<FreightInvoice[]> {
  const { data, error } = await supabase.from('mtruck_freight_invoices').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getFreightInvoiceById(id: string): Promise<FreightInvoice | null> {
  const { data, error } = await supabase.from('mtruck_freight_invoices').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getFreightFreightInvoices(freightId: string): Promise<FreightInvoice[]> {
  const { data, error } = await supabase.from('mtruck_freight_invoices').select('*').eq('freight_id', freightId);
  if (error) return handleError(error, []); return data || [];
}
export async function createFreightInvoice(data: Partial<FreightInvoice>): Promise<FreightInvoice | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_invoices').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFreightInvoice(id: string, data: Partial<FreightInvoice>): Promise<FreightInvoice | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_invoices').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFreightInvoice(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_freight_invoices').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRUCK MAINTENANCE ───
export async function getTruckMaintenances(): Promise<TruckMaintenance[]> {
  const { data, error } = await supabase.from('mtruck_truck_maintenance').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTruckMaintenanceById(id: string): Promise<TruckMaintenance | null> {
  const { data, error } = await supabase.from('mtruck_truck_maintenance').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getTruckMaintenancesByTruck(truckId: string): Promise<TruckMaintenance[]> {
  const { data, error } = await supabase.from('mtruck_truck_maintenance').select('*').eq('truck_id', truckId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTruckMaintenance(data: Partial<TruckMaintenance>): Promise<TruckMaintenance | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_maintenance').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruckMaintenance(id: string, data: Partial<TruckMaintenance>): Promise<TruckMaintenance | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_maintenance').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruckMaintenance(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_truck_maintenance').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── DRIVER PAYMENTS ───
export async function getMTruckDriverPayments(driverId: string): Promise<DriverPayment[]> {
  const { data, error } = await supabase.from('mtruck_driver_payments').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function createMTruckDriverPayment(data: Partial<DriverPayment>): Promise<DriverPayment | null> {
  const { data: result, error } = await supabase.from('mtruck_driver_payments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── DRIVER EARNINGS ───
export async function getMTruckDriverEarnings(driverId: string): Promise<DriverEarning[]> {
  const { data, error } = await supabase.from('mtruck_driver_earnings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createMTruckDriverEarning(data: Partial<DriverEarning>): Promise<DriverEarning | null> {
  const { data: result, error } = await supabase.from('mtruck_driver_earnings').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── FREIGHT REVIEWS ───
export async function getFreightReviews(freightId: string): Promise<FreightReview[]> {
  const { data, error } = await supabase.from('mtruck_freight_reviews').select('*').eq('freight_id', freightId);
  if (error) return handleError(error, []); return data || [];
}
export async function createFreightReview(data: Partial<FreightReview>): Promise<FreightReview | null> {
  const { data: result, error } = await supabase.from('mtruck_freight_reviews').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── TRUCK AVAILABILITY ───
export async function getTruckAvailabilities(): Promise<TruckAvailability[]> {
  const { data, error } = await supabase.from('mtruck_truck_availability').select('*').eq('status', 'available');
  if (error) return handleError(error, []); return data || [];
}
export async function getTruckAvailabilityById(id: string): Promise<TruckAvailability | null> {
  const { data, error } = await supabase.from('mtruck_truck_availability').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTruckAvailability(data: Partial<TruckAvailability>): Promise<TruckAvailability | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_availability').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTruckAvailability(id: string, data: Partial<TruckAvailability>): Promise<TruckAvailability | null> {
  const { data: result, error } = await supabase.from('mtruck_truck_availability').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTruckAvailability(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtruck_truck_availability').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FARE ESTIMATE ───
export async function estimateFreight(pickup: string, dropoff: string, weight?: number, haulTypeId?: string): Promise<number> {
  const haulType = haulTypeId ? await getHaulTypeById(haulTypeId) : null;
  const base = haulType?.base_rate || 100;
  const perKm = haulType?.per_km_rate || 50;
  return base + (perKm * 10);
}

// ─── MTRUCK OPERATIONS ───
export async function mtruckOperation(type: string, data?: any): Promise<any> {
  try {
    const { data: result, error } = await supabase.functions.invoke('mtruck-operations', { body: { type, data } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

// ─── STATS ───
export async function getMTruckStats(): Promise<any> {
  const { count: trucks } = await supabase.from('mtruck_trucks').select('*', { count: 'exact', head: true });
  const { count: freights } = await supabase.from('mtruck_freight').select('*', { count: 'exact', head: true });
  const { count: fleets } = await supabase.from('mtruck_fleets').select('*', { count: 'exact', head: true });
  return { trucks, freights, fleets };
}
