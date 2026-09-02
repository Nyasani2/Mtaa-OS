# MTAA HEALTH SYSTEM — MASTER AUDIT REPORT

**Generated:** Wed Sep  2 07:42:39 AM EAT 2026
**Commit:** 527dbab5c

## 1. HEALTH ROUTES INVENTORY
Total Health-Related Screens Found: 109

### Module: `(education)` (2 screens)
- `app/(education)/emergency/index.tsx`
- `app/(education)/emergency/roll-call.tsx`

### Module: `(os)` (106 screens)
- `app/(os)/health/_layout.tsx`
- `app/(os)/health/ambulance/dispatch/index.tsx`
- `app/(os)/health/ambulance/handover/index.tsx`
- `app/(os)/health/ambulance/index.tsx`
- `app/(os)/health/appointments/detail.tsx`
- `app/(os)/health/appointments/index.tsx`
- `app/(os)/health/cashier/insurance/index.tsx`
- `app/(os)/health/cashier/invoices/index.tsx`
- `app/(os)/health/cashier/payments/index.tsx`
- `app/(os)/health/cashier/payments/new.tsx`
- `app/(os)/health/cashier/revenue/index.tsx`
- `app/(os)/health/children/health-record/index.tsx`
- `app/(os)/health/children/index.tsx`
- `app/(os)/health/doctor/admit.tsx`
- `app/(os)/health/doctor/earnings/index.tsx`
- `app/(os)/health/doctor/follow-ups/index.tsx`
- `app/(os)/health/doctor/index.tsx`
- `app/(os)/health/doctor/lab-orders/index.tsx`
- `app/(os)/health/doctor/notes/index.tsx`
- `app/(os)/health/doctor/orders/index.tsx`
- `app/(os)/health/doctor/patient/[id].tsx`
- `app/(os)/health/doctor/prescribe/index.tsx`
- `app/(os)/health/doctor/queue/index.tsx`
- `app/(os)/health/doctor/schedule/index.tsx`
- `app/(os)/health/emergency-card/index.tsx`
- `app/(os)/health/emergency/index.tsx`
- `app/(os)/health/facility-onboard/index.tsx`
- `app/(os)/health/facility-register/index.tsx`
- `app/(os)/health/facility/index.tsx`
- `app/(os)/health/find-care/index.tsx`
- `app/(os)/health/government/index.tsx`
- `app/(os)/health/government/population/add.tsx`
- `app/(os)/health/government/population/detail.tsx`
- `app/(os)/health/government/population/index.tsx`
- `app/(os)/health/government/surveillance/index.tsx`
- `app/(os)/health/government/verify-facilities/index.tsx`
- `app/(os)/health/herbal-pharmacy/index.tsx`
- `app/(os)/health/hospital-admin/accounting/index.tsx`
- `app/(os)/health/hospital-admin/admissions/index.tsx`
- `app/(os)/health/hospital-admin/appointments/index.tsx`
- `app/(os)/health/hospital-admin/beds/index.tsx`
- `app/(os)/health/hospital-admin/discharges/index.tsx`
- `app/(os)/health/hospital-admin/index.tsx`
- `app/(os)/health/hospital-admin/inventory/index.tsx`
- `app/(os)/health/hospital-admin/pos/index.tsx`
- `app/(os)/health/hospital-admin/revenue/index.tsx`
- `app/(os)/health/hospital-admin/staff/index.tsx`
- `app/(os)/health/hospital-admin/wallet/index.tsx`
- `app/(os)/health/index.tsx`
- `app/(os)/health/insurance/claim-detail.tsx`
- `app/(os)/health/insurance/claims/[id].tsx`
- `app/(os)/health/insurance/claims/new/index.tsx`
- `app/(os)/health/insurance/dashboard/index.tsx`
- `app/(os)/health/insurance/index.tsx`
- `app/(os)/health/insurance/policy-detail.tsx`
- `app/(os)/health/lab-results/index.tsx`
- `app/(os)/health/lab/critical/index.tsx`
- `app/(os)/health/lab/equipment/index.tsx`
- `app/(os)/health/lab/index.tsx`
- `app/(os)/health/lab/queue/index.tsx`
- `app/(os)/health/lab/results/index.tsx`
- `app/(os)/health/lab/samples/index.tsx`
- `app/(os)/health/map/index.tsx`
- `app/(os)/health/medications/add.tsx`
- `app/(os)/health/medications/index.tsx`
- `app/(os)/health/nurse/beds/index.tsx`
- `app/(os)/health/nurse/handover/index.tsx`
- `app/(os)/health/nurse/index.tsx`
- `app/(os)/health/nurse/medication/index.tsx`
- `app/(os)/health/nurse/meds/index.tsx`
- `app/(os)/health/nurse/vitals/index.tsx`
- `app/(os)/health/onboard/driver.tsx`
- `app/(os)/health/onboard/index.tsx`
- `app/(os)/health/patient/consent/index.tsx`
- `app/(os)/health/patient/traditional/index.tsx`
- `app/(os)/health/pharmacy/dispense/index.tsx`
- `app/(os)/health/pharmacy/index.tsx`
- `app/(os)/health/pharmacy/interactions/index.tsx`
- `app/(os)/health/pharmacy/inventory/index.tsx`
- `app/(os)/health/pharmacy/map.tsx`
- `app/(os)/health/pharmacy/pos/index.tsx`
- `app/(os)/health/pharmacy/queue/index.tsx`
- `app/(os)/health/pharmacy/register.tsx`
- `app/(os)/health/pharmacy/suppliers/index.tsx`
- `app/(os)/health/prescriptions/index.tsx`
- `app/(os)/health/radiology/index.tsx`
- `app/(os)/health/radiology/report/index.tsx`
- `app/(os)/health/radiology/request/index.tsx`
- `app/(os)/health/records/detail.tsx`
- `app/(os)/health/records/index.tsx`
- `app/(os)/health/share/grant.tsx`
- `app/(os)/health/share/index.tsx`
- `app/(os)/health/system/analytics/index.tsx`
- `app/(os)/health/system/audit/index.tsx`
- `app/(os)/health/system/integrations/index.tsx`
- `app/(os)/health/system/notifications/index.tsx`
- `app/(os)/health/system/retention/index.tsx`
- `app/(os)/health/system/roles/index.tsx`
- `app/(os)/health/system/settings/index.tsx`
- `app/(os)/health/telemedicine/call.tsx`
- `app/(os)/health/telemedicine/index.tsx`
- `app/(os)/health/traditional-healer/index.tsx`
- `app/(os)/health/traditional-healer/remedies/index.tsx`
- `app/(os)/health/vitals/index.tsx`
- `app/(os)/health/wallet/index.tsx`
- `app/(os)/wallet/insurance-hub.tsx`

