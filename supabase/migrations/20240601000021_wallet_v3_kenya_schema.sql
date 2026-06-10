-- ============================================================
-- MTAA WALLET V3 — KENYA-FIRST PRODUCTION SCHEMA
-- M-Pesa Daraja 3.0 Ready | CBK Compliant | RLS Secured
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PHASE 16: REGULATORY ENGINE — Country Configs
-- ============================================================

CREATE TABLE IF NOT EXISTS country_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code text NOT NULL UNIQUE, -- 'KE', 'UG', 'NG', etc.
  country_name text NOT NULL,
  currency_code text NOT NULL, -- 'KES', 'UGX', 'NGN'
  currency_name text NOT NULL,
  currency_symbol text NOT NULL, -- 'KSh', 'USh', '₦'
  central_bank_name text NOT NULL, -- 'Central Bank of Kenya'
  central_bank_code text NOT NULL, -- 'CBK'
  tax_authority_name text NOT NULL, -- 'Kenya Revenue Authority'
  tax_authority_code text NOT NULL, -- 'KRA'
  vat_rate decimal(5,4) NOT NULL DEFAULT 0.1600, -- 16% for Kenya
  vat_threshold decimal(15,2) DEFAULT 5000000.00, -- KES 5M threshold
  withholding_tax_rate decimal(5,4) DEFAULT 0.0500,
  excise_duty_rate decimal(5,4) DEFAULT 0.1000,
  digital_service_tax_rate decimal(5,4) DEFAULT 0.0150,
  aml_threshold decimal(15,2) DEFAULT 1000000.00, -- KES 1M reporting threshold
  kyc_level_1_limit decimal(15,2) DEFAULT 300000.00, -- Daily limit no KYC
  kyc_level_2_limit decimal(15,2) DEFAULT 1000000.00, -- Basic KYC limit
  kyc_level_3_limit decimal(15,2) DEFAULT 5000000.00, -- Full KYC limit
  primary_payment_rail text NOT NULL DEFAULT 'mpesa_daraja',
  secondary_payment_rail text,
  is_active boolean DEFAULT true,
  regulatory_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert Kenya config
INSERT INTO country_configs (
  country_code, country_name, currency_code, currency_name, currency_symbol,
  central_bank_name, central_bank_code, tax_authority_name, tax_authority_code,
  vat_rate, primary_payment_rail, secondary_payment_rail
) VALUES (
  'KE', 'Kenya', 'KES', 'Kenyan Shilling', 'KSh',
  'Central Bank of Kenya', 'CBK', 'Kenya Revenue Authority', 'KRA',
  0.1600, 'mpesa_daraja', 'airtel_money'
) ON CONFLICT (country_code) DO NOTHING;

-- Insert other African countries (ready for expansion)
INSERT INTO country_configs (country_code, country_name, currency_code, currency_name, currency_symbol, central_bank_name, central_bank_code, tax_authority_name, tax_authority_code, vat_rate, primary_payment_rail) VALUES
  ('UG', 'Uganda', 'UGX', 'Ugandan Shilling', 'USh', 'Bank of Uganda', 'BoU', 'Uganda Revenue Authority', 'URA', 0.1800, 'mtn_momo'),
  ('TZ', 'Tanzania', 'TZS', 'Tanzanian Shilling', 'TSh', 'Bank of Tanzania', 'BoT', 'Tanzania Revenue Authority', 'TRA', 0.1800, 'mpesa_vodacom'),
  ('GH', 'Ghana', 'GHS', 'Ghana Cedi', 'GH₵', 'Bank of Ghana', 'BoG', 'Ghana Revenue Authority', 'GRA', 0.1500, 'mtn_momo'),
  ('NG', 'Nigeria', 'NGN', 'Nigerian Naira', '₦', 'Central Bank of Nigeria', 'CBN', 'Federal Inland Revenue Service', 'FIRS', 0.0750, 'mtn_momo_psb'),
  ('CI', 'Ivory Coast', 'XOF', 'West African CFA Franc', 'CFA', 'Central Bank of West African States', 'BCEAO', 'Direction Générale des Impôts', 'DGI', 0.1800, 'orange_money'),
  ('RW', 'Rwanda', 'RWF', 'Rwandan Franc', 'RF', 'National Bank of Rwanda', 'NBR', 'Rwanda Revenue Authority', 'RRA', 0.1800, 'mtn_momo')
