// types/transport.ts - Transport/NTSA types
export type LicenseType = 'class_a' | 'class_b' | 'class_c' | 'class_d' | 'class_e' | 'class_f' | 'psv' | 'motorcycle';
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'revoked' | 'pending_renewal';
export type VehicleType = 'private' | 'commercial' | 'psv' | 'motorcycle' | 'trailer' | 'diplomatic';
export type VehicleStatus = 'registered' | 'deregistered' | 'transferred' | 'written_off';
export type OffenceType = 'speeding' | 'overloading' | 'unlicensed' | 'drunk_driving' | 'reckless' | 'expired_license' | 'expired_insurance' | 'illegal_parking';
export type OffenceStatus = 'pending' | 'paid' | 'contested' | 'warrant_issued';

export interface DrivingLicense {
  id: string;
  user_id: string;
  license_number: string;
  license_type: LicenseType;
  issue_date: string;
  expiry_date: string;
  status: LicenseStatus;
  county: string;
  blood_group?: string;
  restrictions?: string[];
  created_at: string;
}

export interface VehicleRegistration {
  id: string;
  user_id: string;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  make: string;
  model: string;
  year_of_manufacture: number;
  color: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  insurance_expiry: string;
  inspection_date?: string;
  next_inspection?: string;
  created_at: string;
}

export interface TrafficOffence {
  id: string;
  user_id?: string;
  vehicle_id?: string;
  license_id?: string;
  offence_type: OffenceType;
  offence_date: string;
  location: string;
  fine_amount: number;
  status: OffenceStatus;
  officer_id: string;
  evidence_url?: string;
  court_date?: string;
  created_at: string;
}

export interface InspectionBooking {
  id: string;
  vehicle_id: string;
  station_id: string;
  booking_date: string;
  time_slot: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  results?: string;
  created_at: string;
}
