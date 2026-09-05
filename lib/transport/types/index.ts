// lib/transport/types/index.ts
// Unified transport types for MTAA OS V10

export type ServiceType = 'car' | 'boda' | 'truck';

export type TransportVehicleType =
  | 'economy' | 'comfort' | 'premium' | 'xl'
  | 'boda' | 'boda_xl' | 'boda_delivery' | 'tuk_tuk';

export type RideStatus =
  | 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';

export type PaymentMethod = 'wallet' | 'mpesa' | 'cash' | 'card';

export interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface TransportDriver {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  rating?: number;
  photo_url?: string;
  current_lat?: number;
  current_lng?: number;
  is_online?: boolean;
}

export interface TransportRide {
  id: string;
  passenger_id: string;
  driver_id?: string;
  service_type: ServiceType;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  vehicle_type: TransportVehicleType;
  payment_method: PaymentMethod;
  status: RideStatus;
  fare_estimate?: number;
  final_fare?: number;
  distance_km?: number;
  duration_minutes?: number;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  driver?: TransportDriver;
}

export interface VehicleTier {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  per_km_rate: number;
  per_min_rate: number;
  icon: string;
  color: string;
  service_type: ServiceType;
  capacity?: number;
  etaMinutes?: number;
}

export interface FareEstimate {
  amount: number;
  formatted: string;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  currency: string;
}

export interface DriverAvailability {
  available: boolean;
  count: number;
  etaMinutes?: number;
  message: string;
}

export interface RecentPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  service_type?: ServiceType;
  timestamp: number;
}

export interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  requiresBalance?: boolean;
}

export interface ScheduleRideParams {
  serviceType: ServiceType;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  vehicleType: TransportVehicleType;
  paymentMethod: PaymentMethod;
  scheduledAt: string;
  estimatedFare: number;
  currency: string;
}

// === MERGED FROM types-additions.ts ===
// === CORRECTED CreateRidePayload from ride.service.ts ===
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

export interface FareBreakdown {
  base: number;
  distanceFare: number;
  timeFare: number;
  surge: number;
  total: number;
}

export interface HaulRequest {
  id?: string;
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
  status?: string;
}

export interface TruckCompany {
  id?: string;
  owner_id: string;
  company_name: string;
  registration_number?: string;
  kra_pin?: string;
  email: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  county?: string;
  country?: string;
  status?: string;
}
// === NearbyDriver (reconstructed) ===
export interface NearbyDriver {
  id: string;
  name: string;
  phone?: string;
  vehicle_type?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  eta?: number;
  rating?: number;
  is_available?: boolean;
  avatar_url?: string;
  plate_number?: string;
}