ON CONFLICT (country_code) DO NOTHING;

-- ============================================================
-- PHASE 1: ASIS ONBOARDING — Users & PINs
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_pins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL, -- bcrypt hashed
  salt text NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  last_changed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_onboarding (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code text NOT NULL DEFAULT 'KE' REFERENCES country_configs(country_code),
  phone_number text NOT NULL,
  phone_verified boolean DEFAULT false,
  phone_verified_at timestamptz,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  pin_created boolean DEFAULT false,
  pin_created_at timestamptz,
  wallet_created boolean DEFAULT false,
  wallet_created_at timestamptz,
  onboarding_complete boolean DEFAULT false,
  completed_at timestamptz,
  current_step text DEFAULT 'phone_verify', -- phone_verify, email_verify, pin_create, welcome, complete
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- PHASE 2: WALLET CORE — Wallets & Balances
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type text NOT NULL DEFAULT 'main', -- main, escrow, savings, rewards, business, agent
  country_code text NOT NULL DEFAULT 'KE' REFERENCES country_configs(country_code),
  currency_code text NOT NULL DEFAULT 'KES',
  available_balance decimal(15,2) NOT NULL DEFAULT 0.00,
  pending_balance decimal(15,2) NOT NULL DEFAULT 0.00,
  total_incoming decimal(15,2) NOT NULL DEFAULT 0.00,
  total_outgoing decimal(15,2) NOT NULL DEFAULT 0.00,
  is_active boolean DEFAULT true,
  is_frozen boolean DEFAULT false,
  freeze_reason text,
  daily_limit decimal(15,2),
  monthly_limit decimal(15,2),
  kyc_level integer DEFAULT 1, -- 1=basic, 2=verified, 3=full
  wallet_address text UNIQUE, -- For crypto future
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_type)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  transaction_type text NOT NULL, -- deposit, withdrawal, transfer, payment, escrow, savings, reward, fee, tax
  direction text NOT NULL, -- credit, debit
  amount decimal(15,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'KES',
  fee_amount decimal(15,2) DEFAULT 0.00,
  tax_amount decimal(15,2) DEFAULT 0.00,
  net_amount decimal(15,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, reversed
  provider text, -- mpesa_daraja, mtn_momo, airtel_money, internal
  provider_transaction_id text,
  reference text,
  description text,
  metadata jsonb DEFAULT '{}',
  related_transaction_id uuid,
  counterparty_wallet_id uuid REFERENCES wallets(id),
  counterparty_phone text,
  counterparty_name text,
  ip_address inet,
  device_id text,
  location jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS wallet_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES wallets(id),
  notification_type text NOT NULL, -- transaction, security, system, marketing
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_statements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  statement_period_start date NOT NULL,
  statement_period_end date NOT NULL,
  opening_balance decimal(15,2) NOT NULL,
  closing_balance decimal(15,2) NOT NULL,
  total_credits decimal(15,2) DEFAULT 0.00,
  total_debits decimal(15,2) DEFAULT 0.00,
  total_fees decimal(15,2) DEFAULT 0.00,
  total_taxes decimal(15,2) DEFAULT 0.00,
  transaction_count integer DEFAULT 0,
  pdf_url text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 3 & 4: TRANSFERS & CLAIM FLOW
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_recipients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text,
  recipient_phone text NOT NULL,
  recipient_wallet_id uuid REFERENCES wallets(id),
  is_registered boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  transfer_count integer DEFAULT 0,
  total_transferred decimal(15,2) DEFAULT 0.00,
  last_transfer_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipient_phone)
);

