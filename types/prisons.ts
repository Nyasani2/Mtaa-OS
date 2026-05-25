// types/prisons.ts - Complete prison system types
export type InmateStatus = 'admitted' | 'awaiting_trial' | 'convicted' | 'on_parole' | 'released' | 'transferred' | 'deceased';
export type RiskLevel = 'low' | 'medium' | 'high' | 'maximum';
export type CellType = 'single' | 'shared' | 'solitary' | 'medical' | 'juvenile';
export type SecurityLevel = 'minimum' | 'medium' | 'maximum' | 'supermax';
export type MovementType = 'admission' | 'transfer_in' | 'transfer_out' | 'court_appearance' | 'hospital' | 'release' | 'escape';
export type StaffType = 'warder' | 'officer' | 'medical' | 'counselor' | 'admin' | 'kitchen';
export type ProcurementCategory = 'food' | 'medical' | 'uniforms' | 'equipment' | 'vehicles' | 'IT' | 'security';
export type ProcurementStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'delivered';
export type ReviewType = 'parole' | 'remission' | 'pardon' | 'appeal';

export interface PrisonFacility {
  id: string;
  name: string;
  code: string;
  county: string;
  capacity: number;
  current_population: number;
  security_level: SecurityLevel;
  status: 'active' | 'under_construction' | 'closed';
  created_at: string;
}

export interface PrisonCell {
  id: string;
  facility_id: string;
  cell_block: string;
  cell_number: string;
  capacity: number;
  current_occupancy: number;
  cell_type: CellType;
  security_level: SecurityLevel;
  status: 'available' | 'full' | 'maintenance' | 'quarantine';
  created_at: string;
}

export interface PrisonInmate {
  id: string;
  facility_id: string;
  cell_id?: string;
  first_name: string;
  last_name: string;
  id_number: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  admission_date: string;
  sentence_start?: string;
  sentence_end?: string;
  crime_description?: string;
  case_number?: string;
  court?: string;
  status: InmateStatus;
  risk_level: RiskLevel;
  created_at: string;
}

export interface PrisonMovement {
  id: string;
  inmate_id: string;
  movement_type: MovementType;
  from_facility_id?: string;
  to_facility_id?: string;
  reason: string;
  escorted_by?: string;
  vehicle_id?: string;
  date: string;
  expected_return?: string;
  actual_return?: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'overdue';
  created_at: string;
}

export interface PrisonParoleReview {
  id: string;
  inmate_id: string;
  review_date: string;
  review_type: ReviewType;
  board_members: string[];
  rehabilitation_notes: string;
  recommendation: 'approve' | 'deny' | 'defer';
  conditions?: string[];
  status: 'scheduled' | 'completed' | 'appealed';
  created_at: string;
}

export interface PrisonStaffAttendance {
  id: string;
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  tower_id?: string;
  cell_block_id?: string;
  clock_in: string;
  clock_out?: string;
  status: 'present' | 'absent' | 'on_leave';
  created_at: string;
}

export interface PrisonPayroll {
  id: string;
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  hazard_allowance: number;
  overtime: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'approved' | 'paid';
  created_at: string;
}

export interface PrisonProcurement {
  id: string;
  facility_id: string;
  item_name: string;
  category: ProcurementCategory;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  vendor_name?: string;
  status: ProcurementStatus;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requested_by: string;
  created_at: string;
}

export interface PrisonVisitor {
  id: string;
  inmate_id: string;
  visitor_name: string;
  visitor_id_number: string;
  relationship: string;
  visit_date: string;
  duration_minutes: number;
  approved_by: string;
  status: 'approved' | 'denied' | 'completed';
  created_at: string;
}

export interface PrisonIncident {
  id: string;
  facility_id: string;
  inmate_id?: string;
  incident_type: 'assault' | 'escape_attempt' | 'riot' | 'medical' | 'fire' | 'other';
  description: string;
  reported_by: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  date: string;
  resolution?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  created_at: string;
}
