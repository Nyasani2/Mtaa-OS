// MTAA MTruck — Complete Types (39 Tables)
// Generated: 2026-07-09
// Covers: 12 existing + 27 new tables

// ============================================================
// ENUMS
// ============================================================

export type TonnageCategory = 'light' | 'medium' | 'heavy' | 'extra_heavy' | 'abnormal';

export type HeavyEquipmentType =
  | 'crane' | 'excavator' | 'bulldozer' | 'loader' | 'grader'
  | 'roller' | 'dump_truck' | 'tanker' | 'flatbed' | 'refrigerated'
  | 'car_carrier' | 'tipper' | 'lowbed';

export type MtruckJobStatus =
  | 'draft' | 'quoting' | 'quoted' | 'accepted' | 'assigned'
  | 'pickup' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'disputed';

export type TruckStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type DriverStatus = 'available' | 'on_duty' | 'off_duty' | 'suspended';
export type LoadStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type UrgencyLevel = 'normal' | 'express' | 'critical';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type EquipmentStatus = 'available' | 'booked' | 'maintenance' | 'in_use';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type IncidentType = 'accident' | 'breakdown' | 'theft' | 'cargo_damage' | 'collision' | 'fire' | 'other';
export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';
export type InspectionType = 'pre_trip' | 'post_trip' | 'annual' | 'random' | 'accident';
export type InspectionStatus = 'pending' | 'passed' | 'failed' | 'conditional';
export type MessageType = 'text' | 'image' | 'location' | 'document' | 'voice';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type AuctionStatus = 'draft' | 'open' | 'closed' | 'cancelled' | 'awarded';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type SettlementStatus = 'pending' | 'escrow' | 'released' | 'disputed' | 'refunded';
export type FleetStatus = 'active' | 'inactive' | 'suspended';
export type InsightType = 'route_optimization' | 'fuel_efficiency' | 'maintenance_prediction' | 'driver_behavior' | 'load_optimization' | 'delivery_prediction';
export type CommandType = 'lock_doors' | 'unlock_doors' | 'start_engine' | 'stop_engine' | 'honk' | 'lights_on' | 'lights_off' | 'geofence_alert' | 'speed_limit' | 'route_update';
export type CommandStatus = 'pending' | 'sent' | 'acknowledged' | 'executed' | 'failed' | 'timeout';
export type TokenType = 'performance' | 'safety' | 'efficiency' | 'loyalty' | 'referral' | 'bonus';
export type FuelAlertType = 'low_fuel' | 'fuel_theft' | 'price_spike' | 'price_drop' | 'refuel_needed';
export type MaintenanceAlertType = 'scheduled_service' | 'engine_warning' | 'brake_warning' | 'tire_warning' | 'oil_change' | 'filter_replacement' | 'transmission' | 'coolant' | 'battery';
export type SecurityAlertType = 'unauthorized_access' | 'geofence_breach' | 'speeding' | 'harsh_braking' | 'harsh_acceleration' | 'night_driving' | 'route_deviation' | 'cargo_tamper' | 'sos_panic';
export type WarehouseStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved' | 'quarantine';
export type PortStatus = 'expected' | 'arrived' | 'cleared' | 'departed' | 'delayed';
export type CustomsStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'released';
export type MarketplaceStatus = 'active' | 'in_negotiation' | 'booked' | 'completed' | 'cancelled' | 'expired';

// ============================================================
// LOCATION / GEO TYPES
// ============================================================

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}


// ============================================================
// EXISTING: CORE TRUCKING TYPES (12 tables)
// ============================================================




