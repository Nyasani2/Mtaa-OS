# Health Module Fixes — MTAA OS V10

## Bugs Fixed (6 total)

### 1. Find Care → departments column error
**File:** `lib/health/hooks/useFindCare.ts`
**Fix:** Removed `departments` from all `.select()` calls against `health_facilities`. The table does not have this column.

### 2. Ambulance Dispatch button does nothing
**Files:** `lib/health/hooks/useAmbulanceDispatch.ts` + `app/(os)/health/ambulance/dispatch/index.tsx`
**Fixes:**
- Hook now catches errors and returns `{success, error}` properly
- Added fallback to `health_facilities` if `health_ambulance_units` table doesn't exist
- Screen now shows `Alert.alert()` on both success and failure
- Removed hardcoded `priority` field if column missing (auto-retry without it)

### 3. Doctor Schedule tab = placeholder
**File:** `app/(os)/health/doctor/index.tsx`
**Fix:** Fully wired to `health_appointments` table. Queue shows pending/confirmed appointments. Schedule shows all today's appointments. Patients tab shows patients with `primary_doctor_id = user.id`. All real data, no mocks.

### 4. Cashier Invoices → queryKey is not iterable crash
**File:** `lib/health/hooks/useCashier.ts`
**Fix:** Replaced broken `usePaginatedQuery` call with standard `useQuery({ queryKey: [...], queryFn: ... })`. Also simplified to use `health_billing` table directly.

### 5. Staff → infinite "Loading staff..."
**Files:** `lib/health/hooks/useHospitalAdmin.ts` + `app/(os)/health/hospital-admin/staff/index.tsx`
**Fixes:**
- Hook now sets `loading=false` immediately when `facilityId` is null (was hanging forever)
- Screen shows facility selector when no facility selected
- Fixed queries to use correct tables: `health_admissions` for admissions, `health_discharges` for discharges, `health_beds` for beds

### 6. Appointments → 404
**File:** `app/(os)/health/hospital-admin/appointments/index.tsx` (NEW)
**Fix:** Created missing route file. Full appointments list with search, status filters, confirm/cancel actions. Queries `health_appointments` with facility filter.

---

## Installation

```bash
cd ~/MTAA_OS_V10

# Backup existing files first
mkdir -p backups/health-fixes-$(date +%Y%m%d)
cp lib/health/hooks/useFindCare.ts backups/ 2>/dev/null || true
cp lib/health/hooks/useAmbulanceDispatch.ts backups/ 2>/dev/null || true
cp app/(os)/health/ambulance/dispatch/index.tsx backups/ 2>/dev/null || true
cp app/(os)/health/doctor/index.tsx backups/ 2>/dev/null || true
cp lib/health/hooks/useCashier.ts backups/ 2>/dev/null || true
cp lib/health/hooks/useHospitalAdmin.ts backups/ 2>/dev/null || true
cp app/(os)/health/hospital-admin/staff/index.tsx backups/ 2>/dev/null || true

# Extract the ZIP (adjust path if downloaded to ~/Downloads)
cd ~/MTAA_OS_V10
unzip -o ~/Downloads/health_module_fixes.zip -d .

# Verify no TypeScript errors
npx tsc --noEmit 2>&1 | head -30
```

## Schema Assumptions
These fixes assume the following tables exist (per your schema reference):
- `health_facilities` — id, name, type, address, city, phone, email, rating, is_24h, latitude, longitude, created_at
- `health_appointments` — id, patient_id, doctor_id, facility_id, appointment_date, appointment_time, status, type, notes
- `health_beds` — id, facility_id, bed_number, ward, room_type, floor, status
- `health_admissions` — id, patient_id, bed_id, facility_id, doctor_id, diagnosis, admission_date, status
- `health_discharges` — id, admission_id, patient_id, facility_id, bed_id, diagnosis, discharge_date, discharge_type, medications
- `health_staff` — id, facility_id, name, email, phone, role, department, license_number, status
- `health_billing` — id, facility_id, patient_id, amount, status, items, created_at, paid_at
- `health_patients` — id, user_id, name, phone, date_of_birth, gender, blood_type, allergies, primary_doctor_id
- `health_ambulance_dispatches` — id, patient_name, patient_phone, pickup_address, destination_address, notes, status, requested_by, created_at, unit_id (optional)
- `health_ambulance_units` — id, unit_number, unit_type, status, current_location, driver_name, paramedic_name (optional — fallback to health_facilities)

If any table/column names differ, let me know and I'll regenerate.
