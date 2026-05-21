// lib/health/types.ts
// Generated from MTAA schema: health_patients, health_appointments, health_hospitals, etc.

export interface HealthPatient {
  id: string;
  user_id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: any[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  status: 'active' | 'inactive' | 'deceased';
  primary_physician_id?: string;
  last_visit_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthAppointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  provider_id: string;
  provider_type: string;
  appointment_type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup' | 'specialist' | 'telemedicine';
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  reason?: string;
  notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  checked_in_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthHospital {
  id: string;
  account_id?: string;
  name: string;
  registration_number?: string;
  hospital_type: 'public' | 'private' | 'faith_based' | 'community';
  level: 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5' | 'level_6';
  county_name?: string;
  sub_county_name?: string;
  ward_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  sha_accredited: boolean;
  nhif_accredited: boolean;
  bed_capacity: number;
  emergency_services: boolean;
  ambulance_count: number;
  specialties: any[];
  operating_hours: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface HealthPractitioner {
  id: string;
  account_id?: string;
  license_number: string;
  practitioner_type: 'doctor' | 'nurse' | 'clinical_officer' | 'pharmacist' | 'lab_tech' | 'radiologist' | 'physiotherapist' | 'specialist';
  specialization?: string;
  hospital_id?: string;
  is_verified: boolean;
  verification_date?: string;
  status: 'active' | 'suspended' | 'revoked' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  record_code: string;
  patient_id: string;
  appointment_id?: string;
  provider_id: string;
  record_type: string;
  title: string;
  description?: string;
  findings?: string;
  attachments: any[];
  lab_results: Record<string, any>;
  vital_signs: Record<string, any>;
  is_confidential: boolean;
  access_log: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthEHRRecord {
  id: string;
  patient_id: string;
  hospital_id?: string;
  practitioner_id?: string;
  visit_date: string;
  visit_type: 'outpatient' | 'inpatient' | 'emergency' | 'telemedicine' | 'follow_up';
  chief_complaint?: string;
  diagnosis_codes: any[];
  diagnosis_notes?: string;
  prescriptions: any[];
  lab_results: any[];
  procedures: any[];
  vitals: Record<string, any>;
  attachments: any[];
  is_confidential: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthLabTest {
  id: string;
  patient_id: string;
  hospital_id?: string;
  ehr_record_id?: string;
  test_name: string;
  test_category?: string;
  test_code?: string;
  results: Record<string, any>;
  result_status: 'pending' | 'in_progress' | 'completed' | 'abnormal';
  ordered_by?: string;
  conducted_by?: string;
  ordered_date: string;
  result_date?: string;
  cost: number;
  created_at: string;
  updated_at: string;
}

export interface HealthPharmacyOrder {
  id: string;
  patient_id?: string;
  hospital_id?: string;
  prescription_id?: string;
  items: any[];
  total_amount: number;
  order_status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface HealthBed {
  id: string;
  hospital_id: string;
  department_id: string;
  bed_number: string;
  bed_type: 'standard' | 'icu' | 'pediatric' | 'maternity' | 'isolation' | 'emergency';
  ward_name?: string;
  room_number?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  current_patient_id?: string;
  assigned_practitioner_id?: string;
  admission_date?: string;
  expected_discharge_date?: string;
  daily_rate: number;
  equipment: any[];
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthDepartment {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  department_type: 'emergency' | 'outpatient' | 'inpatient' | 'laboratory' | 'pharmacy' | 'radiology' | 'surgery' | 'maternity' | 'pediatrics' | 'icu' | 'morgue' | 'administration';
  description?: string;
  floor_number?: string;
  wing?: string;
  phone_extension?: string;
  is_active: boolean;
  head_practitioner_id?: string;
  max_capacity: number;
  current_occupancy: number;
  avg_wait_minutes: number;
  operating_hours: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthQueue {
  id: string;
  hospital_id: string;
  department_id: string;
  patient_id: string;
  queue_number: string;
  priority_score: number;
  triage_level: 'critical' | 'urgent' | 'semi_urgent' | 'routine' | 'non_urgent';
  chief_complaint?: string;
  vital_signs: Record<string, any>;
  estimated_wait_minutes: number;
  status: 'waiting' | 'in_consultation' | 'with_nurse' | 'with_lab' | 'with_pharmacy' | 'completed' | 'transferred' | 'left';
  assigned_practitioner_id?: string;
  room_assigned?: string;
  checked_in_at: string;
  called_at?: string;
  consultation_started_at?: string;
  consultation_ended_at?: string;
  checked_out_at?: string;
  created_by: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthAlert {
  id: string;
  hospital_id: string;
  alert_type: 'emergency' | 'critical' | 'staff_shortage' | 'bed_shortage' | 'equipment_failure' | 'infection_outbreak' | 'medicine_shortage' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_department_id?: string;
  affected_bed_id?: string;
  triggered_by?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  auto_resolve_at?: string;
  is_resolved: boolean;
  is_acknowledged: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthAmbulanceRequest {
  id: string;
  requester_account_id?: string;
  patient_name?: string;
  patient_phone?: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_hospital_id?: string;
  emergency_type: 'cardiac' | 'trauma' | 'maternity' | 'respiratory' | 'poisoning' | 'other';
  status: 'pending' | 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  dispatcher_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  eta_minutes?: number;
  cost: number;
  payment_status: 'pending' | 'paid' | 'waived' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface HealthVaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name: string;
  vaccine_code?: string;
  dose_number: number;
  total_doses: number;
  administered_date: string;
  administered_by?: string;
  hospital_id?: string;
  batch_number?: string;
  expiry_date?: string;
  next_dose_date?: string;
  side_effects: any[];
  created_at: string;
}

export interface HealthInsurance {
  id: string;
  user_id: string;
  provider_name: string;
  policy_number: string;
  cover_type?: string;
  premium_amount: number;
  valid_from?: string;
  valid_until?: string;
  dependents: number;
  is_active: boolean;
  created_at: string;
}

export interface HealthStaffAssignment {
  id: string;
  practitioner_id: string;
  hospital_id: string;
  department_id: string;
  role_in_department: 'head' | 'senior' | 'staff' | 'resident' | 'intern';
  shift_type: 'day' | 'night' | 'on_call' | 'weekend' | 'emergency';
  schedule_start: string;
  schedule_end: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  is_active: boolean;
  max_patients_per_shift: number;
  current_patient_count: number;
  notes?: string;
  assigned_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthSHAFundPool {
  id: string;
  pool_name: string;
  pool_code: string;
  pool_type: 'national' | 'county' | 'private' | 'community';
  covered_counties: any[];
  annual_budget: number;
  current_balance: number;
  status: 'active' | 'suspended' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  ownership: string;
  level: number;
  county?: string;
  town?: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  is_24hr: boolean;
  has_emergency: boolean;
  specialties: string[];
  bed_capacity: number;
  is_active: boolean;
  created_at: string;
}
