// ============================================================
// MTAA OS V10 - MTaxi Service
// 47 tables: mtaxi_rides, mtaxi_drivers, mtaxi_vehicles, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Ride {
  id: string; passenger_id: string; driver_id?: string; vehicle_id?: string;
  pickup_location: string; dropoff_location: string; pickup_lat?: number; pickup_lng?: number;
  dropoff_lat?: number; dropoff_lng?: number; fare_estimate?: number; final_fare?: number;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  ride_type?: string; scheduled_at?: string; completed_at?: string; created_at?: string;
}

export interface Driver {
  id: string; user_id: string; license_number: string; vehicle_id?: string;
  rating?: number; total_rides?: number; status: 'active' | 'inactive' | 'suspended';
  current_location?: string; current_lat?: number; current_lng?: number; created_at?: string;
}

export interface Vehicle {
  id: string; driver_id?: string; make: string; model: string; year?: number;
  license_plate: string; color?: string; type?: string; capacity?: number;
  inspection_status?: string; insurance_expiry?: string; status: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
}

export interface VehicleType {
  id: string; name: string; description?: string; base_fare?: number; per_km_rate?: number;
  per_minute_rate?: number; capacity?: number; image_url?: string; status?: string;
}

export interface FareEstimate {
  id: string; pickup_location: string; dropoff_location: string; vehicle_type_id?: string;
  estimated_distance?: number; estimated_duration?: number; estimated_fare: number; created_at?: string;
}

export interface Inspection {
  id: string; vehicle_id: string; inspector_id?: string; inspection_date?: string;
  status: 'pending' | 'passed' | 'failed'; notes?: string; next_due_date?: string; created_at?: string;
}

export interface Carpool {
  id: string; driver_id: string; vehicle_id: string; route?: string; max_passengers?: number;
  departure_time?: string; status: 'open' | 'full' | 'completed' | 'cancelled'; created_at?: string;
}

export interface CarpoolPassenger {
  id: string; carpool_id: string; passenger_id: string; pickup_location?: string;
  dropoff_location?: string; status?: string; joined_at?: string;
}

export interface DriverLocation {
  id: string; driver_id: string; lat: number; lng: number; recorded_at?: string;
}

export interface DriverDocument {
  id: string; driver_id: string; document_type: string; document_url?: string;
  verification_status?: string; uploaded_at?: string;
}

export interface DriverPayment {
  id: string; driver_id: string; amount: number; type: string; status?: string; created_at?: string;
}

export interface DriverEarning {
  id: string; driver_id: string; ride_id?: string; amount: number; commission?: number;
  net_amount: number; status?: string; created_at?: string;
}

export interface RideReview {
  id: string; ride_id: string; reviewer_id: string; reviewee_id: string; rating: number;
  comment?: string; created_at?: string;
}

export interface RideCancellation {
  id: string; ride_id: string; cancelled_by: string; reason?: string; cancelled_at?: string;
}

export interface NearbyDriver {
  id: string; driver_id: string; lat: number; lng: number; distance?: number; available: boolean;
  updated_at?: string;
}

export interface RideRequest {
  id: string; passenger_id: string; pickup_location: string; dropoff_location: string;
  vehicle_type_id?: string; status: 'pending' | 'accepted' | 'expired' | 'cancelled'; created_at?: string;
}

export interface DriverOnboarding {
  id: string; user_id: string; step: string; status: 'in_progress' | 'completed'; created_at?: string;
}

export interface VehicleApproval {
  id: string; vehicle_id: string; approved_by?: string; status: 'pending' | 'approved' | 'rejected';
  notes?: string; created_at?: string;
}

export interface InspectionPayment {
  id: string; inspection_id: string; amount: number; status?: string; paid_at?: string;
}

export interface InspectionComplete {
  id: string; inspection_id: string; completed_by?: string; result?: string; completed_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[MTaxiService]', err?.message || err);
  return fallback;
}

