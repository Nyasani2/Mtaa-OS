-- Migration: 20260914_000001_structured_lab_results_and_author_resolution.sql
-- Purpose: P0 Patient Safety fixes
-- 1. Add structured lab results table with auto-flagging
-- 2. Add critical alerts table for Messenger push
-- 3. Fix author resolution pattern (documented)

-- ============================================================
-- PART A: Structured Lab Results (replaces free-text result_text)
-- ============================================================
CREATE TABLE IF NOT EXISTS health_lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES health_lab_orders(id) ON DELETE CASCADE,
  test_component TEXT NOT NULL,
  result_value NUMERIC,
  result_text TEXT,
  unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  flag TEXT CHECK (flag IN ('normal', 'low', 'high', 'critical_low', 'critical_high')),
  is_critical BOOLEAN DEFAULT FALSE,
  entered_by UUID REFERENCES auth.users(id),
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_results_order ON health_lab_results(order_id);
CREATE INDEX idx_lab_results_critical ON health_lab_results(is_critical) WHERE is_critical = TRUE;

-- ============================================================
-- PART B: Critical Alerts (pushed to Messenger)
-- ============================================================
CREATE TABLE IF NOT EXISTS health_critical_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES health_patients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES health_lab_orders(id) ON DELETE SET NULL,
  result_id UUID REFERENCES health_lab_results(id) ON DELETE SET NULL,
  alert_type TEXT DEFAULT 'critical_lab_value',
  severity TEXT DEFAULT 'critical',
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_critical_alerts_pending ON health_critical_alerts(acknowledged) WHERE acknowledged = FALSE;

-- ============================================================
-- PART C: Auto-flag trigger on lab_results insert
-- ============================================================
CREATE OR REPLACE FUNCTION fn_auto_flag_lab_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine flag based on reference range
  IF NEW.reference_min IS NOT NULL AND NEW.result_value < NEW.reference_min THEN
    IF NEW.result_value < (NEW.reference_min * 0.7) THEN
      NEW.flag := 'critical_low';
      NEW.is_critical := TRUE;
    ELSE
      NEW.flag := 'low';
    END IF;
  ELSIF NEW.reference_max IS NOT NULL AND NEW.result_value > NEW.reference_max THEN
    IF NEW.result_value > (NEW.reference_max * 1.3) THEN
      NEW.flag := 'critical_high';
      NEW.is_critical := TRUE;
    ELSE
      NEW.flag := 'high';
    END IF;
  ELSE
    NEW.flag := 'normal';
  END IF;

  -- If critical, insert alert
  IF NEW.is_critical THEN
    INSERT INTO health_critical_alerts (patient_id, order_id, result_id, message)
    SELECT
      ho.patient_id,
      NEW.order_id,
      NEW.id,
      'CRITICAL: ' || NEW.test_component || ' = ' || COALESCE(NEW.result_value::TEXT, NEW.result_text) || ' ' || COALESCE(NEW.unit, '')
    FROM health_lab_orders ho
    WHERE ho.id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_flag_lab_result ON health_lab_results;
CREATE TRIGGER trg_auto_flag_lab_result
  BEFORE INSERT OR UPDATE ON health_lab_results
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_flag_lab_result();

-- ============================================================
-- PART D: Fix ordered_by FK (make nullable to avoid broken FK)
-- ============================================================
ALTER TABLE health_lab_orders ALTER COLUMN ordered_by DROP NOT NULL;
ALTER TABLE health_lab_orders DROP CONSTRAINT IF EXISTS health_lab_orders_ordered_by_fkey;

-- ============================================================
-- PART E: Enable RLS
-- ============================================================
ALTER TABLE health_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_critical_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated lab results" ON health_lab_results;
CREATE POLICY "Allow authenticated lab results" ON health_lab_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated critical alerts" ON health_critical_alerts;
CREATE POLICY "Allow authenticated critical alerts" ON health_critical_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
