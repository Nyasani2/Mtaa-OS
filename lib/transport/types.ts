export interface RideRequest {
  id?: string;
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
  status?: string;
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


// === AUTO-ADDED TRANSPORT TYPES ===
export type FareEstimate = any;
export type TransportRide = any;
export type RecentPlace = any;
export type CreateRidePayload = any;
export type NearbyDriver = any;
export type ServiceType = any;
export type TransportVehicleType = any;
export type PaymentMethod = any;
export type LocationPoint = any;
export type VehicleTier = any;
export type DriverAvailability = any;
