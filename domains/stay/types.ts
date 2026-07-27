// MTAA STAY OS — DOMAIN TYPES
// 20 tables mapped to TypeScript interfaces
// Table names preserved from legacy property schema for zero-downtime migration

export type StayType =
  | "apartment" | "bedsitter" | "studio" | "single_room" | "airbnb_unit"
  | "holiday_home" | "hotel_room" | "guest_house" | "villa" | "mansion"
  | "commercial_office" | "shop" | "warehouse" | "land" | "student_accommodation"
  | "serviced_apartment" | "hostel";

export type ListingType = "short_stay" | "long_term" | "commercial" | "hotel";
export type StayStatus = "pending" | "active" | "inactive" | "suspended" | "under_review";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface StayListing {
  id: string;
  owner_id: string;
  owner_type: "host" | "landlord" | "property_manager" | "business";
  title: string;
  description?: string;
  property_type: StayType;
  listing_type: ListingType;
  status: StayStatus;
  verification_status: VerificationStatus;
  country: string;
  county?: string;
  town: string;
  street?: string;
  estate?: string;
  village?: string;
  building_name?: string;
  unit_number?: string;
  latitude?: number;
  longitude?: number;
  full_address: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  floor_number?: number;
  total_floors?: number;
  year_built?: number;
  furnished: boolean;
  price_per_night?: number;
  price_per_month?: number;
  price_per_year?: number;
  deposit_amount?: number;
  cleaning_fee?: number;
  service_fee?: number;
  currency: string;
  amenities: string[];
  house_rules: string[];
  min_stay_nights: number;
  max_stay_nights: number;
  instant_book: boolean;
  cover_image?: string;
  video_url?: string;
  view_count: number;
  booking_count: number;
  review_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  deleted_at?: string;
}

// Legacy alias for backward compatibility
export type Property = StayListing;

export interface StayPhoto {
  id: string;
  property_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled_by_guest" | "cancelled_by_host" | "no_show";
export type PaymentStatus = "pending" | "deposit_paid" | "fully_paid" | "refunded" | "partially_refunded" | "failed";

export interface StayBooking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  guest_details?: Record<string, unknown>;
  nightly_rate: number;
  nights_count: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  deposit_amount?: number;
  wallet_transaction_id?: string;
  booking_status: BookingStatus;
  cancelled_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
}

// Legacy alias
export type PropertyBooking = StayBooking;

export type LeaseType = "monthly" | "quarterly" | "semi_annual" | "annual";
export type LeaseStatus = "draft" | "active" | "expiring_soon" | "expired" | "terminated" | "renewed";

export interface Lease {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  lease_type: LeaseType;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  currency: string;
  payment_due_day: number;
  late_fee_amount: number;
  grace_period_days: number;
  terms?: Record<string, unknown>;
  lease_document_url?: string;
  signed_by_tenant_at?: string;
  signed_by_landlord_at?: string;
  status: LeaseStatus;
  termination_reason?: string;
  terminated_at?: string;
  auto_renew: boolean;
  renewed_from_lease_id?: string;
  created_at: string;
  updated_at: string;
}

export type TenantStatus = "active" | "inactive" | "blacklisted";