export interface FleetAlert {
  id: string;
  truck_id?: string;
  driver_id?: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface FleetMetrics {
  totalDistance: number;
  fuelEfficiency: number;
  onTimeRate: number;
  costPerMile: number;
  revenuePerTruck: number;
  utilizationRate: number;
}


export interface FreightBid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface ShipperRequest {
  id: string;
  shipper_id: string;
  cargo_type: string;
  tonnage_category: TonnageCategory;
  weight_kg: number;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  dest_address: string;
  dest_lat: number;
  dest_lng: number;
  pickup_date: string;
  delivery_deadline: string;
  urgency: UrgencyLevel;
  special_requirements: string[];
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  quotes: HaulQuote[];
  created_at: string;
}

export interface HaulQuote {
  id: string;
  request_id: string;
  carrier_id: string;
  carrier_name: string;
  carrier_rating: number;
  estimated_cost: number;
  currency: string;
  estimated_duration_hours: number;
  truck_type: string;
  includes_insurance: boolean;
  notes?: string;
  status: QuoteStatus;
  created_at: string;
}

export interface MtruckJob {
  id: string;
  shipper_id: string;
  shipper_name: string;
  shipper_phone: string;
  cargo_type: string;
  tonnage_category: TonnageCategory;
  weight_kg: number;
  dimensions?: { length: number; width: number; height: number };
  hazardous: boolean;
  fragile: boolean;
  temperature_controlled: boolean;
  origin: GeoLocation;
  destination: GeoLocation;
  distance_km: number;
  pickup_date: string;
  delivery_deadline: string;
  urgency: UrgencyLevel;
  quoted_rate: number | null;
  final_rate: number | null;
  currency: string;
  assigned_truck_id: string | null;
  assigned_driver_id: string | null;
  assigned_equipment_ids: string[];
  status: MtruckJobStatus;
  current_location: GeoPoint | null;
  eta_minutes: number | null;
  created_at: string;
  quoted_at: string | null;
  accepted_at: string | null;
  pickup_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  shipper_rating: number | null;
  driver_rating: number | null;
  shipper_review: string | null;
  driver_review: string | null;
  documents: TruckDocument[];
}

export interface HeavyEquipment {
  id: string;
  type: HeavyEquipmentType;
  name: string;
  capacity: number;
  dimensions: { length: number; width: number; height: number };
  operator_required: boolean;
  rate_per_day: number;
  rate_per_hour: number;
  location: GeoLocation;
  status: EquipmentStatus;
  owner_id: string;
  images: string[];
  certifications: string[];
  insurance_expiry: string;
  created_at: string;
}

export interface EquipmentBooking {
  id: string;
  equipment_id: string;
  requester_id: string;
  job_id?: string;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  rate_agreed: number;
  currency: string;
  operator_included: boolean;
  status: BookingStatus;
  delivery_location: GeoLocation;
  created_at: string;
}


export interface MaintenanceRecord {
  id: string;
  truck_id: string;
  type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'overdue' | 'completed' | 'cancelled';
  cost?: number;
  notes?: string;
}



// ============================================================
// NEW: CORE TRUCKING TYPES (9 tables)
// ============================================================

export interface MtruckFleet {
  id: string;
  name: string;
  owner_id: string;
  company_name?: string;
  country_code: string;
  fleet_size: number;
  status: FleetStatus;
  created_at: string;
  updated_at: string;
}

export interface MtruckDelivery {
  id: string;
  job_id?: string;
  shipment_id?: string;
  driver_id?: string;
  truck_id?: string;
  pickup_location?: GeoLocation;
  dropoff_location?: GeoLocation;
  delivery_time?: string;
  proof_of_delivery?: {
    photo_url?: string;
    signature_url?: string;
    notes?: string;
    gps_location?: GeoPoint;
  };
  recipient_name?: string;
  recipient_signature?: string;
  status: DeliveryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckShipment {
  id: string;
  shipper_id?: string;
  load_id?: string;
  carrier_id?: string;
  origin: string;
  destination: string;
  weight_kg?: number;
  volume_cbm?: number;
  cargo_type?: string;
  declared_value: number;
  currency: string;
  tracking_number?: string;
  status: ShipmentStatus;
  scheduled_pickup?: string;
  scheduled_delivery?: string;
  actual_delivery?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckLocation {
  id: string;
  truck_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  speed_kmh?: number;
  heading?: number;
  altitude?: number;
  geofence_zone?: string;
  recorded_at: string;
  created_at: string;
}

export interface MtruckGpsStream {
  id: string;
  truck_id: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading?: number;
  ignition_status: boolean;
  engine_hours?: number;
  odometer_km?: number;
  fuel_level_percent?: number;
  battery_voltage?: number;
  signal_strength?: number;
  device_id?: string;
  received_at: string;
  created_at: string;
}

export interface MtruckTelemetry {
  id: string;
  truck_id: string;
  engine_rpm?: number;
  coolant_temp_c?: number;
  oil_pressure?: number;
  brake_pressure?: number;
  tire_pressure?: Record<string, number>;
  adblue_level_percent?: number;
  engine_load_percent?: number;
  throttle_position?: number;
  diagnostic_codes: string[];
  recorded_at: string;
  created_at: string;
}

export interface MtruckInspection {
  id: string;
  truck_id: string;
  driver_id?: string;
  inspector_id?: string;
  inspection_type: InspectionType;
  status: InspectionStatus;
  checklist: Record<string, boolean>;
  defects_found: string[];
  photos: string[];
  notes?: string;
  next_due_date?: string;
  conducted_at: string;
  created_at: string;
}

export interface MtruckIncident {
  id: string;
  truck_id?: string;
  driver_id?: string;
  job_id?: string;
  reporter_id?: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  location?: GeoLocation;
  description?: string;
  photos: string[];
  police_report_number?: string;
  insurance_claim_id?: string;
  status: IncidentStatus;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  job_id?: string;
  shipment_id?: string;
  message_type: MessageType;
  content: string;
  attachments: string[];
  read_at?: string;
  created_at: string;
}

// ============================================================
// NEW: AI & INTELLIGENCE TYPES (3 tables)
// ============================================================

export interface MtruckAiInsight {
  id: string;
  fleet_id?: string;
  truck_id?: string;
  driver_id?: string;
  insight_type: InsightType;
  title: string;
  description?: string;
  recommendation?: string;
  confidence_score?: number;
  data_source: Record<string, unknown>;
  acted_upon: boolean;
  action_taken?: string;
  created_at: string;
  expires_at?: string;
}

export interface MtruckEtaPrediction {
  id: string;
  shipment_id: string;
  truck_id?: string;
  predicted_eta: string;
  confidence_interval_minutes: number;
  prediction_model: string;
  factors: Record<string, unknown>;
  actual_arrival?: string;
  accuracy_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface MtruckPricingState {
  id: string;
  route_origin: string;
  route_destination: string;
  cargo_type?: string;
  base_rate_per_km: number;
  demand_multiplier: number;
  fuel_surcharge_percent: number;
  seasonal_multiplier: number;
  currency: string;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// NEW: MARKETPLACE & TRADE TYPES (7 tables)
// ============================================================

export interface MtruckFreightAuction {
  id: string;
  shipper_id: string;
  load_id?: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  cargo_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  pickup_date?: string;
  delivery_date?: string;
  starting_bid: number;
  reserve_price?: number;
  currency: string;
  bid_increment: number;
  auction_status: AuctionStatus;
  winning_bid_id?: string;
  winner_id?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckFreightBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_fleet_id?: string;
  bid_amount: number;
  currency: string;
  proposed_pickup_date?: string;
  proposed_delivery_date?: string;
  notes?: string;
  bid_status: BidStatus;
  is_winning: boolean;
  created_at: string;
  updated_at: string;
}

export interface MtruckFreightSettlement {
  id: string;
  auction_id?: string;
  bid_id?: string;
  shipment_id?: string;
  shipper_id: string;
  carrier_id: string;
  agreed_amount: number;
  platform_fee: number;
  insurance_fee: number;
  total_amount: number;
  currency: string;
  payment_status: SettlementStatus;
  escrow_tx_id?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckTradeCorridor {
  id: string;
  corridor_name: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  distance_km?: number;
  estimated_duration_hours?: number;
  route_geometry?: Record<string, unknown>;
  border_crossings: string[];
  active: boolean;
  avg_transit_time_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface MtruckPortShipment {
  id: string;
  shipment_id: string;
  port_of_entry: string;
  port_of_exit?: string;
  vessel_name?: string;
  container_number?: string;
  bill_of_lading?: string;
  customs_entry_number?: string;
  arrival_date?: string;
  departure_date?: string;
  port_status: PortStatus;
  yard_location?: string;
  demurrage_start_date?: string;
  demurrage_daily_rate: number;
  created_at: string;
  updated_at: string;
}

export interface MtruckCustomsClearance {
  id: string;
  shipment_id: string;
  port_shipment_id?: string;
  country_code: string;
  customs_office?: string;
  declaration_number?: string;
  hs_codes: string[];
  duty_amount: number;
  vat_amount: number;
  other_taxes: number;
  currency: string;
  clearance_status: CustomsStatus;
  inspection_required: boolean;
  inspection_result?: string;
  documents: string[];
  cleared_by?: string;
  cleared_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MtruckMarketplaceListing {
  id: string;
  shipper_id: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  cargo_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  required_truck_type?: string;
  pickup_date?: string;
  delivery_date?: string;
  budget?: number;
  currency: string;
  listing_status: MarketplaceStatus;
  views_count: number;
  bids_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// ============================================================
// NEW: FLEET MANAGEMENT TYPES (3 tables)
// ============================================================

export interface MtruckFleetCommand {
  id: string;
  fleet_id?: string;
  truck_id: string;
  command_type: CommandType;
  command_payload: Record<string, unknown>;
  issued_by: string;
  status: CommandStatus;
  response_payload?: Record<string, unknown>;
  executed_at?: string;
  created_at: string;
}

export interface MtruckFleetSnapshot {
  id: string;
  fleet_id?: string;
  snapshot_time: string;
  total_trucks: number;
  online_trucks: number;
  active_jobs: number;
  idle_trucks: number;
  avg_fuel_efficiency?: number;
  total_distance_today_km: number;
  total_deliveries_today: number;
  active_alerts: number;
  snapshot_data: Record<string, unknown>;
  created_at: string;
}

export interface MtruckDriverToken {
  id: string;
  driver_id: string;
  token_type: TokenType;
  amount: number;
  currency: string;
  reason?: string;
  awarded_by?: string;
  related_job_id?: string;
  expiry_date?: string;
  redeemed_at?: string;
  redemption_value?: number;
  created_at: string;
}

// ============================================================
// NEW: ALERTS & MONITORING TYPES (5 tables)
// ============================================================

export interface MtruckFuelAlert {
  id: string;
  fleet_id?: string;
  truck_id: string;
  alert_type: FuelAlertType;
  fuel_level_percent?: number;
  fuel_price?: number;
  station_name?: string;
  location?: GeoLocation;
  threshold_value?: number;
  is_read: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

export interface MtruckMaintenanceAlert {
  id: string;
  truck_id: string;
  alert_type: MaintenanceAlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  recommended_action?: string;
  estimated_cost?: number;
  due_date?: string;
  due_km?: number;
  current_km_at_alert?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface MtruckSecurityAlert {
  id: string;
  fleet_id?: string;
  truck_id: string;
  driver_id?: string;
  alert_type: SecurityAlertType;
  severity: AlertSeverity;
  location?: GeoLocation;
  triggered_value?: string;
  threshold_value?: string;
  video_evidence?: string;
  is_false_alarm?: boolean;
  investigated_by?: string;
  investigation_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface MtruckTrafficHotspot {
  id: string;
  route_corridor_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  congestion_level?: number;
  avg_speed_kmh?: number;
  incident_type?: string;
  incident_description?: string;
  estimated_delay_minutes: number;
  active: boolean;
  reported_by?: string;
  verified: boolean;
  created_at: string;
  expires_at?: string;
}

export interface MtruckWarehouseInventory {
  id: string;
  warehouse_name: string;
  fleet_id?: string;
  sku: string;
  product_name: string;
  category?: string;
  quantity: number;
  unit: string;
  location_in_warehouse?: string;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point: number;
  last_restock_date?: string;
  supplier_id?: string;
  status: WarehouseStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// === MTAA OS V10: MTruck type declarations ===
export interface TruckDocument { full_name: string; }
export interface Driver { full_name: string; trips_completed: number; rating: number; }
export interface FreightListing {
  urgency_level: 'low' | 'medium' | 'high';
  cargo_description: string; weight_kg: number; distance_km?: number;
  rate_amount: number; bid_count: number;
}
export interface FuelStation { full_name: string; }
export interface Load {
  status: string; rate_amount: number; cargo_description: string; weight_kg: number; distance_km?: number; }
export interface Route { distance_km?: number; }
export interface Truck {
  status: string; registration_number: string; }
export interface GeoPoint { lat: number; lng: number; }