### Module: `health` (1 screens)
- `app/health/pharmacy/register.tsx`

## 2. HEALTH SERVICES, HOOKS & STORES
Total Health Logic Files: 107

- `lib/components/health/HealthErrorBoundary.tsx`
- `lib/components/health/OfflineBanner.tsx`
- `lib/components/health/PaginatedList.tsx`
- `lib/components/health/RoleGuard.tsx`
- `lib/health/asis/health-asis.ts`
- `lib/health/asis/index.ts`
- `lib/health/components/AppointmentList.tsx`
- `lib/health/components/DashboardStats.tsx`
- `lib/health/components/HealthShell.tsx`
- `lib/health/components/PharmacyBrowser.tsx`
- `lib/health/components/ProviderCard.tsx`
- `lib/health/components/RecordViewer.tsx`
- `lib/health/components/SymptomChecker.tsx`
- `lib/health/components/UpcomingAppointments.tsx`
- `lib/health/controllers/health.controller.ts`
- `lib/health/hooks/index.ts`
- `lib/health/hooks/useAmbulance.ts`
- `lib/health/hooks/useAmbulanceDispatch.ts`
- `lib/health/hooks/useAppointments.ts`
- `lib/health/hooks/useCashier.ts`
- `lib/health/hooks/useChildren.ts`
- `lib/health/hooks/useDoctor.ts`
- `lib/health/hooks/useEmergency.ts`
- `lib/health/hooks/useFacility.ts`
- `lib/health/hooks/useFindCare.ts`
- `lib/health/hooks/useGovernment.ts`
- `lib/health/hooks/useHealthAuth.ts`
- `lib/health/hooks/useHealthEmergency.ts`
- `lib/health/hooks/useHealthMedications.ts`
- `lib/health/hooks/useHealthProfile.ts`
- `lib/health/hooks/useHealthRole.ts`
- `lib/health/hooks/useHealthSharing.ts`
- `lib/health/hooks/useHealthVault.ts`
- `lib/health/hooks/useHospital.ts`
- `lib/health/hooks/useHospitalAccounting.ts`
- `lib/health/hooks/useHospitalAdmin.ts`
- `lib/health/hooks/useHospitalInventory.ts`
- `lib/health/hooks/useHospitalPOS.ts`
- `lib/health/hooks/useHospitalWallet.ts`
- `lib/health/hooks/useInsurance.ts`
- `lib/health/hooks/useLab.ts`
- `lib/health/hooks/useNetworkStatus.ts`
- `lib/health/hooks/useNotifications.ts`
- `lib/health/hooks/useNurse.ts`
- `lib/health/hooks/usePaginatedQuery.ts`
- `lib/health/hooks/usePatient.ts`
- `lib/health/hooks/usePatientConsent.ts`
- `lib/health/hooks/usePharmacies.ts`
- `lib/health/hooks/usePharmacy.ts`
- `lib/health/hooks/useProviders.ts`
- `lib/health/hooks/useRadiology.ts`
- `lib/health/hooks/useRecords.ts`
- `lib/health/hooks/useRoleGuard.ts`
- `lib/health/hooks/useSymptomChecker.ts`
- `lib/health/hooks/useSystem.ts`
- `lib/health/hooks/useTelemedicine.ts`
- `lib/health/hooks/useTraditionalHealer.ts`
- `lib/health/hooks/useTraditionalMedicine.ts`
- `lib/health/hooks/useVitals.ts`
- `lib/health/hooks/useWalletHealth.ts`
- `lib/health/profile-integration.ts`
- `lib/health/security/emergency-card.ts`
- `lib/health/security/health-auth.ts`
- `lib/health/security/health-crypto.ts`
- `lib/health/security/health-qr.ts`
- `lib/health/security/health-vault.ts`
- `lib/health/security/index.ts`
- `lib/health/services/ambulance.service.ts`
- `lib/health/services/appointment.service.ts`
- `lib/health/services/cashier.service.ts`
- `lib/health/services/children.service.ts`
- `lib/health/services/doctor.service.ts`
- `lib/health/services/ehr.service.ts`
- `lib/health/services/emergency.service.ts`
- `lib/health/services/facility.service.ts`
- `lib/health/services/health-role.service.ts`
- `lib/health/services/health-service.ts`
- `lib/health/services/hospital-admin.service.ts`
- `lib/health/services/hospital.service.ts`
- `lib/health/services/index.ts`
- `lib/health/services/insurance.service.ts`
- `lib/health/services/lab.service.ts`
- `lib/health/services/notification.service.ts`
- `lib/health/services/nurse.service.ts`
- `lib/health/services/patient.service.ts`
- `lib/health/services/pharmacy-service.ts`
- `lib/health/services/pharmacy.service.ts`
- `lib/health/services/provider.service.ts`
- `lib/health/services/radiology.service.ts`
- `lib/health/services/record.service.ts`
- `lib/health/services/symptom.service.ts`
- `lib/health/services/system.service.ts`
- `lib/health/services/telemedicine.service.ts`
- `lib/health/services/vitals.service.ts`
- `lib/health/services/wallet-health.service.ts`
- `lib/health/state/health.store.ts`
- `lib/health/types.ts`
- `lib/health/types/health-profile.ts`
- `lib/health/types/health-record.ts`
- `lib/health/types/index.ts`
- `lib/hooks/useHealth.ts`
- `lib/hookup/bootstrap/hookup-health.ts`
- `lib/hookup/scaling/hookup-health-check.ts`
- `lib/modules/health/manifest.ts`
- `lib/mtaa/apps/health-manifest.ts`
- `lib/mtaa/appstore/apps/health/manifest.ts`
- `lib/services/health-service.ts`

