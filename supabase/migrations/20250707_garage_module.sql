-- ============================================================
-- MTAA GARAGE MODULE — COMPLETE SCHEMA
-- Date: 2026-07-07
-- Fixes: Missing tables causing infinite loading across Garage OS
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. GARAGES — Core garage registration
-- ============================================================
CREATE TABLE IF NOT EXISTS garages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  city text,
  country text DEFAULT 'Kenya',
  phone text,
  email text,
  registration_number text,
  tax_id text,
  kra_pin text,
  gps_lat decimal(10,8),
  gps_lng decimal(11,8),
  services_offered text[] DEFAULT '{}',
  operating_hours jsonb DEFAULT '{"mon_fri":"08:00-18:00","sat":"09:00-14:00"}',
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  verification_documents jsonb DEFAULT '[]',
  rating decimal(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  total_revenue decimal(18,2) DEFAULT 0,
  total_jobs integer DEFAULT 0,
  active_jobs integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  cancelled_jobs integer DEFAULT 0,
  wallet_balance decimal(18,2) DEFAULT 0,
  subscription_plan text DEFAULT 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

-- ============================================================
-- 2. GARAGE_INVENTORY — Parts, supplies, stock
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  quantity integer NOT NULL DEFAULT 0,
  unit text DEFAULT 'pcs',
  cost_price decimal(18,2) DEFAULT 0,
  selling_price decimal(18,2) DEFAULT 0,
  reorder_level integer DEFAULT 10,
  reorder_quantity integer DEFAULT 50,
  supplier_id uuid,
  supplier_name text,
  supplier_phone text,
  location text,
  barcode text,
  image_url text,
  is_active boolean DEFAULT true,
  last_restocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. GARAGE_VEHICLES — Vehicles under garage care
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id),
  owner_name text,
  owner_phone text,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  vin text,
  chassis_number text,
  engine_number text,
  registration_plate text,
  color text,
  mileage integer DEFAULT 0,
  fuel_type text DEFAULT 'petrol',
  transmission text DEFAULT 'manual',
  insurance_expiry date,
  roadworthy_expiry date,
  last_service_date date,
  next_service_due date,
  status text DEFAULT 'active' CHECK (status IN ('active','in_service','completed','discharged')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. GARAGE_WORK_ORDERS — Jobs/appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_work_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES garage_vehicles(id),
  customer_id uuid REFERENCES auth.users(id),
  customer_name text,
  customer_phone text,
  customer_email text,
  license_plate text,
  service_type text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','diagnosis','quote_sent','approved','in_progress','quality_check','ready_for_pickup','completed','cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  estimated_cost decimal(18,2),
  final_cost decimal(18,2),
  mileage_in integer,
  mileage_out integer,
  assigned_mechanic_id uuid,
  assigned_mechanic_name text,
  bay_number text,
  start_time timestamptz,
  completion_time timestamptz,
  parts_used jsonb DEFAULT '[]',
  labor_hours decimal(5,2),
  labor_rate decimal(18,2),
  notes text,
  customer_approved boolean DEFAULT false,
  invoice_generated boolean DEFAULT false,
  invoice_id uuid,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. GARAGE_FLEET_CONTRACTS — Fleet management
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_fleet_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  fleet_owner_id uuid REFERENCES auth.users(id),
  company_name text NOT NULL,
  contact_person text,
  contact_phone text,
  contact_email text,
  contract_start date NOT NULL,
  contract_end date NOT NULL,
  contract_value decimal(18,2) DEFAULT 0,
  payment_terms text DEFAULT 'monthly',
  services_included text[] DEFAULT '{}',
  vehicle_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','expired','terminated')),
  termination_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. GARAGE_MECHANICS — Staff management
-- ============================================================
CREATE TABLE IF NOT EXISTS garage_mechanics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id uuid NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text,
  email text,
  specialization text[] DEFAULT '{}',
  certification text,
  hourly_rate decimal(18,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','on_leave','suspended','terminated')),
  rating decimal(2,1) DEFAULT 0,
  jobs_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Garages RLS
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "garages_select_all" ON garages
  FOR SELECT USING (true);

CREATE POLICY "garages_insert_own" ON garages
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "garages_update_own" ON garages
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "garages_delete_own" ON garages
  FOR DELETE USING (auth.uid() = owner_id);

-- Garage Inventory RLS
ALTER TABLE garage_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_select_garage" ON garage_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_inventory.garage_id)
  );

CREATE POLICY "inventory_insert_garage_owner" ON garage_inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_inventory.garage_id AND garages.owner_id = auth.uid())
  );

CREATE POLICY "inventory_update_garage_owner" ON garage_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_inventory.garage_id AND garages.owner_id = auth.uid())
  );

-- Garage Vehicles RLS
ALTER TABLE garage_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_garage" ON garage_vehicles
  FOR SELECT USING (true);

CREATE POLICY "vehicles_insert_garage_owner" ON garage_vehicles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_vehicles.garage_id AND garages.owner_id = auth.uid())
  );

-- Work Orders RLS
ALTER TABLE garage_work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_orders_select_all" ON garage_work_orders
  FOR SELECT USING (true);

CREATE POLICY "work_orders_insert_garage_owner" ON garage_work_orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_work_orders.garage_id AND garages.owner_id = auth.uid())
  );

-- Fleet Contracts RLS
ALTER TABLE garage_fleet_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fleet_select_garage" ON garage_fleet_contracts
  FOR SELECT USING (true);

CREATE POLICY "fleet_insert_garage_owner" ON garage_fleet_contracts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_fleet_contracts.garage_id AND garages.owner_id = auth.uid())
  );

-- Mechanics RLS
ALTER TABLE garage_mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mechanics_select_garage" ON garage_mechanics
  FOR SELECT USING (true);

CREATE POLICY "mechanics_insert_garage_owner" ON garage_mechanics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM garages WHERE garages.id = garage_mechanics.garage_id AND garages.owner_id = auth.uid())
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_garages_owner ON garages(owner_id);
CREATE INDEX IF NOT EXISTS idx_garages_status ON garages(status);
CREATE INDEX IF NOT EXISTS idx_inventory_garage ON garage_inventory(garage_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON garage_inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON garage_inventory(quantity, reorder_level) WHERE quantity <= reorder_level;
CREATE INDEX IF NOT EXISTS idx_vehicles_garage ON garage_vehicles(garage_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON garage_vehicles(registration_plate);
CREATE INDEX IF NOT EXISTS idx_work_orders_garage ON garage_work_orders(garage_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON garage_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_fleet_garage ON garage_fleet_contracts(garage_id);
CREATE INDEX IF NOT EXISTS idx_fleet_status ON garage_fleet_contracts(status);
CREATE INDEX IF NOT EXISTS idx_mechanics_garage ON garage_mechanics(garage_id);

-- ============================================================
-- SEED DATA — Default services
-- ============================================================
INSERT INTO garages (owner_id, name, description, address, city, services_offered, status, verification_status)
SELECT 
  auth.uid(),
  'Demo Garage',
  'Sample garage for testing',
  '123 Test Street',
  'Nairobi',
  ARRAY['General Repairs', 'Oil Change', 'Brake Service', 'Engine Diagnostics'],
  'active',
  'verified'
WHERE NOT EXISTS (SELECT 1 FROM garages LIMIT 1);
