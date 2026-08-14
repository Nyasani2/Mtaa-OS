// [CONSOLIDATED] Health types moved to domains/health/types.ts
// All types re-exported from canonical source.
// Do not add new types here — use the canonical source instead.

export * from '../../domains/health/types';

// === Missing types referenced by ehr.service.ts and hospital.service.ts ===
export interface HealthEHRRecord {
  id: string;
  patient_id: string;
  record_type: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HealthPharmacyOrder {
  id: string;
  patient_id: string;
  pharmacy_id: string;
  medications: any[];
  status: string;
  created_at: string;
}

export interface HealthVaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name: string;
  date_administered: string;
  provider: string;
  next_due?: string;
}

export interface HealthHospital {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  type: string;
  status: string;
}

export interface HealthDepartment {
  id: string;
  hospital_id: string;
  name: string;
  head_id?: string;
  specialty: string;
}

export interface HealthBed {
  id: string;
  hospital_id: string;
  department_id?: string;
  bed_number: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
  patient_id?: string;
}

export interface HealthPractitioner {
  id: string;
  user_id: string;
  hospital_id?: string;
  department_id?: string;
  specialty: string;
  license_number: string;
  status: string;
}

export interface HealthAlert {
  id: string;
  user_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_read: boolean;
  created_at: string;
}
