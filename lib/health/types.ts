export interface HealthProvider {
  id: string;
  name: string;
  type: string;
  specialty?: string;
  location?: string;
  rating?: number;
  phone?: string;
  email?: string;
  status: string;
}

export interface HealthPatient {
  id: string;
  user_id: string;
  name: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  allergies?: string[];
  medical_conditions?: string[];
  emergency_contact?: string;
  status: string;
}

export interface HealthAppointment {
  id: string;
  patient_id: string;
  provider_id: string;
  scheduled_date: string;
  status: string;
  type: string;
  notes?: string;
}

export interface HealthOrder {
  id: string;
  patient_id: string;
  pharmacy_id: string;
  medications: any[];
  status: string;
  total_amount: number;
}

export interface HealthRecord {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
}

export interface HealthPrescription {
  id: string;
  patient_id: string;
  provider_id: string;
  medications: any[];
  status: string;
  created_at: string;
}

export interface HealthLabTest {
  id: string;
  patient_id: string;
  test_type: string;
  result_status: string;
  results?: string;
  ordered_date: string;
}

export interface HealthNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface HealthInsuranceClaim {
  id: string;
  patient_id: string;
  provider_id: string;
  amount: number;
  status: string;
  submitted_date: string;
}

export interface HealthSymptomCheck {
  id: string;
  patient_id: string;
  symptoms: string[];
  severity: string;
  duration_days: number;
  body_areas: string[];
  recommendation?: string;
  created_at: string;
}

export interface HealthTelemedicineSession {
  id: string;
  patient_id: string;
  provider_id: string;
  status: string;
  started_at?: string;
  ended_at?: string;
}

export interface HealthPharmacy {
  id: string;
  name: string;
  location: string;
  phone?: string;
  status: string;
}

export interface HealthMedication {
  id: string;
  pharmacy_id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity?: number;
  status: string;
}

// Additional types needed by services
export interface HealthAmbulanceRequest {
  id: string;
  requester_id: string;
  patient_id?: string;
  pickup_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  destination?: string;
  status: 'pending' | 'dispatched' | 'en_route' | 'on_scene' | 'transporting' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface HealthEHRRecord {
  id: string;
  patient_id: string;
  provider_id: string;
  facility_id: string;
  record_type: 'visit' | 'lab' | 'imaging' | 'prescription' | 'referral';
  data: Record<string, any>;
  encrypted: boolean;
  access_log: { user_id: string; accessed_at: string; action: string }[];
  created_at: string;
  updated_at: string;
}

export interface HealthPharmacyOrder {
  id: string;
  pharmacy_id: string;
  patient_id: string;
  prescription_id?: string;
  items: { name: string; quantity: number; dosage?: string }[];
  status: 'pending' | 'confirmed' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface HealthVaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name: string;
  dose_number: number;
  administered_by: string;
  facility_id: string;
  administered_at: string;
  next_due_date?: string;
  batch_number?: string;
  notes?: string;
  created_at: string;
}

export interface HealthHospital {
  id: string;
  name: string;
  registration_number: string;
  level: '1' | '2' | '3' | '4' | '5' | '6';
  location: string;
  lat?: number;
  lng?: number;
  status: 'active' | 'suspended' | 'closed';
  admin_id: string;
  created_at: string;
  updated_at: string;
}

export interface HealthDepartment {
  id: string;
  hospital_id: string;
  name: string;
  head_id?: string;
  capacity: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface HealthBed {
  id: string;
  hospital_id: string;
  department_id: string;
  bed_number: string;
  type: 'general' | 'icu' | 'maternity' | 'pediatric' | 'emergency';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patient_id?: string;
  created_at: string;
}

export interface HealthPractitioner {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string;
  hospital_id?: string;
  department_id?: string;
  status: 'active' | 'suspended' | 'on_leave' | 'retired';
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface HealthAlert {
  id: string;
  type: 'outbreak' | 'drug_recall' | 'vaccination_drive' | 'general';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_regions?: string[];
  active: boolean;
  created_by: string;
  created_at: string;
  expires_at?: string;
}
