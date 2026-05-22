export interface VehicleRegistration {
  id: string;
  plate_number: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  body_type?: string;
  fuel_type?: string;
  seating_capacity?: number;
  owner_id: string;
  county: string;
  status: 'active' | 'suspended' | 'expired' | 'transferred';
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DrivingLicense {
  id: string;
  license_number: string;
  holder_id: string;
  category: string[];
  county: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  points: number;
}

export interface InspectionRecord {
  id: string;
  vehicle_id: string;
  inspector_id: string;
  inspection_date: string;
  expiry_date: string;
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  findings: string;
  recommendations?: string;
  created_at: string;
}

export interface Sacco {
  id: string;
  name: string;
  registration_number: string;
  route: string;
  status: 'active' | 'suspended' | 'dissolved';
  fleet_size: number;
  created_at: string;
}

export interface TrafficOffence {
  id: string;
  vehicle_id?: string;
  driver_id?: string;
  offence_code: string;
  offence_type: string;
  description: string;
  fine_amount: number;
  points_deducted: number;
  location: string;
  county: string;
  offence_date: string;
  status: 'pending' | 'paid' | 'appealed' | 'waived';
  issued_at: string;
  paid_at?: string;
}

export interface NTSAApplication {
  id: string;
  applicant_id: string;
  type: 'license' | 'registration' | 'permit';
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface RoadIncident {
  id: string;
  reporter_id: string;
  type: string;
  incident_type: string;
  location: string;
  county: string;
  description: string;
  severity: string;
  status: 'reported' | 'under_investigation' | 'resolved';
  created_at: string;
}