## 3. HEALTH EDGE FUNCTIONS
Total Health Edge Functions: 3

- `health-operations`
- `health-pharmacies`
- `kernel-health-snapshot`

## 4. HEALTH STUBS, MOCKS & PLACEHOLDERS
Total Health-Specific Stubs Found: 98

### `app/(agent)/onboarding.tsx`
- Line 267: function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder }: any) {

### `app/(education)/school/head-teacher.tsx`
- Line 96: <ActionCard icon="document-text-outline" label="Policies" color="#64748b" onPress={() => Alert.alert("School Policies", "Policies management coming soon.")} />

### `app/(education)/schools/[schoolId]/add-teacher.tsx`
- Line 147: function Input({ label, value, onChange, placeholder, keyboardType }) {

### `app/(education)/schools/invite-teacher.tsx`
- Line 25: const Input = ({ label, value, onChangeText, placeholder, required = false }: any) => (

### `app/(education)/timetable/create/index.tsx`
- Line 70: { label: "Institution ID", value: institutionId, setter: setInstitutionId, placeholder: "Enter institution UUID" },
- Line 71: { label: "Class ID (optional)", value: classId, setter: setClassId, placeholder: "Enter class UUID" },
- Line 72: { label: "Subject", value: subject, setter: setSubject, placeholder: "e.g. Mathematics" },
- Line 73: { label: "Teacher ID (optional)", value: teacherId, setter: setTeacherId, placeholder: "Enter teacher UUID" },
- Line 74: { label: "Room (optional)", value: room, setter: setRoom, placeholder: "e.g. Room 101" },

### `app/(jobs)/onboarding.tsx`
- Line 259: function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder, multiline }: any) {

### `app/(mtruck)/onboarding.tsx`
- Line 243: function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder }: any) {

### `app/(mtruck)/request-haul.tsx`
- Line 295: <Text style={styles.toggleLabel}>Temperature Controlled</Text>

### `app/(os)/admin.tsx`
- Line 271: { id: `L${layerNum}.1`, label: `${layerName} module loaded`, status: 'SKIP', message: 'Placeholder — expand with real tests' },
- Line 272: { id: `L${layerNum}.2`, label: `${layerName} routes registered`, status: 'SKIP', message: 'Placeholder — expand with real tests' },
- Line 273: { id: `L${layerNum}.3`, label: `${layerName} services available`, status: 'SKIP', message: 'Placeholder — expand with real tests' },

### `app/(os)/health/ambulance/index.tsx`
- Line 148: ListEmptyComponent={

### `app/(os)/health/cashier/insurance/index.tsx`
- Line 138: ListEmptyComponent={<Text style={styles.empty}>No {filter} claims found.</Text>}

### `app/(os)/health/cashier/invoices/index.tsx`
- Line 139: ListEmptyComponent={<Text style={styles.empty}>No {filter} invoices found.</Text>}

### `app/(os)/health/cashier/payments/index.tsx`
- Line 117: ListEmptyComponent={<Text style={styles.empty}>No {filter !== 'all' ? filter + ' ' : ''}payments found.</Text>}

### `app/(os)/health/children/health-record/index.tsx`
- Line 43: // Mock data for child ID
- Line 219: {/* Growth Chart Placeholder */}

### `app/(os)/health/doctor/follow-ups/index.tsx`
- Line 302: ListEmptyComponent={

### `app/(os)/health/doctor/notes/index.tsx`
- Line 117: ListEmptyComponent={<Text style={styles.empty}>No notes found.</Text>}

### `app/(os)/health/doctor/orders/index.tsx`
- Line 284: ListEmptyComponent={

### `app/(os)/health/doctor/patient/[id].tsx`
- Line 31: temperature: number;
- Line 62: health_profiles (blood_pressure, heart_rate, temperature, oxygen_saturation, weight, height, bmi, recorded_at),
- Line 78: if (vitals?.temperature > 38) flags.push({ type: 'warning', message: 'Fever: ' + vitals.temperature + 'C' });
- Line 85: temperature: vitals.temperature,
- Line 256: <VitalCard icon={<Thermometer size={20} color="#f59e0b" />} label="Temperature" value={`${patient.vitals.temperature}`} unit="C" />

### `app/(os)/health/emergency/index.tsx`
- Line 111: ListEmptyComponent={

### `app/(os)/health/find-care/index.tsx`
- Line 101: ListEmptyComponent={<View style={s.emptyState}><Ionicons name={activeTab==='facilities'?'business-outline':'people-outline'} size={64} color="#cbd5e1"/><Text style={s.emptyTitle}>{query?'No results':`No ${activeTab}`}</Text><Text style={s.emptySub}>Pull down to refresh.</Text></View>}

### `app/(os)/health/hospital-admin/inventory/index.tsx`
- Line 83: <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>No items found</Text>} />

### `app/(os)/health/lab/index.tsx`
- Line 152: ListEmptyComponent={

### `app/(os)/health/lab/results/index.tsx`
- Line 41: const resultList = existing.length > 0 ? existing : getTestTemplate(data.test_name);
- Line 48: const getTestTemplate = (testName: string): ResultField[] => {
- Line 49: const templates: Record<string, ResultField[]> = {
- Line 70: return templates[testName] || [{ id: 'td', parameter: 'Result', value: '', unit: '', reference_low: null, reference_high: null, flag: null }];

### `app/(os)/health/lab/samples/index.tsx`
- Line 131: ListEmptyComponent={

### `app/(os)/health/map/index.tsx`
- Line 91: {/* Map Placeholder / List Hybrid */}
- Line 92: <View style={styles.mapPlaceholder}>
- Line 94: <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
- Line 95: <Text style={styles.mapPlaceholderSub}>
- Line 215: mapPlaceholder: {
- Line 224: mapPlaceholderText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
- Line 225: mapPlaceholderSub: { fontSize: 12, color: '#CBD5E1', marginTop: 4 },

### `app/(os)/health/nurse/index.tsx`
- Line 42: .select('*, patients(full_name, room_number, bed_number, admission_date, diagnosis), health_profiles(heart_rate, temperature, blood_pressure, recorded_at)')
- Line 51: const isCritical = lastVitals?.heart_rate > 120 || lastVitals?.temperature > 39;
- Line 188: ListEmptyComponent={

### `app/(os)/health/nurse/vitals/index.tsx`
- Line 22: const [newVital, setNewVital] = useState({ patient_id: '', temperature: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', notes: '' });
- Line 38: setNewVital({ patient_id: '', temperature: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', notes: '' });
- Line 45: case 'temperature': return value > 37.5 ? COLORS.danger : value > 37.0 ? COLORS.warning : COLORS.success;
- Line 95: {v.temperature && (
- Line 97: <Thermometer size={16} color={getVitalStatus('temperature', parseFloat(v.temperature))} />
- Line 98: <Text style={styles.vitalValue}>{v.temperature}C</Text>
- Line 99: <Text style={styles.vitalLabel}>Temp</Text>
- Line 162: <Text style={styles.inputLabel}>Temperature (C)</Text>

### `app/(os)/health/patient/traditional/index.tsx`
- Line 72: <FlatList data={tab === 'healers' ? healers : remedies} renderItem={tab === 'healers' ? renderHealer : renderRemedy} keyExtractor={(i: any) => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>No {tab} found</Text>} />

### `app/(os)/health/pharmacy/index.tsx`
- Line 147: ListEmptyComponent={

### `app/(os)/health/pharmacy/pos/index.tsx`
- Line 174: <Text style={styles.cartItemPrice}>${item.price.toFixed(2)} each</Text>
- Line 260: cartItemPrice: { fontSize: 12, color: COLORS.textLight },

### `app/(os)/health/radiology/index.tsx`
- Line 149: ListEmptyComponent={

### `app/(os)/health/radiology/report/index.tsx`
- Line 207: {/* Image Placeholder */}
- Line 212: <View key={i} style={styles.imagePlaceholder}>
- Line 264: imagePlaceholder: {

### `app/(os)/health/records/detail.tsx`
- Line 68: description: 'BP: 120/90 | HR: 78 | Temp: 36.5°C | SpO2: 98% | RR: 16 | Weight: 68kg',

### `app/(os)/health/records/index.tsx`
- Line 63: subtitle: 'BP: 140/90 | HR: 78 | Temp: 36.5C',

### `app/(os)/health/system/audit/index.tsx`
- Line 80: <TouchableOpacity onPress={() => Alert.alert("Export Audit", "Audit log export coming soon.")}>

### `app/(os)/health/telemedicine/index.tsx`
- Line 216: ListEmptyComponent={

### `app/(os)/health/traditional-healer/remedies/index.tsx`
- Line 63: <FlatList data={remedies} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Leaf size={48} color="#D1D5DB" /><Text style={styles.emptyText}>No remedies yet</Text></View>} />

### `app/(os)/health/vitals/index.tsx`
- Line 20: const [temperature, setTemperature] = useState("");
- Line 39: temperature: temperature ? parseFloat(temperature) : undefined,
- Line 48: setTemperature(""); setOxygenSaturation(""); setRespiratoryRate(""); setWeight("");
- Line 56: if (item.bp_systolic > 140 || item.heart_rate > 100 || item.temperature > 38) return "abnormal";
- Line 72: {item.temperature && <Text style={styles.meta}>Temp: {item.temperature}°C</Text>}
- Line 121: <Text style={styles.label}>Temp °C</Text>

### `app/(os)/profile/edit.tsx`
- Line 196: function Input({ label, value, onChange, placeholder, autoCapitalize = 'words', keyboardType = 'default' }: any) {

### `app/(os)/profile/professional/edit.tsx`
- Line 114: const renderInput = (label: string, key: keyof ProfessionalForm, placeholder: string, props?: any) => (

### `app/(os)/profile/professional/portfolio/index.tsx`
- Line 107: <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Portfolio editing will be available in the next update')}>

### `app/(os)/settings/network.tsx`
- Line 389: onPress={() => Alert.alert('Coming Soon', 'Detailed data usage breakdown will be available in a future update.')} />

### `app/(os)/wallet/insurance-hub.tsx`
- Line 11: <Text style={styles.subtitle}>Coming soon — under development</Text>

### `app/(restaurant)/onboarding.tsx`
- Line 231: <Input label="Price (KES)" value={newItemPrice} onChangeText={setNewItemPrice} icon="cash" keyboardType="decimal-pad" />
- Line 298: function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder, multiline }: any) {

### `app/(work)/jobs/portfolio/index.tsx`
- Line 77: { id: "templates", label: "Templates" },

### `lib/asis-cse/asis-cse-understanding-engine.ts`
- Line 262: // Detect temporal patterns if timestamps available

### `lib/health/components/AppointmentList.tsx`
- Line 20: ListEmptyComponent={<Text style={styles.empty}>No appointments</Text>} />

### `lib/health/components/SymptomChecker.tsx`
- Line 11: // Stub — would call AI service

### `lib/health/components/UpcomingAppointments.tsx`
- Line 36: ListEmptyComponent={<Text style={styles.empty}>No upcoming appointments</Text>}

### `lib/health/security/health-auth.ts`
- Line 19: failedAttempts: number;
- Line 28: maxFailedAttempts: number;
- Line 36: maxFailedAttempts: 5,
- Line 85: failedAttempts: 0,
- Line 167: state.failedAttempts = 0;
- Line 191: state.failedAttempts = 0;
- Line 197: state.failedAttempts++;
- Line 198: if (state.failedAttempts >= _config.maxFailedAttempts) {
- Line 200: state.failedAttempts = 0;

### `lib/health/services/vitals.service.ts`
- Line 14: if (r.bp_systolic > 140 || r.heart_rate > 100 || r.temperature > 38) return filter === "abnormal";

### `lib/mtaxi/components/LocationInput.tsx`
- Line 9: export default function LocationInput({ label, value, onChangeText, onGetCurrentLocation, placeholder }: Props) {

## 5. HEALTH DATABASE SCHEMA & RLS AUDIT
Total Health-Related Tables Found: 68

### RLS Status
- **Secured (RLS Enabled):** 68
- **🚨 CRITICAL RISK (RLS Missing):** 0

## 6. OVERLAP & DUPLICATION DETECTION (Consolidation Targets)
### Facility/Hospital/Clinic (5 tables)
- `health_doctor_hospitals`
- `health_facility_admins`
- `health_facility_registrations`
- `health_facility_successions`
- `health_hospitals`

### Professionals/Staff (6 tables)
- `health_doctor_hospitals`
- `health_doctors`
- `health_practitioners`
- `health_staff`
- `health_staff_assignments`
- `health_staff_invitations`

### Records/EHR (4 tables)
- `health_ehr_records`
- `health_records`
- `health_tax_records`
- `health_vaccination_records`

### Billing/Wallet/Insurance (10 tables)
- `health_billing`
- `health_insurance`
- `health_sha_claims`
- `health_sha_contributors`
- `health_sha_fund_pools`
- `health_sha_service_catalog`
- `health_wallet_transactions`
- `insurance_claims`
- `insurance_policies`
- `insurance_providers`

### Laboratory (2 tables)
- `health_lab_orders`
- `health_lab_tests`

### Pharmacy (6 tables)
- `health_drug_tracking`
- `health_pharmacy_inventory`
- `health_pharmacy_orders`
- `health_pharmacy_suppliers`
- `health_prescription_items`
- `health_prescriptions`

### Radiology (2 tables)
- `health_imaging_orders`
- `health_imaging_results`
