// MTAA MTruck — Types (Merge-Safe Version)
// PRESERVES all existing types exactly as they were
// ADDS new types for Shipper UI + Heavy Equipment

// ============================================
// NEW: Shipper & Heavy Equipment Types
// ============================================

export type TonnageCategory = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'extra_heavy'
  | 'abnormal';

export type HeavyEquipmentType =
  | 'crane'
  | 'excavator'
  | 'bulldozer'
  | 'loader'
  | 'grader'
  | 'roller'
  | 'dump_truck'
  | 'tanker'
  | 'flatbed'
  | 'refrigerated'
  | 'car_carrier'
  | 'tipper'
  | 'lowbed';

export type MtruckJobStatus = 
  | 'draft'
  | 'quoting'
  | 'quoted'
  | 'accepted'
  | 'assigned'
  | 'pickup'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface HeavyEquipment {
  id: string;
  type: HeavyEquipmentType;
  name: string;
  capacity: number;
  dimensions: { length: number; width: number; height: number };
  operatorRequired: boolean;
  ratePerDay: number;
  ratePerHour: number;
  location: { lat: number; lng: number; address: string };
  status: 'available' | 'booked' | 'maintenance' | 'in_use';
  ownerId: string;
  images: string[];
  certifications: string[];
  insuranceExpiry: string;
  createdAt: string;
}

export interface MtruckJob {
  id: string;
  shipperId: string;
  shipperName: string;
  shipperPhone: string;
  cargoType: string;
  tonnageCategory: TonnageCategory;
  weightKg: number;
  dimensions?: { length: number; width: number; height: number };
  hazardous: boolean;
  fragile: boolean;
  temperatureControlled: boolean;
  origin: { lat: number; lng: number; address: string; name: string };
  destination: { lat: number; lng: number; address: string; name: string };
  distanceKm: number;
  pickupDate: string;
  deliveryDeadline: string;
  urgency: 'normal' | 'express' | 'critical';
  quotedRate: number | null;
  finalRate: number | null;
  currency: string;
  assignedTruckId: string | null;
  assignedDriverId: string | null;
  assignedEquipmentIds: string[];
  status: MtruckJobStatus;
  currentLocation: { lat: number; lng: number } | null;
  etaMinutes: number | null;
  createdAt: string;
  quotedAt: string | null;
  acceptedAt: string | null;
  pickupAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  shipperRating: number | null;
  driverRating: number | null;
  shipperReview: string | null;
  driverReview: string | null;
  documents: TruckDocument[];
}

export interface ShipperRequest {
  id: string;
  shipperId: string;
  cargoType: string;
  tonnageCategory: TonnageCategory;
  weightKg: number;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  pickupDate: string;
  deliveryDeadline: string;
  urgency: 'normal' | 'express' | 'critical';
  specialRequirements: string[];
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  quotes: HaulQuote[];
  createdAt: string;
}

export interface HaulQuote {
  id: string;
  requestId: string;
  fleetId: string;
  fleetName: string;
  rate: number;
  currency: string;
  estimatedHours: number;
  truckType: string;
  equipmentIncluded: string[];
  insuranceIncluded: boolean;
  expiryTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  equipmentType: HeavyEquipmentType;
  requesterId: string;
  jobId: string | null;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  rateAgreed: number;
  operatorIncluded: boolean;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  deliveryLocation: { lat: number; lng: number; address: string };
  createdAt: string;
}

// ============================================
// PRESERVED: Existing Types (DO NOT MODIFY)
// These match your existing components exactly
// ============================================

export interface Truck {
  id: string;
  registration: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  driverId?: string;
  currentLocation?: { lat: number; lng: number };
  lastUpdated?: string;
}

export interface Load {
  id: string;
  origin: string;
  destination: string;
  cargo: string;
  weight: number;
  rate: number;
  distance: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  assignedTruckId?: string;
  createdAt: string;
  eta?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'on_duty' | 'off_duty' | 'resting';
  rating: number;
  tripsCompleted: number;
  currentTruckId?: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  fuelEstimate: number;
  tolls: number;
  optimized: boolean;
}

export interface FleetAlert {
  id: string;
  type: 'maintenance' | 'delay' | 'fuel' | 'safety' | 'customs';
  message: string;
  truckId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
}

export interface FuelStation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  price: number;
  currency: string;
  distance: number;
  amenities: string[];
}

export interface MaintenanceRecord {
  id: string;
  truckId: string;
  type: 'oil_change' | 'tire' | 'brake' | 'engine' | 'inspection' | 'other';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'overdue' | 'completed';
  cost?: number;
}

export interface FreightListing {
  id: string;
  shipperId: string;
  origin: string;
  destination: string;
  cargo: string;
  weight: number;
  rate: number;
  distance: number;
  urgency: 'low' | 'medium' | 'high';
  bids: number;
  expiresAt: string;
}

export interface FleetMetrics {
  totalDistance: number;
  fuelEfficiency: number;
  onTimeRate: number;
  costPerMile: number;
  revenuePerTruck: number;
  utilizationRate: number;
}

export interface TruckDocument {
  id: string;
  truckId?: string;
  type: 'manifest' | 'permit' | 'invoice' | 'insurance' | 'license';
  name: string;
  url: string;
  uploadedAt: string;
  expiryDate?: string;
}
