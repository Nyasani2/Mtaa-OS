export type UUID = string;

export interface HealthPatient {
  id: UUID; user_id: UUID; medical_record_number: string; blood_type: string | null;
  allergies: string[] | null; chronic_conditions: string[] | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  insurance_provider: string | null; insurance_policy_number: string | null;
  kyc_verified: boolean; created_at: string; updated_at: string;
}

export interface HealthProvider {
  id: UUID; user_id: UUID; license_number: string; specialty: string;
  sub_specialty: string | null; facility_name: string; facility_address: string | null;
  facility_phone: string | null; verification_status: 'pending' | 'verified' | 'rejected';
  rating: number; consultation_fee: number | null; available_for_telemedicine: boolean;
  created_at: string; updated_at: string;
}

export interface HealthAppointment {
  id: UUID; patient_id: UUID; provider_id: UUID;
  appointment_type: 'in_person' | 'telemedicine' | 'home_visit';
  scheduled_at: string; duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  symptoms: string | null; notes: string | null; meeting_link: string | null;
  created_at: string; updated_at: string;
}

export interface HealthMedicalRecord {
  id: UUID; patient_id: UUID; provider_id: UUID; appointment_id: UUID | null;
  record_type: 'diagnosis' | 'prescription' | 'lab_result' | 'imaging' | 'vaccination' | 'surgery' | 'referral' | 'note';
  title: string; description: string | null; attachments: string[] | null;
  diagnosis_codes: string[] | null; is_confidential: boolean;
  created_at: string; updated_at: string;
}

export interface HealthPrescription {
  id: UUID; record_id: UUID; patient_id: UUID; provider_id: UUID;
  medications: { name: string; dosage: string; frequency: string; duration: string; instructions?: string }[];
  status: 'active' | 'dispensed' | 'completed' | 'cancelled';
  pharmacy_id: UUID | null; created_at: string; updated_at: string;
}

export interface HealthLabTest {
  id: UUID; patient_id: UUID; provider_id: UUID; appointment_id: UUID | null;
  test_name: string; test_category: string; lab_name: string | null;
  status: 'ordered' | 'sample_collected' | 'in_progress' | 'results_ready' | 'cancelled';
  results: Record<string, unknown> | null; result_files: string[] | null;
  ordered_at: string; completed_at: string | null; created_at: string; updated_at: string;
}

export interface HealthPharmacy {
  id: UUID; name: string; license_number: string; address: string;
  phone: string | null; email: string | null;
  operating_hours: Record<string, string> | null; gps_coordinates: [number, number] | null;
  is_24h: boolean; delivery_available: boolean;
  verification_status: 'pending' | 'verified' | 'rejected'; rating: number;
  created_at: string; updated_at: string;
}

export interface HealthMedication {
  id: UUID; name: string; generic_name: string; brand_name: string | null;
  category: string; dosage_forms: string[]; strengths: string[];
  prescription_required: boolean; price: number; stock_quantity: number;
  pharmacy_id: UUID; requires_refrigeration: boolean;
  created_at: string; updated_at: string;
}

export interface HealthOrder {
  id: UUID; patient_id: UUID; prescription_id: UUID | null; pharmacy_id: UUID;
  items: { medication_id: UUID; quantity: number; unit_price: number }[];
  total_amount: number; status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string | null; delivery_fee: number | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string; updated_at: string;
}

export interface HealthInsuranceClaim {
  id: UUID; patient_id: UUID; provider_id: UUID; appointment_id: UUID | null;
  claim_number: string; diagnosis_codes: string[]; amount_claimed: number;
  amount_approved: number | null;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  rejection_reason: string | null; submitted_at: string; resolved_at: string | null;
  created_at: string; updated_at: string;
}

export interface HealthVaccination {
  id: UUID; patient_id: UUID; vaccine_name: string; vaccine_code: string;
  dose_number: number; total_doses: number; administered_by: UUID | null;
  administered_at: string; facility_name: string | null; next_due_date: string | null;
  certificate_url: string | null; created_at: string; updated_at: string;
}

export interface HealthEmergencyContact {
  id: UUID; patient_id: UUID; name: string; relationship: string;
  phone: string; email: string | null; address: string | null;
  is_primary: boolean; created_at: string; updated_at: string;
}

export interface HealthTelemedicineSession {
  id: UUID; appointment_id: UUID; patient_id: UUID; provider_id: UUID;
  session_status: 'waiting' | 'active' | 'ended' | 'failed';
  started_at: string | null; ended_at: string | null; duration_seconds: number | null;
  video_recording_url: string | null;
  chat_log: { sender: string; message: string; timestamp: string }[] | null;
  created_at: string;
}

export interface HealthFacility {
  id: UUID; name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'lab' | 'imaging_center' | 'dental' | 'optical' | 'mental_health' | 'maternity' | 'other';
  license_number: string; address: string; phone: string | null; email: string | null;
  gps_coordinates: [number, number] | null; operating_hours: Record<string, string> | null;
  services: string[]; emergency_services: boolean; bed_count: number | null;
  rating: number; verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string; updated_at: string;
}

export interface HealthReferral {
  id: UUID; patient_id: UUID; from_provider_id: UUID;
  to_provider_id: UUID | null; to_facility_id: UUID | null;
  reason: string; urgency: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  notes: string | null; created_at: string; updated_at: string;
}

export interface HealthSymptomChecker {
  id: UUID; patient_id: UUID; symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe'; duration_days: number;
  body_areas: string[] | null; ai_assessment: string | null;
  recommended_specialty: string | null;
  recommended_urgency: 'self_care' | 'primary_care' | 'urgent_care' | 'emergency';
  created_at: string;
}

export interface HealthWalletTransaction {
  id: UUID; patient_id: UUID;
  transaction_type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'insurance_claim';
  amount: number; currency: string;
  reference_type: 'appointment' | 'prescription' | 'lab_test' | 'insurance_claim' | 'top_up' | null;
  reference_id: UUID | null; status: 'pending' | 'completed' | 'failed';
  description: string | null; created_at: string;
}

export interface HealthNotification {
  id: UUID; user_id: UUID;
  type: 'appointment_reminder' | 'prescription_ready' | 'lab_results' | 'vaccination_due' | 'claim_update' | 'emergency_alert' | 'general';
  title: string; message: string; data: Record<string, unknown> | null;
  is_read: boolean; action_url: string | null; created_at: string;
}
