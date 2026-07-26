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
