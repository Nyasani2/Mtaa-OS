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
  status?: string;
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
