-- ═══════════════════════════════════════════════════════════════════════
-- MTAA PROPERTY OS — COMPLETE SQL SCHEMA
-- 20 Tables | MTAA-Native | No Duplicates | Production-Ready
-- ═══════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 1: properties
-- Core property listing table
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('host', 'landlord', 'property_manager', 'business')),

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN (
    'apartment', 'bedsitter', 'studio', 'single_room', 'airbnb_unit',
    'holiday_home', 'hotel_room', 'guest_house', 'villa', 'mansion',
    'commercial_office', 'shop', 'warehouse', 'land', 'student_accommodation',
    'serviced_apartment', 'hostel'
  )),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('short_stay', 'long_term', 'commercial', 'hotel')),

  -- Location (Streets Integration)
  country TEXT NOT NULL,
  county TEXT,
  town TEXT NOT NULL,
  street TEXT,
  estate TEXT,
  village TEXT,
  building_name TEXT,
  unit_number TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  full_address TEXT NOT NULL,

  -- Property Details
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  square_feet DECIMAL(10, 2),
  floor_number INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  furnished BOOLEAN DEFAULT FALSE,

  -- Pricing
  price_per_night DECIMAL(12, 2),
  price_per_month DECIMAL(12, 2),
  price_per_year DECIMAL(12, 2),
  deposit_amount DECIMAL(12, 2),
  cleaning_fee DECIMAL(12, 2),
  service_fee DECIMAL(12, 2),
  currency TEXT DEFAULT 'KES',

  -- Amenities (JSON array for flexibility)
  amenities JSONB DEFAULT '[]',

  -- Rules
  house_rules JSONB DEFAULT '[]',

  -- Availability
  min_stay_nights INTEGER DEFAULT 1,
  max_stay_nights INTEGER DEFAULT 30,
  instant_book BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'under_review')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),

  -- Media
  cover_image TEXT,
  video_url TEXT,

  -- Metrics
  view_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2, 1) DEFAULT 0,

  -- SEO / Search
  search_vector tsvector,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(country, county, town, street);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_night, price_per_month);
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_tags ON properties USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties USING GIST (point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_properties_updated_at ON properties;
CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_properties_updated_at();

-- Trigger for search vector
CREATE OR REPLACE FUNCTION properties_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.town, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.street, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.full_address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_properties_search ON properties;
CREATE TRIGGER trigger_properties_search
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION properties_search_vector_update();


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 2: property_photos
-- Photo gallery for each property
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_photos_property ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_primary ON property_photos(property_id, is_primary);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 3: property_reviews
-- Reviews for properties (by guests/tenants)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID,

  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness INTEGER CHECK (cleanliness BETWEEN 1 AND 5),
  accuracy INTEGER CHECK (accuracy BETWEEN 1 AND 5),
  check_in INTEGER CHECK (check_in BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  value INTEGER CHECK (value BETWEEN 1 AND 5),

  -- Content
  title TEXT,
  comment TEXT NOT NULL,

  -- Host Response
  host_response TEXT,
  host_responded_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_reviews_property ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_reviewer ON property_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_status ON property_reviews(status);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created ON property_reviews(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 4: property_bookings
-- Short-stay and hotel bookings
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Booking Details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  guest_details JSONB DEFAULT '{}',

  -- Pricing Breakdown
  nightly_rate DECIMAL(12, 2) NOT NULL,
  nights_count INTEGER NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  cleaning_fee DECIMAL(12, 2) DEFAULT 0,
  service_fee DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',

  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded', 'partially_refunded', 'failed')),
  deposit_amount DECIMAL(12, 2),
  wallet_transaction_id UUID,

  -- Status
  booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled_by_guest', 'cancelled_by_host', 'no_show')),

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount DECIMAL(12, 2),

  -- Special Requests
  special_requests TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bookings_property ON property_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON property_bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON property_bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON property_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON property_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON property_bookings(payment_status);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 5: property_availability
-- Calendar availability for each property
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  price_override DECIMAL(12, 2),
  minimum_stay INTEGER,

  UNIQUE(property_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_property ON property_availability(property_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON property_availability(date);
CREATE INDEX IF NOT EXISTS idx_availability_available ON property_availability(property_id, is_available);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 6: leases
-- Long-term rental lease agreements
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Lease Terms
  lease_type TEXT NOT NULL CHECK (lease_type IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(12, 2) NOT NULL,
  deposit_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',

  -- Payment Schedule
  payment_due_day INTEGER NOT NULL DEFAULT 1 CHECK (payment_due_day BETWEEN 1 AND 31),
  late_fee_amount DECIMAL(12, 2) DEFAULT 0,
  grace_period_days INTEGER DEFAULT 5,

  -- Terms
  terms JSONB DEFAULT '{}',

  -- Documents
  lease_document_url TEXT,
  signed_by_tenant_at TIMESTAMPTZ,
  signed_by_landlord_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expiring_soon', 'expired', 'terminated', 'renewed')),
  termination_reason TEXT,
  terminated_at TIMESTAMPTZ,

  -- Renewal
  auto_renew BOOLEAN DEFAULT FALSE,
  renewed_from_lease_id UUID REFERENCES leases(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_dates ON leases(start_date, end_date);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 7: tenants
-- Tenant profile extensions (links to MTAA Identity)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tenant Info
  employment_status TEXT,
  employer_name TEXT,
  monthly_income DECIMAL(12, 2),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- References
  previous_landlord_name TEXT,
  previous_landlord_phone TEXT,

  -- Verification
  id_document_url TEXT,
  income_proof_url TEXT,
  credit_score INTEGER,

  -- Status
  tenant_status TEXT NOT NULL DEFAULT 'active' CHECK (tenant_status IN ('active', 'inactive', 'blacklisted')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_profile ON tenants(profile_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(tenant_status);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 8: landlords
-- Landlord profile extensions (links to MTAA Identity + Business OS)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,

  -- Landlord Info
  company_name TEXT,
  tax_id TEXT,
  bank_account_number TEXT,
  bank_name TEXT,

  -- Verification
  id_document_url TEXT,
  property_ownership_proof_url TEXT,

  -- Metrics
  total_properties INTEGER DEFAULT 0,
  total_tenants INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,

  -- Status
  landlord_status TEXT NOT NULL DEFAULT 'active' CHECK (landlord_status IN ('active', 'inactive', 'suspended')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landlords_profile ON landlords(profile_id);
CREATE INDEX IF NOT EXISTS idx_landlords_business ON landlords(business_id);
CREATE INDEX IF NOT EXISTS idx_landlords_status ON landlords(landlord_status);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 9: maintenance_tickets
-- Maintenance request tracking
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Issue Details
  category TEXT NOT NULL CHECK (category IN (
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
    'pest_control', 'landscaping', 'security', 'cleaning', 'other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Photos
  photos JSONB DEFAULT '[]',

  -- Status Workflow
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported', 'acknowledged', 'assigned', 'in_progress',
    'awaiting_parts', 'completed', 'landlord_approval', 'paid', 'closed'
  )),

  -- Assignment
  assigned_at TIMESTAMPTZ,
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),

  -- Resolution
  resolution_notes TEXT,
  completed_at TIMESTAMPTZ,
  approved_by_landlord_at TIMESTAMPTZ,

  -- Payment
  wallet_transaction_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_property ON maintenance_tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_landlord ON maintenance_tickets(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_created ON maintenance_tickets(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 10: maintenance_contractors
-- Approved contractors for maintenance work
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS maintenance_contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Business Info
  company_name TEXT NOT NULL,
  business_registration TEXT,

  -- Specializations
  specializations TEXT[] DEFAULT '{}',

  -- Service Area
  service_counties TEXT[] DEFAULT '{}',
  service_towns TEXT[] DEFAULT '{}',

  -- Ratings
  average_rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,

  -- Pricing
  hourly_rate DECIMAL(12, 2),
  call_out_fee DECIMAL(12, 2),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'blacklisted')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_profile ON maintenance_contractors(profile_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON maintenance_contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_specializations ON maintenance_contractors USING GIN(specializations);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 11: property_payments
-- All property-related payments (rent, bookings, maintenance)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to Wallet Transaction
  wallet_transaction_id UUID NOT NULL,

  -- Payment Context
  payment_type TEXT NOT NULL CHECK (payment_type IN ('rent', 'booking', 'deposit', 'refund', 'maintenance', 'late_fee', 'service_fee')),

  -- Related Records
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES property_bookings(id) ON DELETE SET NULL,
  maintenance_ticket_id UUID REFERENCES maintenance_tickets(id) ON DELETE SET NULL,

  -- Payer / Payee
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',

  -- Period (for rent)
  payment_period_start DATE,
  payment_period_end DATE,

  -- Receipt
  receipt_number TEXT UNIQUE,
  receipt_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_wallet ON property_payments(wallet_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON property_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease ON property_payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON property_payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON property_payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON property_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON property_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON property_payments(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 12: property_documents
-- Documents related to properties (leases, IDs, certificates)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document Info
  document_type TEXT NOT NULL CHECK (document_type IN (
    'lease_agreement', 'id_document', 'title_deed', 'insurance',
    'inspection_report', 'receipt', 'maintenance_invoice', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Access
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_confidential BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_property ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_lease ON property_documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON property_documents(document_type);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 13: property_messages
-- Messages within property context (uses MTAA Messenger)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links to MTAA Messenger
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Property Context
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES property_bookings(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  maintenance_ticket_id UUID REFERENCES maintenance_tickets(id) ON DELETE CASCADE,

  -- Message Content
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'booking_request', 'payment_request')),
  content TEXT NOT NULL,
  attachment_url TEXT,

  -- Status
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_messages_conversation ON property_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_property_messages_sender ON property_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_property_messages_property ON property_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_property_messages_created ON property_messages(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 14: saved_properties
-- User's saved/favorite properties
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Search Context
  search_filters JSONB DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_property ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_created ON saved_properties(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 15: property_analytics
-- Aggregated analytics for properties
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Time Period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Occupancy
  total_days INTEGER DEFAULT 0,
  occupied_days INTEGER DEFAULT 0,
  occupancy_rate DECIMAL(5, 2) DEFAULT 0,

  -- Revenue
  gross_revenue DECIMAL(15, 2) DEFAULT 0,
  net_revenue DECIMAL(15, 2) DEFAULT 0,

  -- Bookings
  booking_count INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0,

  -- Maintenance
  maintenance_cost DECIMAL(12, 2) DEFAULT 0,
  maintenance_ticket_count INTEGER DEFAULT 0,

  -- Rent (long-term)
  rent_collected DECIMAL(12, 2) DEFAULT 0,
  rent_due DECIMAL(12, 2) DEFAULT 0,
  late_payments INTEGER DEFAULT 0,

  -- Views
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,

  -- ASIS Predictions
  predicted_occupancy_next_month DECIMAL(5, 2),
  predicted_revenue_next_month DECIMAL(15, 2),
  risk_score INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_analytics_property ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON property_analytics(period_type, period_start);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 16: property_host_profiles
-- Extended host profile for short-stay hosts
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_host_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Host Info
  bio TEXT,
  languages_spoken TEXT[] DEFAULT '{}',
  response_time_minutes INTEGER,
  response_rate DECIMAL(5, 2) DEFAULT 0,

  -- Verification
  government_id_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,

  -- Metrics
  total_listings INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(2, 1) DEFAULT 0,
  superhost_status BOOLEAN DEFAULT FALSE,
  superhost_since DATE,

  -- Status
  host_status TEXT NOT NULL DEFAULT 'active' CHECK (host_status IN ('active', 'inactive', 'suspended')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_host_profiles_profile ON property_host_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_host_profiles_superhost ON property_host_profiles(superhost_status);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 17: hotel_rooms
-- Hotel-specific room inventory
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Room Info
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'standard', 'deluxe', 'suite', 'presidential', 'single', 'double', 'twin', 'family'
  )),
  floor INTEGER,

  -- Capacity
  max_guests INTEGER NOT NULL DEFAULT 2,
  bed_count INTEGER DEFAULT 1,
  bed_type TEXT,

  -- Pricing
  base_price DECIMAL(12, 2) NOT NULL,

  -- Features
  amenities JSONB DEFAULT '[]',

  -- Status
  room_status TEXT NOT NULL DEFAULT 'available' CHECK (room_status IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_property ON hotel_rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_status ON hotel_rooms(room_status);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type ON hotel_rooms(room_type);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 18: hotel_reservations
-- Hotel room reservations (extends property_bookings)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hotel_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES property_bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,

  -- Check-In/Out
  assigned_room_number TEXT,
  checked_in_by UUID REFERENCES profiles(id),
  checked_out_by UUID REFERENCES profiles(id),

  -- Housekeeping
  housekeeping_status TEXT DEFAULT 'pending' CHECK (housekeeping_status IN ('pending', 'cleaned', 'inspected', 'ready')),

  -- Room Service
  room_service_orders JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_res_booking ON hotel_reservations(booking_id);
CREATE INDEX IF NOT EXISTS idx_hotel_res_room ON hotel_reservations(room_id);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 19: property_search_history
-- User search history for recommendations
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Search Parameters
  query TEXT,
  location TEXT,
  property_type TEXT,
  min_price DECIMAL(12, 2),
  max_price DECIMAL(12, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  filters JSONB DEFAULT '{}',

  -- Results
  result_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON property_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON property_search_history(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- TABLE 20: property_notifications
-- Property-specific notification queue
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Notification Context
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'booking_created', 'booking_confirmed', 'booking_cancelled',
    'rent_due', 'rent_paid', 'rent_late',
    'lease_expiring', 'lease_terminated', 'lease_renewed',
    'maintenance_reported', 'maintenance_assigned', 'maintenance_completed',
    'property_approved', 'property_rejected',
    'new_message', 'new_review', 'price_drop', 'new_listing'
  )),

  -- Related Records
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES property_bookings(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  maintenance_ticket_id UUID REFERENCES maintenance_tickets(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Delivery
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_notif_user ON property_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_property_notif_type ON property_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_property_notif_read ON property_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_property_notif_created ON property_notifications(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_notifications ENABLE ROW LEVEL SECURITY;


-- Properties RLS
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "Users can manage their own properties" ON properties
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all properties" ON properties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- Property Photos RLS
CREATE POLICY "Property photos are viewable by everyone" ON property_photos
  FOR SELECT USING (TRUE);

CREATE POLICY "Property owners can manage photos" ON property_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_photos.property_id AND owner_id = auth.uid())
  );


-- Property Reviews RLS
CREATE POLICY "Reviews are viewable by everyone" ON property_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create their own reviews" ON property_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON property_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Admins can manage reviews" ON property_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- Property Bookings RLS
CREATE POLICY "Users can view their own bookings" ON property_bookings
  FOR SELECT USING (guest_id = auth.uid() OR host_id = auth.uid());

CREATE POLICY "Guests can create bookings" ON property_bookings
  FOR INSERT WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Hosts can update bookings" ON property_bookings
  FOR UPDATE USING (host_id = auth.uid());


-- Leases RLS
CREATE POLICY "Tenants can view their leases" ON leases
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Landlords can view their leases" ON leases
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can create leases" ON leases
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their leases" ON leases
  FOR UPDATE USING (landlord_id = auth.uid());


-- Tenants RLS
CREATE POLICY "Users can view their own tenant profile" ON tenants
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Landlords can view tenant profiles of their tenants" ON tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM leases WHERE tenant_id = tenants.profile_id AND landlord_id = auth.uid())
  );

CREATE POLICY "Users can create their tenant profile" ON tenants
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their tenant profile" ON tenants
  FOR UPDATE USING (profile_id = auth.uid());


-- Landlords RLS
CREATE POLICY "Users can view their own landlord profile" ON landlords
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their landlord profile" ON landlords
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their landlord profile" ON landlords
  FOR UPDATE USING (profile_id = auth.uid());


-- Maintenance Tickets RLS
CREATE POLICY "Tenants can view their tickets" ON maintenance_tickets
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Landlords can view their property tickets" ON maintenance_tickets
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can create tickets" ON maintenance_tickets
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Landlords can update tickets" ON maintenance_tickets
  FOR UPDATE USING (landlord_id = auth.uid());


-- Property Payments RLS
CREATE POLICY "Users can view their payments" ON property_payments
  FOR SELECT USING (payer_id = auth.uid() OR payee_id = auth.uid());


-- Saved Properties RLS
CREATE POLICY "Users can view their saved properties" ON saved_properties
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their saved properties" ON saved_properties
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- Property Notifications RLS
CREATE POLICY "Users can view their notifications" ON property_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON property_notifications
  FOR UPDATE USING (user_id = auth.uid());


-- Property Search History RLS
CREATE POLICY "Users can view their search history" ON property_search_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their search history" ON property_search_history
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- Function: Update property average rating when review is approved
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET 
    average_rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 1)
      FROM property_reviews
      WHERE property_id = NEW.property_id AND status = 'approved'
    ),
    review_count = (
      SELECT COUNT(*)
      FROM property_reviews
      WHERE property_id = NEW.property_id AND status = 'approved'
    )
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_property_rating ON property_reviews;
CREATE TRIGGER trigger_update_property_rating
  AFTER INSERT OR UPDATE ON property_reviews
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_property_rating();


-- Function: Update landlord metrics on new lease
CREATE OR REPLACE FUNCTION update_landlord_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE landlords
    SET 
      total_properties = (
        SELECT COUNT(DISTINCT property_id) FROM leases 
        WHERE landlord_id = NEW.landlord_id AND status = 'active'
      ),
      total_tenants = (
        SELECT COUNT(DISTINCT tenant_id) FROM leases 
        WHERE landlord_id = NEW.landlord_id AND status = 'active'
      )
    WHERE profile_id = NEW.landlord_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_landlord_metrics ON leases;
CREATE TRIGGER trigger_update_landlord_metrics
  AFTER INSERT OR UPDATE ON leases
  FOR EACH ROW
  EXECUTE FUNCTION update_landlord_metrics();


-- Function: Create property notification
CREATE OR REPLACE FUNCTION create_property_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_property_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_lease_id UUID DEFAULT NULL,
  p_maintenance_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO property_notifications (
    user_id, notification_type, title, body,
    property_id, booking_id, lease_id, maintenance_ticket_id, action_url
  ) VALUES (
    p_user_id, p_type, p_title, p_body,
    p_property_id, p_booking_id, p_lease_id, p_maintenance_id, p_action_url
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Check property availability
CREATE OR REPLACE FUNCTION check_property_availability(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflicting_bookings INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflicting_bookings
  FROM property_bookings
  WHERE property_id = p_property_id
    AND booking_status IN ('confirmed', 'checked_in')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;

  RETURN v_conflicting_bookings = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT := 'PROP-';
  v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_sequence INTEGER;
  v_receipt_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_sequence
  FROM property_payments
  WHERE DATE(created_at) = CURRENT_DATE;

  v_receipt_number := v_prefix || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');
  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;


-- Function: Auto-generate availability calendar for new property
CREATE OR REPLACE FUNCTION generate_property_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_end_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '2 years';

  WHILE v_date <= v_end_date LOOP
    INSERT INTO property_availability (property_id, date, is_available)
    VALUES (NEW.id, v_date, TRUE)
    ON CONFLICT (property_id, date) DO NOTHING;
    v_date := v_date + INTERVAL '1 day';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_availability ON properties;
CREATE TRIGGER trigger_generate_availability
  AFTER INSERT ON properties
  FOR EACH ROW
  WHEN (NEW.listing_type = 'short_stay' OR NEW.listing_type = 'hotel')
  EXECUTE FUNCTION generate_property_availability();


-- ═══════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════

-- View: Active Properties with Owner Info
CREATE OR REPLACE VIEW v_active_properties AS
SELECT 
  p.*,
  pr.full_name as owner_name,
  pr.avatar_url as owner_avatar,
  pr.phone as owner_phone
FROM properties p
JOIN profiles pr ON p.owner_id = pr.id
WHERE p.status = 'active' AND p.deleted_at IS NULL;


-- View: Tenant Dashboard Summary
CREATE OR REPLACE VIEW v_tenant_dashboard AS
SELECT 
  t.profile_id,
  t.tenant_status,
  COUNT(DISTINCT l.id) as active_leases,
  COUNT(DISTINCT mt.id) as open_maintenance_tickets,
  COALESCE(SUM(pp.amount), 0) as total_rent_paid,
  COUNT(DISTINCT pp.id) as total_payments
FROM tenants t
LEFT JOIN leases l ON t.profile_id = l.tenant_id AND l.status = 'active'
LEFT JOIN maintenance_tickets mt ON t.profile_id = mt.tenant_id AND mt.status NOT IN ('closed', 'paid')
LEFT JOIN property_payments pp ON t.profile_id = pp.payer_id AND pp.payment_type = 'rent'
GROUP BY t.profile_id, t.tenant_status;


-- View: Landlord Dashboard Summary
CREATE OR REPLACE VIEW v_landlord_dashboard AS
SELECT 
  l.profile_id,
  l.landlord_status,
  l.total_properties,
  l.total_tenants,
  l.total_revenue,
  COUNT(DISTINCT prop.id) as active_properties,
  COUNT(DISTINCT ls.id) as active_leases,
  COUNT(DISTINCT mt.id) as open_maintenance_tickets,
  COALESCE(SUM(pp.amount), 0) as total_collected_this_month
FROM landlords l
LEFT JOIN properties prop ON l.profile_id = prop.owner_id AND prop.status = 'active'
LEFT JOIN leases ls ON l.profile_id = ls.landlord_id AND ls.status = 'active'
LEFT JOIN maintenance_tickets mt ON l.profile_id = mt.landlord_id AND mt.status NOT IN ('closed', 'paid')
LEFT JOIN property_payments pp ON l.profile_id = pp.payee_id 
  AND pp.payment_type = 'rent' 
  AND DATE_TRUNC('month', pp.created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY l.profile_id, l.landlord_status, l.total_properties, l.total_tenants, l.total_revenue;


-- View: Property Revenue Summary
CREATE OR REPLACE VIEW v_property_revenue AS
SELECT 
  p.id as property_id,
  p.title,
  p.property_type,
  p.listing_type,
  COALESCE(SUM(pp.amount), 0) as total_revenue,
  COUNT(DISTINCT pp.id) as total_transactions,
  COUNT(DISTINCT pb.id) as total_bookings,
  COUNT(DISTINCT ls.id) as total_leases
FROM properties p
LEFT JOIN property_payments pp ON p.id = pp.property_id AND pp.status = 'completed'
LEFT JOIN property_bookings pb ON p.id = pb.property_id AND pb.booking_status = 'checked_out'
LEFT JOIN leases ls ON p.id = ls.property_id AND ls.status = 'active'
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.property_type, p.listing_type;


-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA (Optional - for testing)
-- ═══════════════════════════════════════════════════════════════════════

-- Property Types Enum Reference
-- apartment, bedsitter, studio, single_room, airbnb_unit,
-- holiday_home, hotel_room, guest_house, villa, mansion,
-- commercial_office, shop, warehouse, land, student_accommodation,
-- serviced_apartment, hostel

-- Listing Types: short_stay, long_term, commercial, hotel
-- Status: pending, active, inactive, suspended, under_review
-- Verification: unverified, pending, verified, rejected

-- ═══════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
