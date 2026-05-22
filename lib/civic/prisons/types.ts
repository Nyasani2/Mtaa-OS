export interface PrisonFacility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  created_at: string;
}

export interface PrisonCell {
  id: string;
  facility_id: string;
  cell_number: string;
  capacity: number;
  current_occupancy: number;
  cell_type: string;
  created_at: string;
}

export interface PrisonInmate {
  id: string;
  inmate_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  sentence_start: string;
  sentence_end: string;
  crime_description: string;
  status: 'active' | 'released' | 'transferred' | 'deceased';
  parole_status: 'eligible' | 'pending' | 'denied' | 'approved';
  facility_id: string;
  cell_id?: string;
  facility?: PrisonFacility;
  created_at: string;
}

export interface PrisonWarden {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  rank: string;
  facility_id: string;
  is_active: boolean;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface PrisonStaffAttendance {
  id: string;
  staff_id: string;
  facility_id: string;
  shift_date: string;
  hours_worked: number;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  notes?: string;
  created_at: string;
}

export interface PrisonIncident {
  id: string;
  facility_id: string;
  inmate_id?: string;
  incident_type: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reported_by: string;
  resolved_by?: string;
  resolution_notes?: string;
  witnesses?: string[];
  inmate?: PrisonInmate;
  reporter?: PrisonWarden;
  created_at: string;
  updated_at: string;
}

export interface PrisonMovement {
  id: string;
  inmate_id: string;
  from_facility_id: string;
  to_facility_id: string;
  movement_type: 'transfer' | 'release' | 'admission' | 'court' | 'medical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  occurred_at: string;
  authorized_by: string;
  notes?: string;
  inmate?: PrisonInmate;
  created_at: string;
}

export interface PrisonVisit {
  id: string;
  facility_id: string;
  inmate_id: string;
  visitor_name: string;
  visitor_id_number: string;
  visitor_relationship: string;
  visit_type: 'family' | 'legal' | 'medical' | 'official';
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  check_in?: string;
  check_out?: string;
  items_seized?: string[];
  notes?: string;
  inmate?: PrisonInmate;
  created_at: string;
}

export interface PrisonParoleReview {
  id: string;
  inmate_id: string;
  review_date: string;
  behavior_score: number;
  work_performance: number;
  rehabilitation_score: number;
  recommendation: 'approve' | 'deny' | 'defer';
  conditions?: string[];
  reviewed_by: string;
  notes?: string;
  inmate?: PrisonInmate;
  created_at: string;
}

export interface PrisonPayroll {
  id: string;
  staff_id: string;
  facility_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  deductions: number;
  bonuses: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  created_at: string;
}

export interface PrisonProcurement {
  id: string;
  facility_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  supplier: string;
  status: 'requested' | 'approved' | 'ordered' | 'received';
  requested_by: string;
  approved_by?: string;
  created_at: string;
}

export interface PrisonStats {
  id: string;
  facility_id: string;
  total_inmates: number;
  total_cells: number;
  occupancy_rate: number;
  active_wardens: number;
  incidents_this_month: number;
  visits_this_month: number;
  inmates_by_status: Record<string, number>;
  created_at: string;
}
