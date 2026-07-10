export interface Truck {
  id: string;
  registration: string;
  status: "active" | "idle" | "maintenance" | "offline";
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
  urgency: "low" | "medium" | "high";
  status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";
  assignedTruckId?: string;
  createdAt: string;
  eta?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: "on_duty" | "off_duty" | "resting";
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
  type: "maintenance" | "delay" | "fuel" | "safety" | "customs";
  message: string;
  truckId?: string;
  severity: "low" | "medium" | "high" | "critical";
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
  type: "oil_change" | "tire" | "brake" | "engine" | "inspection" | "other";
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: "scheduled" | "overdue" | "completed";
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
  urgency: "low" | "medium" | "high";
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
  type: "manifest" | "permit" | "invoice" | "insurance" | "license";
  name: string;
  url: string;
  uploadedAt: string;
  expiryDate?: string;
}
