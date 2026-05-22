// Prisons module type stubs
export interface Prisoner {
  id: string;
  prisonerId: string;
  name: string;
  dateOfBirth?: string;
  sentenceStart?: string;
  sentenceEnd?: string;
  crime?: string;
  status: string;
  cellBlock?: string;
  cellNumber?: string;
  createdAt?: string;
}

export interface PrisonFacility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentPopulation: number;
  type: string;
  status: string;
}

export interface PrisonVisit {
  id: string;
  prisonerId: string;
  visitorName: string;
  visitDate: string;
  duration: number;
  status: string;
  notes?: string;
}

export interface PrisonIncident {
  id: string;
  facilityId: string;
  type: string;
  description: string;
  date: string;
  severity: string;
  resolved: boolean;
}

export interface PrisonCell {
  id: string;
  facility_id: string;
  cell_block: string;
  cell_number: string;
  capacity: number;
  current_occupancy?: number;
  cell_type: string;
  security_level: string;
  status: string;
  created_at?: string;
}

export interface PrisonInmate {
  id: string;
  facility_id: string;
  full_name: string;
  id_number: string;
  date_of_birth?: string;
  gender: string;
  nationality?: string;
  sentence_type?: string;
  sentence_length_months?: number;
  sentence_start?: string;
  sentence_end?: string;
  cell_block?: string;
  cell_number?: string;
  risk_level: string;
  medical_conditions?: string[];
  status: string;
  created_at?: string;
}

export interface PrisonMovement {
  id: string;
  inmate_id: string;
  movement_type: string;
  from_facility_id?: string;
  to_facility_id?: string;
  reason: string;
  movement_date: string;
  status: string;
  created_at?: string;
}

export interface PrisonParoleReview {
  id: string;
  inmate_id: string;
  review_date: string;
  review_type: string;
  board_members?: string[];
  rehabilitation_notes?: string;
  decision?: string;
  decision_date?: string;
  created_at?: string;
}

export interface PrisonPayroll {
  id: string;
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: string;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  hazard_allowance?: number;
  overtime?: number;
  deductions?: number;
  net_amount?: number;
  status: string;
  created_at?: string;
}

export interface PrisonProcurement {
  id: string;
  facility_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  total_cost?: number;
  vendor_name?: string;
  urgency: string;
  status: string;
  created_at?: string;
}

export interface PrisonStaffAttendance {
  id: string;
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: string;
  clock_in: string;
  clock_out?: string;
  tower_id?: string;
  cell_block_id?: string;
  status: string;
  created_at?: string;
}

export interface PrisonStats {
  total_inmates: number;
  total_facilities: number;
  total_wards: number;
  total_visits: number;
  total_incidents: number;
}

export interface PrisonWarden {
  id: string;
  facility_id: string;
  full_name: string;
  warden_number: string;
  employee_number?: string;
  badge_number?: string;
  rank: string;
  shift: string;
  phone?: string;
  email?: string;
  date_hired?: string;
  status: string;
  created_at?: string;
}

export type InmateStatus = string;
export type RiskLevel = string;
