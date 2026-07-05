# Health OS: Facility Onboarding + POS + Inventory System

## What's Included

### 1. SQL Schema (run in Supabase SQL Editor)
- `01_onboarding_pos_schema.sql` — All new tables
- `02_edge_functions.sql` — All edge functions

### 2. Frontend Screens
- `facility-register/index.tsx` — Self-service facility registration
- `government/verify-facilities/index.tsx` — Government verification dashboard
- `pharmacy/pos/index.tsx` — Pharmacy POS with QR scanning
- `pharmacy/inventory/index.tsx` — Inventory management

### 3. New Tables
| Table | Purpose |
|-------|---------|
| health_facility_registrations | Onboarding queue for new facilities |
| health_facility_admins | Multi-admin per facility with permissions |
| health_inventory | Stock tracking for pharmacy/lab |
| health_inventory_transactions | Audit trail for all stock movements |
| health_pos_transactions | QR scan payment records |
| health_drug_tracking | Batch-level drug traceability |
| health_government_inspectors | MoH oversight roles |
| health_facility_successions | Death/delegation handling |

### 4. Edge Functions
| Function | Purpose |
|----------|---------|
| register_health_facility | Self-service facility registration |
| verify_health_facility | Government approve/reject/suspend |
| generate_inventory_qr | Create QR codes for products |
| process_pos_payment | Handle QR scan + wallet payment |
| handle_facility_succession | Founder death/delegation |
| get_facility_dashboard_stats | Dashboard analytics |

## Installation

1. Run `01_onboarding_pos_schema.sql` in Supabase SQL Editor
2. Run `02_edge_functions.sql` in Supabase SQL Editor
3. Copy frontend files to `app/(os)/health/`
4. Add routes to `_layout.tsx`
5. Restart Metro

## User Flows

### Pharmacy Owner Registers Clinic
1. Opens Health OS → taps "Register Facility"
2. Fills: name, type (clinic), ownership (private), location, services
3. Submits → gets registration ID
4. Waits 3-5 days for MoH verification
5. Receives notification: "Your facility is verified"
6. Can now add staff, inventory, use POS

### Patient Buys Medicine at Pharmacy
1. Pharmacist scans product QR code
2. Product auto-fills: name, price, batch
3. Patient provides phone number
4. Selects payment: MTAA Wallet / M-Pesa / Cash
5. Payment processed → stock deducted
6. Patient gets receipt in app
7. Inventory transaction logged for audit

### Government Inspector Verifies Facility
1. Logs in as inspector
2. Views "Verify Facilities" dashboard
3. Sees all pending registrations
4. Reviews: license, documents, founder info
5. Clicks "Verify & Activate" or "Reject"
6. Facility becomes active in system

### Founder Dies — Succession
1. Successor submits succession request
2. Uploads: death certificate, court order, succession document
3. Government inspector reviews
4. Approves → new admin gets founder permissions
5. Facility continues operating

## Scale: Clinic to 5000-Bed Hospital

| Feature | Pharmacy (Level 1) | Clinic (Level 2) | Hospital (Level 5-6) |
|---------|-------------------|------------------|---------------------|
| Bed capacity | 0 | 1-10 | 100-5000 |
| Inventory | Medications only | Basic supplies | Full pharmacy + equipment |
| Staff | 1-2 | 2-5 | 50-2000 |
| Services | Dispensing | Outpatient | Emergency, ICU, Surgery |
| POS | Simple QR scan | Basic billing | Full billing + insurance |
| Government oversight | County level | County level | National + County |
