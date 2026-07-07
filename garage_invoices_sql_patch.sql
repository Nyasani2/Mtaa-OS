-- Garage OS Audit Fix SQL Patch
-- Creates garage_invoices table for real invoice generation
-- Run this in Supabase SQL Editor

-- Invoice table
CREATE TABLE IF NOT EXISTS garage_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES garage_appointments(id) ON DELETE CASCADE,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  vehicle_plate TEXT,
  services JSONB DEFAULT '[]',
  parts JSONB DEFAULT '[]',
  labor_hours NUMERIC(8,2) DEFAULT 2,
  labor_rate NUMERIC(12,2) DEFAULT 1500,
  labor_total NUMERIC(12,2) DEFAULT 0,
  services_total NUMERIC(12,2) DEFAULT 0,
  parts_total NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  vat NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE garage_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garage owners can manage their invoices"
  ON garage_invoices FOR ALL
  USING (garage_id IN (SELECT id FROM garages WHERE owner_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_garage_invoices_garage ON garage_invoices(garage_id);
CREATE INDEX IF NOT EXISTS idx_garage_invoices_appointment ON garage_invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_garage_invoices_status ON garage_invoices(status);

-- Add invoice_id to garage_appointments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'garage_appointments' AND column_name = 'invoice_id') THEN
    ALTER TABLE garage_appointments ADD COLUMN invoice_id UUID REFERENCES garage_invoices(id);
  END IF;
END $$;

-- Add labor fields to garage_appointments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'garage_appointments' AND column_name = 'labor_hours') THEN
    ALTER TABLE garage_appointments ADD COLUMN labor_hours NUMERIC(8,2) DEFAULT 2;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'garage_appointments' AND column_name = 'labor_rate') THEN
    ALTER TABLE garage_appointments ADD COLUMN labor_rate NUMERIC(12,2) DEFAULT 1500;
  END IF;
END $$;

-- Update trigger for garage_invoices updated_at
CREATE OR REPLACE FUNCTION update_garage_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_garage_invoices_updated_at ON garage_invoices;
CREATE TRIGGER trg_garage_invoices_updated_at
  BEFORE UPDATE ON garage_invoices
  FOR EACH ROW EXECUTE FUNCTION update_garage_invoices_updated_at();
