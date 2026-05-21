export type VehicleType = "boda" | "tuk_tuk" | "sedan" | "van" | "truck";

export type RideStatus = "requested" | "accepted" | "driver_arrived" | "in_progress" | "completed" | "cancelled";
export type RideType = "instant" | "scheduled" | "carpool";

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface Ride {
  id: string;
  created_at: string;
  updated_at: string;
  ride_code: string;
  rider_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  pickup_location: GeoLocation;
  dropoff_location: GeoLocation;
  ride_type: RideType;
  estimated_fare: number;
  final_fare: number | null;
  surge_multiplier: number | null;
  payment_method_id: string | null;
  status: RideStatus;
  accepted_at: string | null;
  driver_arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  rating_rider: number | null;
  rating_driver: number | null;
  review_rider: string | null;
  review_driver: string | null;
  route_taken: any;
  metadata: any;
  driver?: DriverProfile;
  vehicle?: Vehicle;
}

export interface DriverProfile {
  id: string;
  total_rides: number;
  total_earnings: number;
  status: "online" | "offline" | "busy";
  rating: number;
  reputation_score: number;
  current_lat: number | null;
  current_lng: number | null;
}

export interface Vehicle {
  id: string;
  user_id: string;
  type: VehicleType;
  plate_number: string;
  color: string;
  inspection_status: "pending" | "approved" | "rejected";
}

export interface NearbyDriver {
  driver_user_id: string;
  lat: number;
  lng: number;
  distance_km: number;
  is_favorite: boolean;
  vehicle: Vehicle | null;
  reputation_score: number;
  rank_score: number;
}

export interface RideRequest {
  id: string;
  ride_id: string;
  driver_id: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
  expires_at: string;
}

export interface CarpoolTrip {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  origin: GeoLocation;
  destination: GeoLocation;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: "open" | "full" | "departed" | "completed" | "cancelled";
}

export interface CarpoolBooking {
  id: string;
  trip_id: string;
  rider_id: string;
  seats_booked: number;
  total_amount: number;
  status: "confirmed" | "cancelled" | "completed";
}

export interface FareEstimate {
  distance_km: number;
  base_fare: number;
  surge_multiplier: number;
  total_fare: number;
  vehicle_type: VehicleType;
  currency: "KES";
}

export interface FavoriteDriver {
  driver_id: string;
  added_at: string;
  driver?: {
    full_name: string;
    avatar_url: string;
    vehicle: Vehicle;
  };
}
