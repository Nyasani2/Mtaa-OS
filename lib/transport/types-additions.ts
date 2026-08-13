// Append to lib/transport/types.ts
export interface FareEstimate { id: string; origin: LocationPoint; destination: LocationPoint; distanceKm: number; estimatedTimeMinutes: number; fare: number; currency: string; serviceType: ServiceType; vehicleType?: TransportVehicleType; surgeMultiplier?: number; created_at: string; }
export interface TransportRide { id: string; rider_id: string; driver_id?: string; vehicle_id?: string; status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'; origin: LocationPoint; destination: LocationPoint; fare: number; currency: string; distance_km: number; estimated_time_min: number; actual_time_min?: number; service_type: ServiceType; payment_method: PaymentMethod; created_at: string; updated_at: string; }
export interface RecentPlace { id: string; user_id: string; name: string; address: string; location: LocationPoint; visit_count: number; last_visited_at: string; }
export interface CreateRidePayload { origin: LocationPoint; destination: LocationPoint; service_type: ServiceType; vehicle_type?: TransportVehicleType; payment_method: PaymentMethod; notes?: string; }
export interface NearbyDriver { id: string; user_id: string; vehicle_id: string; location: LocationPoint; distance_km: number; eta_minutes: number; rating: number; vehicle_type: TransportVehicleType; is_available: boolean; }
export interface DriverAvailability { id: string; driver_id: string; is_online: boolean; current_location?: LocationPoint; vehicle_id?: string; last_updated: string; }
export interface LocationPoint { lat: number; lng: number; address?: string; name?: string; }
export type ServiceType = 'standard' | 'premium' | 'shared' | 'delivery' | 'luxury';
export type TransportVehicleType = 'sedan' | 'suv' | 'van' | 'truck' | 'motorcycle' | 'boda';
export type PaymentMethod = 'cash' | 'wallet' | 'card' | 'mpesa' | 'crypto';
export type VehicleTier = 'economy' | 'comfort' | 'premium' | 'luxury';
