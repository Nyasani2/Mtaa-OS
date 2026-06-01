// lib/mtaxi/types/index.ts

// ===== NEW TYPES (used by new components) =====
export interface MtaxiRide {
  id: string;
  passenger_id: string;
  driver_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address?: string;
  dropoff_address?: string;
  ride_type: VehicleType;
  payment_method: PaymentMethod;
  status: RideStatus;
  fare_estimate?: number;
  final_fare?: number;
  distance_km?: number;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  driver?: {
    id: string;
    full_name: string;
    phone?: string;
    vehicle_plate?: string;
    vehicle_type?: string;
    rating?: number;
    photo_url?: string;
  };
}

export interface MtaxiDriver {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color?: string;
  license_number?: string;
  rating: number;
  total_trips: number;
  earnings_today: number;
  earnings_week: number;
  is_online: boolean;
  current_lat?: number;
  current_lng?: number;
  photo_url?: string;
  created_at: string;
}

export interface CarpoolTrip {
  id: string;
  driver_id: string;
  route_from: string;
  route_to: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  vehicle_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CarpoolBooking {
  id: string;
  trip_id: string;
  rider_id: string;
  seats_booked: number;
  total_amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  trip?: CarpoolTrip;
}

export type VehicleType = "economy" | "premium" | "xl" | "truck" | "boda" | "boda_xl" | "boda_delivery" | "tuk_tuk" | "sedan" | "van";
export type RideStatus = "searching" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "wallet" | "cash" | "card";

// ===== BACKWARD-COMPATIBLE TYPES (used by existing components) =====
export interface NearbyDriver {
  driver_user_id: string;
  distance_km: number;
  is_favorite: boolean;
  reputation_score: number;
  rank_score: number;
  vehicle?: {
    type?: string;
    color?: string;
    plate_number?: string;
  };
}

export interface FareEstimate {
  distance_km: number;
  base_fare: number;
  distance_fare?: number;
  time_fare?: number;
  surge_multiplier: number;
  total_fare: number;
  vehicle_type?: string;
  currency: string;
}

export interface Ride {
  id: string;
  ride_code: string;
  status: string;
  pickup_location: string | { address?: string };
  dropoff_location: string | { address?: string };
  final_fare?: number;
  estimated_fare?: number;
  created_at: string;
  rating_driver?: number;
}
// lib/mtaxi/types/index.ts — APPENDED INSPECTION TYPES
// Add these to your existing types file

export interface MtaxiVehicle {
  id: string;
  driver_id: string;
  vehicle_type: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  plate_number: string;
  capacity?: number;
  is_active: boolean;
  inspection_status?: "pending" | "passed" | "failed" | "approved" | "rejected";
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface MtaxiGarage {
  id: string;
  name?: string;
  garage_type?: string;
  owner_name?: string;
  phone?: string;
  location?: string;
  lat?: number;
  lng?: number;
  application_fee_paid?: boolean;
  approved?: boolean;
  created_at?: string;
}

export interface MtaxiInspectionOrder {
  id: string;
  vehicle_id: string;
  garage_id?: string;
  driver_id: string;
  status: "pending" | "paid" | "in_progress" | "passed" | "failed" | "cancelled";
  inspection_fee: number;
  payment_status: "unpaid" | "paid" | "refunded";
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  vehicle?: MtaxiVehicle;
  garage?: MtaxiGarage;
}

export interface MtaxiVehicleInspection {
  id: string;
  vehicle_id: string;
  inspector_id: string;
  fire_extinguisher?: boolean;
  first_aid_kit?: boolean;
  triangles?: boolean;
  tyres?: boolean;
  lights?: boolean;
  brakes?: boolean;
  result?: "pass" | "fail";
  notes?: string;
  created_at: string;
}

export interface MtaxiInspectionPayment {
  id: string;
  user_id: string;
  vehicle_id: string;
  garage_id?: string;
  amount: number;
  payment_status: string;
  qr_code?: string;
  created_at: string;
}
