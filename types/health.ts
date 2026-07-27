// types/health.ts
// MTAA Health module type definitions
// Imported by: lib/services/health-service.ts

export interface HealthPatient {
  id: string;
  user_id: string;
  patient_number: string;
  blood_type?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider_id?: string;
  insurance_policy_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: string;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthPrescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medications: HealthMedication[];
  instructions?: string;
  status: 'pending' | 'dispensed' | 'partial' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface HealthMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface HealthLabResult {
  id: string;
  patient_id: string;
  test_type: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  status: 'pending' | 'completed' | 'abnormal' | 'critical';
  ordered_by?: string;
  facility_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  level?: string;
  address: string;
  phone?: string;
  email?: string;
  services?: string[];
  latitude?: number;
  longitude?: number;
  is_open?: boolean;
  rating?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface HealthDoctor {
  id: string;
  user_id: string;
  facility_id?: string;
  specialization: string;
  license_number: string;
  years_experience?: number;
  rating?: number;
  availability?: Record<string, string[]>;
  status: 'active' | 'on_leave' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface HealthInsurancePolicy {
  id: string;
  user_id: string;
  provider_id: string;
  policy_number: string;
  coverage_type: string;
  premium_amount: number;
  coverage_limit: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  dependents?: number;
  created_at: string;
  updated_at?: string;
}

export interface HealthAmbulanceDispatch {
  id: string;
  patient_id: string;
  ambulance_unit_id: string;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_facility_id: string;
  status: 'dispatched' | 'en_route' | 'arrived' | 'transporting' | 'completed' | 'cancelled';
  eta_minutes?: number;
  dispatched_at: string;
  arrived_at?: string;
  completed_at?: string;
  handover_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthEmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

export interface HealthVisit {
  id: string;
  patient_id: string;
  facility_id: string;
  doctor_id?: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: string;
  total_cost?: number;
  status: 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface HealthStaff {
  id: string;
  user_id: string;
  facility_id: string;
  role: string;
  department: string;
  license_number?: string;
  specialization?: string;
  shift_preference?: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  joined_at: string;
  created_at: string;
  updated_at?: string;
}

export interface HealthAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  details?: any;
  created_at: string;
}

export interface HealthRadiologyRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id?: string;
  exam_type: string;
  body_part: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  findings?: string;
  impression?: string;
  images?: string[];
  created_at: string;
  updated_at?: string;
}

export interface HealthChildrenRecord {
  id: string;
  child_id: string;
  parent_id: string;
  birth_weight?: number;
  birth_height?: number;
  vaccinations?: any[];
  growth_records?: any[];
  allergies?: string[];
  created_at: string;
  updated_at?: string;
}

export type HealthRole = 'patient' | 'doctor' | 'nurse' | 'admin' | 'pharmacist' | 'lab_tech' | 'ambulance_driver';