CREATE TABLE IF NOT EXISTS wallet_pending_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_wallet_id uuid NOT NULL REFERENCES wallets(id),
  recipient_phone text NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'KES',
  claim_token text NOT NULL UNIQUE,
  claim_qr_data text,
  invite_link text,
  status text DEFAULT 'pending', -- pending, claimed, expired, refunded
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claimed_by_user_id uuid REFERENCES auth.users(id),
  refunded_at timestamptz,
  sms_sent boolean DEFAULT false,
  whatsapp_sent boolean DEFAULT false,
  referral_code text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id uuid NOT NULL REFERENCES auth.users(id),
  invitee_phone text NOT NULL,
  invite_method text NOT NULL, -- sms, whatsapp, link
  invite_code text NOT NULL UNIQUE,
  status text DEFAULT 'pending', -- pending, accepted, expired
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES auth.users(id),
  reward_given boolean DEFAULT false,
  reward_amount decimal(15,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- ============================================================
-- PHASE 5: QR PAYMENT SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_qr_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_wallet_id uuid NOT NULL REFERENCES wallets(id),
  qr_type text NOT NULL, -- personal, merchant, agent, dynamic
  qr_data text NOT NULL,
  qr_image_url text,
  amount decimal(15,2), -- NULL for static, set for dynamic
  description text,
  expiry_date timestamptz, -- NULL for static
  scan_count integer DEFAULT 0,
  payment_count integer DEFAULT 0,
  total_received decimal(15,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 6: BUSINESS & MERCHANT
-- ============================================================

CREATE TABLE IF NOT EXISTS business_wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  wallet_id uuid NOT NULL REFERENCES wallets(id) UNIQUE,
  business_number text NOT NULL UNIQUE, -- SHOP-KE-000001
  business_name text NOT NULL,
  business_type text NOT NULL, -- shop, restaurant, service, transport, other
  registration_number text,
  tax_pin text,
  kra_pin text, -- Kenya specific
  business_phone text NOT NULL,
  business_email text,
  business_address text,
  business_location jsonb, -- lat, lng
  business_category text,
  business_description text,
  logo_url text,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verification_documents jsonb DEFAULT '{}',
  settlement_account text, -- Bank account for settlements
  settlement_bank text,
  settlement_frequency text DEFAULT 'daily', -- daily, weekly, monthly
  last_settlement_at timestamptz,
  commission_rate decimal(5,4) DEFAULT 0.0150, -- 1.5%
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_settlements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_wallet_id uuid NOT NULL REFERENCES business_wallets(id),
  settlement_period_start date NOT NULL,
  settlement_period_end date NOT NULL,
  gross_amount decimal(15,2) NOT NULL,
  commission_amount decimal(15,2) NOT NULL,
  tax_amount decimal(15,2) NOT NULL,
  net_amount decimal(15,2) NOT NULL,
  transaction_count integer NOT NULL,
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  settlement_reference text,
  settled_at timestamptz,
  bank_reference text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_wallet_id uuid NOT NULL REFERENCES business_wallets(id),
  analytics_date date NOT NULL,
  total_sales decimal(15,2) DEFAULT 0.00,
  transaction_count integer DEFAULT 0,
  unique_customers integer DEFAULT 0,
  average_transaction decimal(15,2) DEFAULT 0.00,
  peak_hour integer,
  top_product_category text,
  qr_scan_count integer DEFAULT 0,
  qr_payment_count integer DEFAULT 0,
  refund_count integer DEFAULT 0,
  refund_amount decimal(15,2) DEFAULT 0.00,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_wallet_id, analytics_date)
);