export interface Tenant {
  id: string;
  profile_id: string;
  employment_status?: string;
  employer_name?: string;
  monthly_income?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  previous_landlord_name?: string;
  previous_landlord_phone?: string;
  id_document_url?: string;
  income_proof_url?: string;
  credit_score?: number;
  tenant_status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export type LandlordStatus = "active" | "inactive" | "suspended";

export interface Landlord {
  id: string;
  profile_id: string;
  business_id?: string;
  company_name?: string;
  tax_id?: string;
  bank_account_number?: string;
  bank_name?: string;
  id_document_url?: string;
  property_ownership_proof_url?: string;
  total_properties: number;
  total_tenants: number;
  total_revenue: number;
  landlord_status: LandlordStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export type HostStatus = "active" | "inactive" | "suspended";

export interface StayHostProfile {
  id: string;
  profile_id: string;
  bio?: string;
  languages_spoken: string[];
  response_time_minutes?: number;
  response_rate: number;
  government_id_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  total_listings: number;
  total_bookings: number;
  total_reviews: number;
  average_rating: number;
  superhost_status: boolean;
  superhost_since?: string;
  host_status: HostStatus;
  created_at: string;
  updated_at: string;
}

// Legacy alias
export type PropertyHostProfile = StayHostProfile;

export type MaintenanceCategory = "plumbing" | "electrical" | "hvac" | "appliance" | "structural" | "pest_control" | "landscaping" | "security" | "cleaning" | "other";
export type MaintenancePriority = "low" | "medium" | "high" | "emergency";
export type MaintenanceStatus = "reported" | "acknowledged" | "assigned" | "in_progress" | "awaiting_parts" | "completed" | "landlord_approval" | "paid" | "closed";

export interface MaintenanceTicket {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  contractor_id?: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  photos: string[];
  status: MaintenanceStatus;
  assigned_at?: string;
  estimated_cost?: number;
  actual_cost?: number;
  resolution_notes?: string;
  completed_at?: string;
  approved_by_landlord_at?: string;
  wallet_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceContractor {
  id: string;
  profile_id: string;
  company_name: string;
  business_registration?: string;
  specializations: string[];
  service_counties: string[];
  service_towns: string[];
  average_rating: number;
  review_count: number;
  completed_jobs: number;
  hourly_rate?: number;
  call_out_fee?: number;
  status: "pending" | "active" | "suspended" | "blacklisted";
  created_at: string;
  updated_at: string;
}

export type StayPaymentType = "rent" | "booking" | "deposit" | "refund" | "maintenance" | "late_fee" | "service_fee";
export type StayPaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface StayPayment {
  id: string;
  wallet_transaction_id: string;
  payment_type: StayPaymentType;
  property_id?: string;
  lease_id?: string;
  booking_id?: string;
  maintenance_ticket_id?: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  payment_period_start?: string;
  payment_period_end?: string;
  receipt_number?: string;
  receipt_url?: string;
  status: StayPaymentStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Legacy alias
export type PropertyPayment = StayPayment;

export interface StayReview {
  id: string;
  property_id: string;
  reviewer_id: string;
  booking_id?: string;
  overall_rating: number;
  cleanliness?: number;
  accuracy?: number;
  check_in?: number;
  communication?: number;
  location_rating?: number;
  value?: number;
  title?: string;
  comment: string;
  host_response?: string;
  host_responded_at?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

// Legacy alias
export type PropertyReview = StayReview;

export type HotelRoomType = "standard" | "deluxe" | "suite" | "presidential" | "single" | "double" | "twin" | "family";
export type HotelRoomStatus = "available" | "occupied" | "cleaning" | "maintenance" | "out_of_order";

export interface HotelRoom {
  id: string;
  property_id: string;
  room_number: string;
  room_type: HotelRoomType;
  floor?: number;
  max_guests: number;
  bed_count: number;
  bed_type?: string;
  base_price: number;
  amenities: string[];
  room_status: HotelRoomStatus;
  created_at: string;
  updated_at: string;
}

export interface HotelReservation {
  id: string;
  booking_id: string;
  room_id: string;
  assigned_room_number?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  housekeeping_status: "pending" | "cleaned" | "inspected" | "ready";
  room_service_orders: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface StaySearchFilters {
  location?: string;
  property_type?: StayType;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  pets_allowed?: boolean;
  parking?: boolean;
  internet?: boolean;
}

// Legacy alias
export type PropertySearchFilters = StaySearchFilters;

export interface StayAnalytics {
  id: string;
  property_id: string;
  period_type: "daily" | "weekly" | "monthly" | "yearly";
  period_start: string;
  period_end: string;
  total_days?: number;
  occupied_days?: number;
  occupancy_rate?: number;
  gross_revenue?: number;
  net_revenue?: number;
  booking_count?: number;
  cancellation_count?: number;
  maintenance_cost?: number;
  maintenance_ticket_count?: number;
  rent_collected?: number;
  rent_due?: number;
  late_payments?: number;
  view_count?: number;
  inquiry_count?: number;
  predicted_occupancy_next_month?: number;
  predicted_revenue_next_month?: number;
  risk_score?: number;
  created_at: string;
  updated_at: string;
}

// Legacy alias
export type PropertyAnalytics = StayAnalytics;

export type StayNotificationType =
  | "booking_created" | "booking_confirmed" | "booking_cancelled"
  | "rent_due" | "rent_paid" | "rent_late"
  | "lease_expiring" | "lease_terminated" | "lease_renewed"
  | "maintenance_reported" | "maintenance_assigned" | "maintenance_completed"
  | "property_approved" | "property_rejected"
  | "new_message" | "new_review" | "price_drop" | "new_listing";

export interface StayNotification {
  id: string;
  user_id: string;
  notification_type: StayNotificationType;
  property_id?: string;
  booking_id?: string;
  lease_id?: string;
  maintenance_ticket_id?: string;
  title: string;
  body: string;
  action_url?: string;
  read: boolean;
  read_at?: string;
  push_sent: boolean;
  email_sent: boolean;
  sms_sent: boolean;
  created_at: string;
}

// Legacy alias
export type PropertyNotification = StayNotification;

export interface StayState {
  listings: StayListing[];
  currentListing: StayListing | null;
  bookings: StayBooking[];
  currentBooking: StayBooking | null;
  leases: Lease[];
  currentLease: Lease | null;
  maintenanceTickets: MaintenanceTicket[];
  notifications: StayNotification[];
  searchResults: StayListing[];
  searchFilters: StaySearchFilters;
  savedListings: StayListing[];
  analytics: StayAnalytics[];
  isLoading: boolean;
  error: string | null;
}

// Legacy alias
export type PropertyState = StayState;
