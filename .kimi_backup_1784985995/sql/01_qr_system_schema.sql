-- ============================================================
-- MTAA UNIVERSAL QR SYSTEM
-- One QR for every entity, every action, every app
-- ============================================================

-- Drop existing if partial
DROP TABLE IF EXISTS qr_scans CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;

-- ============================================================
-- 1. QR CODES TABLE — Every entity's QR identity
-- ============================================================
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Entity reference (polymorphic)
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'user', 'shop', 'agent', 'matatu', 'hospital', 
        'government', 'county', 'department', 'escrow', 
        'goods', 'business', 'creator', 'transport'
    )),
    entity_id UUID NOT NULL,

    -- Owner (who controls this QR)
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- QR Configuration
    qr_name TEXT, -- e.g. "My Shop Counter", "Matatu Route 23"
    is_static BOOLEAN DEFAULT true, -- static = identity only, dynamic = prefilled context
    is_active BOOLEAN DEFAULT true,

    -- For dynamic QRs: prefilled context
    default_action TEXT, -- e.g. 'pay', 'book', 'follow'
    prefilled_amount DECIMAL(12,2),
    prefilled_currency TEXT DEFAULT 'KES',
    prefilled_description TEXT,
    prefilled_metadata JSONB DEFAULT '{}',

    -- Expiry (for dynamic QRs)
    expires_at TIMESTAMPTZ,
    max_scans INTEGER, -- null = unlimited
    scan_count INTEGER DEFAULT 0,

    -- Deep link payload (what the QR encodes)
    deep_link TEXT NOT NULL, -- mtaa://qr/{id}?t={type}&a={action}

    -- Visual
    qr_image_url TEXT, -- generated QR image stored in storage

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one active static QR per entity
    CONSTRAINT unique_active_static_qr UNIQUE (entity_type, entity_id, is_static, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_qr_codes_owner ON qr_codes(owner_id);
CREATE INDEX idx_qr_codes_entity ON qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_active ON qr_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_qr_codes_expires ON qr_codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_qr_codes_deep_link ON qr_codes(deep_link);

-- ============================================================
-- 2. QR SCANS TABLE — Audit log of every scan
-- ============================================================
CREATE TABLE qr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The QR that was scanned
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,

    -- Who scanned it
    scanner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanner_profile_id UUID,

    -- Scan context
    scanner_lat DECIMAL(10,8),
    scanner_lng DECIMAL(11,8),
    scanner_device_id TEXT,

    -- What action was taken
    action_taken TEXT, -- 'pay', 'follow', 'book', 'pickup', 'release', etc.
    action_result TEXT, -- 'success', 'failed', 'cancelled', 'pending'

    -- Transaction reference (if payment)
    transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_qr ON qr_scans(qr_code_id);
CREATE INDEX idx_qr_scans_scanner ON qr_scans(scanner_id);
CREATE INDEX idx_qr_scans_created ON qr_scans(created_at);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- QR Codes: owners can manage their own, anyone can view active ones
CREATE POLICY "Owners can manage their QR codes"
    ON qr_codes FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active QR codes"
    ON qr_codes FOR SELECT
    USING (is_active = true);

-- QR Scans: scanners can see their own scans, QR owners can see scans of their QRs
CREATE POLICY "Scanners can view their scans"
    ON qr_scans FOR SELECT
    USING (auth.uid() = scanner_id);

CREATE POLICY "QR owners can view scans of their codes"
    ON qr_scans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM qr_codes 
            WHERE qr_codes.id = qr_scans.qr_code_id 
            AND qr_codes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create scans"
    ON qr_scans FOR INSERT
    WITH CHECK (auth.uid() = scanner_id);

-- ============================================================
-- 4. TRIGGER: Auto-generate deep_link on insert
-- ============================================================
CREATE OR REPLACE FUNCTION generate_qr_deep_link()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deep_link := 'mtaa://qr/' || NEW.id || '?t=' || NEW.entity_type;
    IF NEW.default_action IS NOT NULL THEN
        NEW.deep_link := NEW.deep_link || '&a=' || NEW.default_action;
    END IF;
    IF NEW.prefilled_amount IS NOT NULL THEN
        NEW.deep_link := NEW.deep_link || '&amt=' || NEW.prefilled_amount::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_qr_deep_link ON qr_codes;
CREATE TRIGGER trg_generate_qr_deep_link
    BEFORE INSERT ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION generate_qr_deep_link();

-- ============================================================
-- 5. TRIGGER: Update scan_count on qr_codes
-- ============================================================
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE qr_codes 
    SET scan_count = scan_count + 1 
    WHERE id = NEW.qr_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_scan_count ON qr_scans;
CREATE TRIGGER trg_increment_scan_count
    AFTER INSERT ON qr_scans
    FOR EACH ROW
    EXECUTE FUNCTION increment_qr_scan_count();

-- ============================================================
-- 6. TRIGGER: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER trg_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_codes_updated_at();
