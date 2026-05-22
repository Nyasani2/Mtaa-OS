export interface DrivingLicense {
  id: string;
  user_id: string;
  license_number: string;
  category: string[];
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'suspended' | 'expired' | 'revoked';
  county: string;
  blood_group?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleRegistration {
  id: string;
  user_id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engine_number: string;
  chassis_number: string;
  body_type: string;
  fuel_type: string;
  seating_capacity: number;
  tare_weight: number;
  gross_weight: number;
  registration_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'written_off';
  county: string;
  logbook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionRecord {
  id: string;
  vehicle_id: string;
  inspector_id: string;
  station: string;
  inspection_date: string;
  expiry_date: string;
  result: 'pass' | 'fail' | 'conditional';
  defects: string[];
  certificate_number: string;
  status: 'valid' | 'expired';
  created_at: string;
}

export interface TrafficOffence {
  id: string;
  offender_id: string;
  vehicle_id?: string;
  license_id?: string;
  offence_type: string;
  description: string;
  location: string;
  county: string;
  offence_date: string;
  fine_amount: number;
  points_deducted: number;
  status: 'pending' | 'paid' | 'contested' | 'waived' | 'escalated';
  payment_reference?: string;
  court_date?: string;
  officer_id: string;
  evidence_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface NTSAApplication {
  id: string;
  user_id: string;
  type: 'new_license' | 'renewal' | 'duplicate' | 'endorsement' | 'vehicle_registration' | 'transfer' | 'inspection';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  data: Record<string, any>;
  fees_paid: number;
  appointment_date?: string;
  completion_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RoadIncident {
  id: string;
  reporter_id: string;
  type: 'accident' | 'breakdown' | 'hazard' | 'traffic_jam' | 'road_closure';
  location: string;
  county: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'responding' | 'resolved' | 'closed';
  photos?: string[];
  involved_parties?: string[];
  created_at: string;
  updated_at: string;
}

export interface TransportState {
  licenses: DrivingLicense[];
  vehicles: VehicleRegistration[];
  inspections: InspectionRecord[];
  offences: TrafficOffence[];
  applications: NTSAApplication[];
  incidents: RoadIncident[];
  selectedItem: any | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    county?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}