-- ============================================================
-- PHASE 7 & 8: AGENT NETWORK
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
  wallet_id uuid NOT NULL REFERENCES wallets(id) UNIQUE,
  agent_code text NOT NULL UNIQUE, -- AGT-KE-000001
  agent_name text NOT NULL,
  agent_phone text NOT NULL,
  agent_type text NOT NULL DEFAULT 'individual', -- individual, business
  id_number text,
  kra_pin text,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verification_documents jsonb DEFAULT '{}',
  commission_rate_cash_in decimal(5,4) DEFAULT 0.0050, -- 0.5%
  commission_rate_cash_out decimal(5,4) DEFAULT 0.0100, -- 1%
  daily_limit decimal(15,2) DEFAULT 500000.00,
  monthly_limit decimal(15,2) DEFAULT 10000000.00,
  current_daily_volume decimal(15,2) DEFAULT 0.00,
  current_monthly_volume decimal(15,2) DEFAULT 0.00,
  rating decimal(2,1) DEFAULT 5.0,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true,
  last_activity_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_wallet_id uuid NOT NULL REFERENCES agent_wallets(id),
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  accuracy decimal(10,2),
  address text,
  city text,
  region text,
  is_current boolean DEFAULT true,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_wallet_id uuid NOT NULL REFERENCES agent_wallets(id),
  transaction_id uuid NOT NULL REFERENCES wallet_transactions(id),
  commission_type text NOT NULL, -- cash_in, cash_out, registration
  commission_amount decimal(15,2) NOT NULL,
  transaction_amount decimal(15,2) NOT NULL,
  commission_rate decimal(5,4) NOT NULL,
  status text DEFAULT 'pending', -- pending, paid
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_wallet_id uuid NOT NULL REFERENCES agent_wallets(id),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 9: SAVINGS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_savings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  savings_type text NOT NULL, -- personal, goal, emergency, business, group
  goal_name text NOT NULL,
  goal_description text,
  target_amount decimal(15,2),
  current_amount decimal(15,2) DEFAULT 0.00,
  currency_code text NOT NULL DEFAULT 'KES',
  start_date date,
  target_date date,
  auto_contribute boolean DEFAULT false,
  auto_contribute_amount decimal(15,2),
  auto_contribute_frequency text, -- daily, weekly, monthly
  last_contribution_at timestamptz,
  total_contributions integer DEFAULT 0,
  interest_rate decimal(5,4) DEFAULT 0.0000,
  interest_earned decimal(15,2) DEFAULT 0.00,
  is_group_savings boolean DEFAULT false,
  group_members jsonb DEFAULT '[]',
  group_admin_id uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_savings_contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  savings_id uuid NOT NULL REFERENCES wallet_savings(id),
  contributor_id uuid NOT NULL REFERENCES auth.users(id),
  amount decimal(15,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'KES',
  contribution_method text DEFAULT 'wallet', -- wallet, mpesa, bank
  status text DEFAULT 'completed',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 10: GOFUND
-- ============================================================

CREATE TABLE IF NOT EXISTS gofund_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  campaign_type text NOT NULL, -- community, business, education, health, agriculture, technology, environment, emergency
  title text NOT NULL,
  description text NOT NULL,
  story text,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0.00,
  currency_code text NOT NULL DEFAULT 'KES',
  cover_image_url text,
  media_urls jsonb DEFAULT '[]',
  beneficiary_name text,
  beneficiary_contact text,
  location text,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  end_date date,
  donor_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gofund_contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES gofund_campaigns(id),
  donor_id uuid REFERENCES auth.users(id), -- NULL for anonymous
  donor_name text,
  donor_phone text,
  donor_email text,
  amount decimal(15,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'KES',
  is_anonymous boolean DEFAULT false,
  message text,
  payment_method text DEFAULT 'wallet', -- wallet, mpesa, bank
  payment_status text DEFAULT 'completed',
  transaction_id uuid REFERENCES wallet_transactions(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gofund_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES gofund_campaigns(id),
  update_title text NOT NULL,
  update_text text NOT NULL,
  media_urls jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gofund_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES gofund_campaigns(id),
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  comment_text text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 11: ESCROW
-- ============================================================

CREATE TABLE IF NOT EXISTS escrow_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_wallet_id uuid NOT NULL REFERENCES wallets(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  buyer_wallet_id uuid NOT NULL REFERENCES wallets(id),
  seller_wallet_id uuid NOT NULL REFERENCES wallets(id),
  title text NOT NULL,
  description text,
  total_amount decimal(15,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'KES',
  fee_amount decimal(15,2) DEFAULT 0.00,
  status text DEFAULT 'pending', -- pending, funded, in_progress, disputed, released, refunded, cancelled
  service_type text, -- jobs, marketplace, services
  service_id uuid,
  terms_accepted_buyer boolean DEFAULT false,
  terms_accepted_seller boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  funded_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS escrow_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id uuid NOT NULL REFERENCES escrow_accounts(id),
  milestone_title text NOT NULL,
  milestone_description text,
  amount decimal(15,2) NOT NULL,
  status text DEFAULT 'pending', -- pending, completed, disputed
  completed_at timestamptz,
  released_at timestamptz,
  release_requested_by uuid REFERENCES auth.users(id),
  release_approved_by uuid REFERENCES auth.users(id),
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id uuid NOT NULL REFERENCES escrow_accounts(id),
  raised_by uuid NOT NULL REFERENCES auth.users(id),
  dispute_reason text NOT NULL,
  dispute_description text,
  evidence_urls jsonb DEFAULT '[]',
  status text DEFAULT 'open', -- open, under_review, resolved, escalated
  resolution text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  refund_amount decimal(15,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 12: CREDIT REPUTATION
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_credit_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  credit_score integer NOT NULL DEFAULT 0, -- 0-1000
  risk_score integer NOT NULL DEFAULT 0, -- 0-100
  eligibility_score integer NOT NULL DEFAULT 0, -- 0-100
  suggested_limit decimal(15,2) DEFAULT 0.00,
  wallet_age_days integer DEFAULT 0,
  transaction_volume_30d decimal(15,2) DEFAULT 0.00,
  transaction_count_30d integer DEFAULT 0,
  savings_balance decimal(15,2) DEFAULT 0.00,
  escrow_completion_rate decimal(5,4) DEFAULT 0.0000,
  merchant_activity_score integer DEFAULT 0,
  jobs_activity_score integer DEFAULT 0,
  reputation_score integer DEFAULT 0,
  community_trust_score integer DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now(),
  calculation_version integer DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wallet_credit_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_limit decimal(15,2) DEFAULT 0.00,
  used_limit decimal(15,2) DEFAULT 0.00,
  available_limit decimal(15,2) DEFAULT 0.00,
  interest_rate decimal(5,4) DEFAULT 0.0000,
  grace_period_days integer DEFAULT 0,
  is_active boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- PHASE 13: MTAA ADVANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_advances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  credit_limit_id uuid NOT NULL REFERENCES wallet_credit_limits(id),
  amount_requested decimal(15,2) NOT NULL,
  amount_approved decimal(15,2),
  amount_disbursed decimal(15,2) DEFAULT 0.00,
  amount_repaid decimal(15,2) DEFAULT 0.00,
  interest_rate decimal(5,4) DEFAULT 0.0000,
  interest_amount decimal(15,2) DEFAULT 0.00,
  total_due decimal(15,2) DEFAULT 0.00,
  status text DEFAULT 'pending', -- pending, approved, disbursed, repaying, defaulted, closed
  purpose text,
  due_date date,
  disbursed_at timestamptz,
  repaid_at timestamptz,
  defaulted_at timestamptz,
  is_simulation boolean DEFAULT true, -- ALWAYS true until licensed
  simulation_note text DEFAULT 'SIMULATION MODE - No real lending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_repayments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  advance_id uuid NOT NULL REFERENCES wallet_advances(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount decimal(15,2) NOT NULL,
  principal_amount decimal(15,2) NOT NULL,
  interest_amount decimal(15,2) NOT NULL,
  payment_method text DEFAULT 'wallet', -- wallet, mpesa, bank
  status text DEFAULT 'completed',
  transaction_id uuid REFERENCES wallet_transactions(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 14: DIGITAL ASSETS (Future-Ready)
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_digital_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  asset_type text NOT NULL, -- stablecoin, crypto, token
  asset_code text NOT NULL, -- USDT, USDC, BTC
  asset_name text,
  blockchain text, -- ethereum, tron, stellar
  wallet_address text,
  balance decimal(20,8) DEFAULT 0.00000000,
  fiat_equivalent decimal(15,2) DEFAULT 0.00,
  fiat_currency text DEFAULT 'KES',
  is_active boolean DEFAULT false, -- Disabled until licensed
  activation_date timestamptz,
  custody_provider text,
  compliance_status text DEFAULT 'pending_review',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, asset_code)
);

-- ============================================================
-- PHASE 15: BANKING HUB
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_partner_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_type text NOT NULL, -- bank, sacco, insurance, telecom, ngo, government, payment_provider, digital_asset
  organization_name text NOT NULL,
  organization_code text,
  country_code text NOT NULL DEFAULT 'KE',
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  website text,
  license_number text,
  license_document_url text,
  partnership_type text NOT NULL, -- banking, settlement, collection, lending, insurance, technology
  proposed_services jsonb DEFAULT '[]',
  application_status text DEFAULT 'pending', -- pending, under_review, approved, rejected
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  contract_signed boolean DEFAULT false,
  contract_url text,
  activated_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 17: TAX ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_transaction_id uuid NOT NULL REFERENCES wallet_transactions(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  business_wallet_id uuid REFERENCES business_wallets(id),
  country_code text NOT NULL DEFAULT 'KE',
  tax_type text NOT NULL, -- vat, withholding, excise, digital_service_tax, income
  taxable_amount decimal(15,2) NOT NULL,
  tax_rate decimal(5,4) NOT NULL,
  tax_amount decimal(15,2) NOT NULL,
  tax_base_amount decimal(15,2) NOT NULL, -- Amount before tax
  net_amount decimal(15,2) NOT NULL, -- Amount after tax
  is_separated boolean DEFAULT false,
  separated_at timestamptz,
  ledger_posted boolean DEFAULT false,
  ledger_posted_at timestamptz,
  government_ledger_id uuid,
  kra_receipt_number text,
  reporting_period text, -- YYYY-MM
  is_reported boolean DEFAULT false,
  reported_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_ledgers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code text NOT NULL,
  tax_type text NOT NULL,
  ledger_period text NOT NULL, -- YYYY-MM
  opening_balance decimal(15,2) DEFAULT 0.00,
  total_collected decimal(15,2) DEFAULT 0.00,
  total_settled decimal(15,2) DEFAULT 0.00,
  closing_balance decimal(15,2) DEFAULT 0.00,
  transaction_count integer DEFAULT 0,
  is_closed boolean DEFAULT false,
  closed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(country_code, tax_type, ledger_period)
);

-- ============================================================
-- PHASE 18: GOVERNMENT CUSTODY LEDGERS
-- ============================================================

CREATE TABLE IF NOT EXISTS government_ledgers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code text NOT NULL REFERENCES country_configs(country_code),
  ledger_name text NOT NULL, -- KENYA_LEDGER, UGANDA_LEDGER
  ledger_type text NOT NULL, -- tax_custody, regulatory_reserve, penalty_fund
  balance decimal(15,2) DEFAULT 0.00,
  currency_code text NOT NULL DEFAULT 'KES',
  total_inflows decimal(15,2) DEFAULT 0.00,
  total_outflows decimal(15,2) DEFAULT 0.00,
  transaction_count integer DEFAULT 0,
  last_settlement_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS government_settlement_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  government_ledger_id uuid NOT NULL REFERENCES government_ledgers(id),
  country_code text NOT NULL,
  request_type text NOT NULL, -- tax_settlement, penalty_collection, regulatory_fee
  amount_requested decimal(15,2) NOT NULL,
  amount_approved decimal(15,2),
  amount_disbursed decimal(15,2) DEFAULT 0.00,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'pending', -- pending, under_review, approved, rejected, disbursed
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  disbursed_by uuid REFERENCES auth.users(id),
  bank_account text,
  bank_name text,
  swift_code text,
  disbursement_reference text,
  request_notes text,
  review_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PHASE 21: PAYMENT PROVIDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_code text NOT NULL UNIQUE, -- mpesa_daraja, mtn_momo, airtel_money, orange_money, wave
  provider_name text NOT NULL,
  country_code text NOT NULL,
  provider_type text NOT NULL, -- mobile_money, bank, card, crypto
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  api_base_url text,
  api_version text,
  auth_type text, -- oauth2, api_key, basic
  client_id text,
  client_secret text ENCRYPTED, -- Store encrypted
  webhook_secret text,
  sandbox_mode boolean DEFAULT true,
  daily_limit decimal(15,2),
  transaction_limit decimal(15,2),
  fee_structure jsonb DEFAULT '{}',
  supported_operations jsonb DEFAULT '["deposit", "withdrawal", "transfer"]',
  last_health_check_at timestamptz,
  health_status text DEFAULT 'unknown', -- healthy, degraded, down
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert M-Pesa Daraja (Kenya)
INSERT INTO payment_providers (
  provider_code, provider_name, country_code, provider_type, is_active, is_primary,
  api_base_url, api_version, auth_type, sandbox_mode, supported_operations
) VALUES (
  'mpesa_daraja', 'M-Pesa Daraja', 'KE', 'mobile_money', true, true,
  'https://sandbox.safaricom.co.ke', '3.0', 'oauth2', true,
  '["deposit", "withdrawal", "transfer", "stk_push", "callback"]'
) ON CONFLICT (provider_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS provider_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_code text NOT NULL REFERENCES payment_providers(provider_code),
  wallet_transaction_id uuid REFERENCES wallet_transactions(id),
  provider_transaction_id text NOT NULL,
  provider_reference text,
  transaction_type text NOT NULL, -- stk_push, b2c, c2b, reversal, balance_query
  request_payload jsonb,
  response_payload jsonb,
  callback_payload jsonb,
  status text DEFAULT 'pending', -- pending, processing, completed, failed, reversed
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  reconciled boolean DEFAULT false,
  reconciled_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  session_id text
);

CREATE TABLE IF NOT EXISTS wallet_compliance_flags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  flag_type text NOT NULL, -- aml, kyc, sanctions, velocity, structuring
  flag_reason text NOT NULL,
  severity text NOT NULL, -- low, medium, high, critical
  status text DEFAULT 'open', -- open, under_review, resolved, escalated
  related_transaction_id uuid REFERENCES wallet_transactions(id),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  resolution text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gofund_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gofund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gofund_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gofund_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_settlement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_compliance_flags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_wallets ON wallets FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_transactions ON wallet_transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_notifications ON wallet_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_statements ON wallet_statements FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_pins ON wallet_pins FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_onboarding ON wallet_onboarding FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_recipients ON wallet_recipients FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_pending_tx ON wallet_pending_transactions FOR ALL USING (sender_id = auth.uid());
CREATE POLICY user_invites ON wallet_invites FOR ALL USING (inviter_id = auth.uid());
CREATE POLICY user_qr ON wallet_qr_codes FOR ALL USING (owner_id = auth.uid());
CREATE POLICY user_business ON business_wallets FOR ALL USING (owner_id = auth.uid());
CREATE POLICY user_agent ON agent_wallets FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_savings ON wallet_savings FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_credit_scores ON wallet_credit_scores FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_credit_limits ON wallet_credit_limits FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_advances ON wallet_advances FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_digital_assets ON wallet_digital_assets FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_compliance ON wallet_compliance_flags FOR ALL USING (user_id = auth.uid());

-- Public read for campaigns
CREATE POLICY public_campaigns ON gofund_campaigns FOR SELECT USING (is_active = true);
CREATE POLICY creator_campaigns ON gofund_campaigns FOR ALL USING (creator_id = auth.uid());

-- Admin policies (for government portal)
CREATE POLICY admin_tax_ledgers ON tax_ledgers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_gov_ledgers ON government_ledgers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_settlements ON government_settlement_requests FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_partner_apps ON wallet_partner_applications FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_compliance ON wallet_compliance_flags FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON wallet_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON wallet_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_pending_tx_sender ON wallet_pending_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_pending_tx_phone ON wallet_pending_transactions(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_pending_tx_token ON wallet_pending_transactions(claim_token);
CREATE INDEX IF NOT EXISTS idx_business_owner ON business_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_number ON business_wallets(business_number);
CREATE INDEX IF NOT EXISTS idx_agent_user ON agent_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_code ON agent_wallets(agent_code);
CREATE INDEX IF NOT EXISTS idx_agent_location ON agent_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_savings_user ON wallet_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_gofund_creator ON gofund_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_gofund_type ON gofund_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_accounts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_credit_user ON wallet_credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_tx ON tax_transactions(wallet_transaction_id);
CREATE INDEX IF NOT EXISTS idx_tax_country ON tax_transactions(country_code, reporting_period);
CREATE INDEX IF NOT EXISTS idx_provider_tx ON provider_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON wallet_audit_logs(table_name, record_id);

-- ============================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================

CREATE OR REPLACE FUNCTION wallet_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO wallet_audit_logs (table_name, record_id, action, old_data, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid(), now());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO wallet_audit_logs (table_name, record_id, action, old_data, new_data, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid(), now());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO wallet_audit_logs (table_name, record_id, action, new_data, changed_by, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid(), now());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to critical tables
CREATE TRIGGER wallets_audit AFTER INSERT OR UPDATE OR DELETE ON wallets
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();
CREATE TRIGGER wallet_transactions_audit AFTER INSERT OR UPDATE OR DELETE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();
CREATE TRIGGER escrow_accounts_audit AFTER INSERT OR UPDATE OR DELETE ON escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();
CREATE TRIGGER business_wallets_audit AFTER INSERT OR UPDATE OR DELETE ON business_wallets
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();
CREATE TRIGGER agent_wallets_audit AFTER INSERT OR UPDATE OR DELETE ON agent_wallets
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();
CREATE TRIGGER wallet_advances_audit AFTER INSERT OR UPDATE OR DELETE ON wallet_advances
  FOR EACH ROW EXECUTE FUNCTION wallet_audit_trigger();

-- ============================================================
-- REALTIME ENABLEMENT
-- ============================================================

-- Enable realtime for wallet tables
BEGIN;
  -- Add tables to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
  ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE wallet_notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE wallet_pending_transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE escrow_accounts;
  ALTER PUBLICATION supabase_realtime ADD TABLE gofund_campaigns;
  ALTER PUBLICATION supabase_realtime ADD TABLE gofund_contributions;
COMMIT;

-- ============================================================
-- COMPLETION
-- ============================================================

SELECT 'MTAA Wallet V3 Kenya Schema Created Successfully' AS status;