// ─── RIDES ───
export async function getRides(): Promise<Ride[]> {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRideById(id: string): Promise<Ride | null> {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPassengerRides(passengerId: string): Promise<Ride[]> {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').eq('passenger_id', passengerId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getDriverRides(driverId: string): Promise<Ride[]> {
  const { data, error } = await supabase.from('mtaxi_rides').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createRide(data: Partial<Ride>): Promise<Ride | null> {
  const { data: result, error } = await supabase.from('mtaxi_rides').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRide(id: string, data: Partial<Ride>): Promise<Ride | null> {
  const { data: result, error } = await supabase.from('mtaxi_rides').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRide(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_rides').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}
export async function cancelRide(id: string, reason?: string): Promise<Ride | null> {
  return updateRide(id, { status: 'cancelled' });
}

// ─── DRIVERS ───
export async function getDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from('mtaxi_drivers').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getDriverById(id: string): Promise<Driver | null> {
  const { data, error } = await supabase.from('mtaxi_drivers').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getDriverByUserId(userId: string): Promise<Driver | null> {
  const { data, error } = await supabase.from('mtaxi_drivers').select('*').eq('user_id', userId).single();
  if (error) return handleError(error, null); return data;
}
export async function createDriver(data: Partial<Driver>): Promise<Driver | null> {
  const { data: result, error } = await supabase.from('mtaxi_drivers').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver | null> {
  const { data: result, error } = await supabase.from('mtaxi_drivers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteDriver(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_drivers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}
export async function checkDriverAvailability(driverId: string): Promise<boolean> {
  const driver = await getDriverById(driverId);
  return driver?.status === 'active';
}

// ─── VEHICLES ───
export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('mtaxi_vehicles').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase.from('mtaxi_vehicles').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getDriverVehicles(driverId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('mtaxi_vehicles').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function getAvailableVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('mtaxi_vehicles').select('*').eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicles').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicles').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteVehicle(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_vehicles').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── VEHICLE TYPES ───
export async function getVehicleTypes(): Promise<VehicleType[]> {
  const { data, error } = await supabase.from('mtaxi_vehicle_types').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getVehicleTypeById(id: string): Promise<VehicleType | null> {
  const { data, error } = await supabase.from('mtaxi_vehicle_types').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createVehicleType(data: Partial<VehicleType>): Promise<VehicleType | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicle_types').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateVehicleType(id: string, data: Partial<VehicleType>): Promise<VehicleType | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicle_types').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteVehicleType(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_vehicle_types').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── FARE ESTIMATES ───
export async function getFareEstimates(): Promise<FareEstimate[]> {
  const { data, error } = await supabase.from('mtaxi_fare_estimates').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getFareEstimateById(id: string): Promise<FareEstimate | null> {
  const { data, error } = await supabase.from('mtaxi_fare_estimates').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getRideFareEstimate(pickup: string, dropoff: string, vehicleTypeId?: string): Promise<FareEstimate | null> {
  const { data, error } = await supabase.from('mtaxi_fare_estimates')
    .select('*').eq('pickup_location', pickup).eq('dropoff_location', dropoff).maybeSingle();
  if (error) return handleError(error, null); return data;
}
export async function createFareEstimate(data: Partial<FareEstimate>): Promise<FareEstimate | null> {
  const { data: result, error } = await supabase.from('mtaxi_fare_estimates').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateFareEstimate(id: string, data: Partial<FareEstimate>): Promise<FareEstimate | null> {
  const { data: result, error } = await supabase.from('mtaxi_fare_estimates').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteFareEstimate(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_fare_estimates').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── INSPECTIONS ───
export async function getInspections(): Promise<Inspection[]> {
  const { data, error } = await supabase.from('mtaxi_inspections').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getInspectionById(id: string): Promise<Inspection | null> {
  const { data, error } = await supabase.from('mtaxi_inspections').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getVehicleInspections(vehicleId: string): Promise<Inspection[]> {
  const { data, error } = await supabase.from('mtaxi_inspections').select('*').eq('vehicle_id', vehicleId);
  if (error) return handleError(error, []); return data || [];
}
export async function createInspection(data: Partial<Inspection>): Promise<Inspection | null> {
  const { data: result, error } = await supabase.from('mtaxi_inspections').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateInspection(id: string, data: Partial<Inspection>): Promise<Inspection | null> {
  const { data: result, error } = await supabase.from('mtaxi_inspections').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteInspection(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_inspections').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CARPOOL ───
export async function getCarpools(): Promise<Carpool[]> {
  const { data, error } = await supabase.from('mtaxi_carpools').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getCarpoolById(id: string): Promise<Carpool | null> {
  const { data, error } = await supabase.from('mtaxi_carpools').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getDriverCarpools(driverId: string): Promise<Carpool[]> {
  const { data, error } = await supabase.from('mtaxi_carpools').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCarpool(data: Partial<Carpool>): Promise<Carpool | null> {
  const { data: result, error } = await supabase.from('mtaxi_carpools').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCarpool(id: string, data: Partial<Carpool>): Promise<Carpool | null> {
  const { data: result, error } = await supabase.from('mtaxi_carpools').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCarpool(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_carpools').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CARPOOL PASSENGERS ───
export async function getCarpoolPassengers(carpoolId: string): Promise<CarpoolPassenger[]> {
  const { data, error } = await supabase.from('mtaxi_carpool_passengers').select('*').eq('carpool_id', carpoolId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCarpoolPassenger(data: Partial<CarpoolPassenger>): Promise<CarpoolPassenger | null> {
  const { data: result, error } = await supabase.from('mtaxi_carpool_passengers').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCarpoolPassenger(id: string, data: Partial<CarpoolPassenger>): Promise<CarpoolPassenger | null> {
  const { data: result, error } = await supabase.from('mtaxi_carpool_passengers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCarpoolPassenger(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_carpool_passengers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── DRIVER LOCATIONS ───
export async function getDriverLocations(driverId: string): Promise<DriverLocation[]> {
  const { data, error } = await supabase.from('mtaxi_driver_locations').select('*').eq('driver_id', driverId).order('recorded_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function updateDriverLocation(driverId: string, lat: number, lng: number): Promise<DriverLocation | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_locations').insert({ driver_id: driverId, lat, lng }).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── DRIVER DOCUMENTS ───
export async function getDriverDocuments(driverId: string): Promise<DriverDocument[]> {
  const { data, error } = await supabase.from('mtaxi_driver_documents').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function createDriverDocument(data: Partial<DriverDocument>): Promise<DriverDocument | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_documents').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateDriverDocument(id: string, data: Partial<DriverDocument>): Promise<DriverDocument | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_documents').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteDriverDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_driver_documents').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── DRIVER PAYMENTS ───
export async function getDriverPayments(driverId: string): Promise<DriverPayment[]> {
  const { data, error } = await supabase.from('mtaxi_driver_payments').select('*').eq('driver_id', driverId);
  if (error) return handleError(error, []); return data || [];
}
export async function createDriverPayment(data: Partial<DriverPayment>): Promise<DriverPayment | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_payments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── DRIVER EARNINGS ───
export async function getDriverEarnings(driverId: string): Promise<DriverEarning[]> {
  const { data, error } = await supabase.from('mtaxi_driver_earnings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createDriverEarning(data: Partial<DriverEarning>): Promise<DriverEarning | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_earnings').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── RIDE REVIEWS ───
export async function getRideReviews(rideId: string): Promise<RideReview[]> {
  const { data, error } = await supabase.from('mtaxi_ride_reviews').select('*').eq('ride_id', rideId);
  if (error) return handleError(error, []); return data || [];
}
export async function createRideReview(data: Partial<RideReview>): Promise<RideReview | null> {
  const { data: result, error } = await supabase.from('mtaxi_ride_reviews').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── RIDE CANCELLATIONS ───
export async function getRideCancellations(): Promise<RideCancellation[]> {
  const { data, error } = await supabase.from('mtaxi_ride_cancellations').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function createRideCancellation(data: Partial<RideCancellation>): Promise<RideCancellation | null> {
  const { data: result, error } = await supabase.from('mtaxi_ride_cancellations').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── NEARBY DRIVERS ───
export async function getNearbyDrivers(lat: number, lng: number, radius: number = 5000): Promise<NearbyDriver[]> {
  const { data, error } = await supabase.from('mtaxi_nearby_drivers').select('*').eq('available', true);
  if (error) return handleError(error, []); return data || [];
}

// ─── RIDE REQUESTS ───
export async function getRideRequests(): Promise<RideRequest[]> {
  const { data, error } = await supabase.from('mtaxi_ride_requests').select('*').eq('status', 'pending');
  if (error) return handleError(error, []); return data || [];
}
export async function getRideRequestById(id: string): Promise<RideRequest | null> {
  const { data, error } = await supabase.from('mtaxi_ride_requests').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createRideRequest(data: Partial<RideRequest>): Promise<RideRequest | null> {
  const { data: result, error } = await supabase.from('mtaxi_ride_requests').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRideRequest(id: string, data: Partial<RideRequest>): Promise<RideRequest | null> {
  const { data: result, error } = await supabase.from('mtaxi_ride_requests').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRideRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from('mtaxi_ride_requests').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── DRIVER ONBOARDING ───
export async function getDriverOnboardings(): Promise<DriverOnboarding[]> {
  const { data, error } = await supabase.from('mtaxi_driver_onboarding').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getDriverOnboardingById(id: string): Promise<DriverOnboarding | null> {
  const { data, error } = await supabase.from('mtaxi_driver_onboarding').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createDriverOnboarding(data: Partial<DriverOnboarding>): Promise<DriverOnboarding | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_onboarding').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateDriverOnboarding(id: string, data: Partial<DriverOnboarding>): Promise<DriverOnboarding | null> {
  const { data: result, error } = await supabase.from('mtaxi_driver_onboarding').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── VEHICLE APPROVALS ───
export async function getVehicleApprovals(): Promise<VehicleApproval[]> {
  const { data, error } = await supabase.from('mtaxi_vehicle_approvals').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getVehicleApprovalById(id: string): Promise<VehicleApproval | null> {
  const { data, error } = await supabase.from('mtaxi_vehicle_approvals').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createVehicleApproval(data: Partial<VehicleApproval>): Promise<VehicleApproval | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicle_approvals').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateVehicleApproval(id: string, data: Partial<VehicleApproval>): Promise<VehicleApproval | null> {
  const { data: result, error } = await supabase.from('mtaxi_vehicle_approvals').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── INSPECTION PAYMENTS ───
export async function getInspectionPayments(): Promise<InspectionPayment[]> {
  const { data, error } = await supabase.from('mtaxi_inspection_payments').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function createInspectionPayment(data: Partial<InspectionPayment>): Promise<InspectionPayment | null> {
  const { data: result, error } = await supabase.from('mtaxi_inspection_payments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── INSPECTION COMPLETIONS ───
export async function getInspectionCompletions(): Promise<InspectionComplete[]> {
  const { data, error } = await supabase.from('mtaxi_inspection_completes').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function createInspectionComplete(data: Partial<InspectionComplete>): Promise<InspectionComplete | null> {
  const { data: result, error } = await supabase.from('mtaxi_inspection_completes').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── MTAXI OPERATIONS (stub for edge function calls) ───
export async function mtaxiOperation(type: string, data?: any): Promise<any> {
  try {
    const { data: result, error } = await supabase.functions.invoke('mtaxi-operations', { body: { type, data } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

// ─── STATS ───
export async function getMTaxiStats(): Promise<any> {
  const { count: rides } = await supabase.from('mtaxi_rides').select('*', { count: 'exact', head: true });
  const { count: drivers } = await supabase.from('mtaxi_drivers').select('*', { count: 'exact', head: true });
  const { count: vehicles } = await supabase.from('mtaxi_vehicles').select('*', { count: 'exact', head: true });
  return { rides, drivers, vehicles };
}
