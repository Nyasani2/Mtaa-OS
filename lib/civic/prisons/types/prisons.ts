export type SecurityLevel = 'minimum' | 'medium' | 'maximum' | 'supermax';
export type CellType = 'general' | 'solitary' | 'medical' | 'protective_custody' | 'death_row' | 'juvenile';
export type InmateStatus = 'admitted' | 'transferred' | 'released' | 'escaped' | 'deceased' | 'hospitalized' | 'awaiting_trial';
export type ParoleStatus = 'not_eligible' | 'eligible' | 'applied' | 'reviewing' | 'granted' | 'denied';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type MovementType = 'intake' | 'transfer_in' | 'transfer_out' | 'release' | 'escape' | 'hospitalization' | 'court_appearance' | 'return';
export type VisitType = 'standard' | 'legal' | 'medical' | 'conjugal' | 'disciplinary';
export type VisitStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'denied';
export type IncidentType = 'assault' | 'escape_attempt' | 'contraband' | 'self_harm' | 'death' | 'riot' | 'property_damage' | 'medical_emergency' | 'other';
export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type IncidentStatus = 'open' | 'under_investigation' | 'resolved' | 'closed';
export type ParoleReviewType = 'scheduled' | 'early' | 'mandatory' | 'appeal';
export type ParoleDecision = 'granted' | 'denied' | 'deferred' | 'pending';
export type ParoleRecommendation = 'grant' | 'deny' | 'defer' | 'further_review';
export type PrisonStaffType = 'warden' | 'guard' | 'medical' | 'counselor' | 'kitchen' | 'maintenance' | 'admin';
export type PrisonPayrollStatus = 'pending' | 'approved' | 'paid' | 'disputed';
export type PrisonProcurementCategory = 'security_equipment' | 'medical' | 'food' | 'uniforms' | 'rehabilitation' | 'maintenance' | 'technology' | 'furniture' | 'vehicles';
export type PrisonProcurementStatus = 'requested' | 'approved' | 'ordered' | 'delivered' | 'rejected';
export type PrisonProcurementUrgency = 'low' | 'normal' | 'high' | 'critical';

export interface PrisonFacility {
  id: string;
  jurisdiction_id: string;
  facility_number: string;
  name: string;
  type: string;
  location: any;
  contact: any;
  capacity: number;
  current_population: number;
  is_active: boolean;
  security_level: SecurityLevel;
  station_wallet_id: string | null;
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
  is_active: boolean;
  created_at: string;
}

export interface PrisonInmate {
  id: string;
  jurisdiction_id: string;
  facility_id: string;
  court_case_id: string | null;
  court_judgment_id: string | null;
  inmate_number: string;
  full_name: string;
  aliases: string[];
  photo_url: string | null;
  id_number: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  sentence_type: string | null;
  sentence_start: string | null;
  sentence_end: string | null;
  sentence_length_months: number | null;
  time_served_months: number | null;
  parole_eligible_date: string | null;
  status: InmateStatus;
  cell_block: string | null;
  cell_number: string | null;
  medical_conditions: string[];
  emergency_contact: any;
  metadata: any;
  intake_date: string | null;
  release_date: string | null;
  parole_status: ParoleStatus;
  behavior_score: number;
  risk_level: RiskLevel;
  next_review_date: string | null;
  education_programs: string[];
  work_assignment: string | null;
  disciplinary_actions: number;
  good_behavior_credits: number;
  created_at: string;
  updated_at: string;
  facility?: PrisonFacility;
  cell?: PrisonCell;
}

export interface PrisonMovement {
  id: string;
  inmate_id: string;
  from_facility_id: string | null;
  to_facility_id: string | null;
  movement_type: MovementType;
  reason: string;
  authorized_by: string | null;
  occurred_at: string;
  metadata: any;
  created_at: string;
  inmate?: PrisonInmate;
}

export interface PrisonVisit {
  id: string;
  inmate_id: string;
  visitor_name: string;
  visitor_id_number: string;
  visitor_relationship: string;
  scheduled_at: string;
  duration_minutes: number;
  status: VisitStatus;
  notes: string | null;
  check_in: string | null;
  check_out: string | null;
  visitor_photo_url: string | null;
  items_seized: string[];
  visit_type: VisitType;
  created_at: string;
  inmate?: PrisonInmate;
}

export interface PrisonWarden {
  id: string;
  jurisdiction_id: string;
  facility_id: string;
  user_id: string | null;
  personnel_id: string | null;
  warden_number: string;
  full_name: string;
  rank: string;
  phone: string;
  email: string;
  is_active: boolean;
  employee_number: string | null;
  shift: string;
  station_wallet_id: string | null;
  date_of_birth: string | null;
  date_hired: string | null;
  badge_number: string | null;
  created_at: string;
}

export interface PrisonIncident {
  id: string;
  facility_id: string;
  inmate_id: string | null;
  reported_by: string | null;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string | null;
  witnesses: string[];
  actions_taken: string[];
  status: IncidentStatus;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  facility?: PrisonFacility;
  inmate?: PrisonInmate;
  reporter?: PrisonWarden;
}

export interface PrisonParoleReview {
  id: string;
  inmate_id: string;
  review_date: string;
  review_type: ParoleReviewType;
  board_members: string[];
  behavior_score: number | null;
  work_performance: string | null;
  rehabilitation_notes: string | null;
  recommendation: ParoleRecommendation | null;
  decision: ParoleDecision | null;
  conditions: string[];
  next_review_date: string | null;
  created_at: string;
  inmate?: PrisonInmate;
}

export interface PrisonStaffAttendance {
  id: string;
  facility_id: string;
  staff_type: PrisonStaffType;
  staff_id: string;
  staff_name: string;
  shift_date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  tower_id: string | null;
  cell_block_id: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface PrisonPayroll {
  id: string;
  facility_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: PrisonStaffType;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  hazard_allowance: number;
  overtime: number;
  deductions: number;
  net_amount: number;
  status: PrisonPayrollStatus;
  paid_date: string | null;
  transaction_ref: string | null;
  created_at: string;
}

export interface PrisonProcurement {
  id: string;
  facility_id: string;
  item_name: string;
  category: PrisonProcurementCategory;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  vendor_name: string | null;
  urgency: PrisonProcurementUrgency;
  status: PrisonProcurementStatus;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface PrisonStats {
  total_inmates: number;
  inmates_by_status: Record<string, number>;
  inmates_by_risk: Record<string, number>;
  total_facilities: number;
  total_cells: number;
  total_capacity: number;
  current_population: number;
  occupancy_rate: number;
  total_movements: number;
  movements_this_month: number;
  total_visits: number;
  visits_this_week: number;
  total_incidents: number;
  open_incidents: number;
  total_parole_reviews: number;
  paroles_granted: number;
  total_wardens: number;
  total_payroll: number;
  payroll_pending: number;
}
