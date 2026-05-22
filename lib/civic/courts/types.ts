export interface CourtHouse {
  id: string;
  name: string;
  location: string;
  jurisdiction: string;
  type: 'magistrate' | 'high' | 'appeal' | 'supreme';
  created_at: string;
}

export interface CourtJudge {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  title: string;
  court_house_id: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
}

export interface CourtCase {
  id: string;
  case_number: string;
  case_type: string;
  case_category: string;
  title: string;
  description?: string;
  court_house_id: string;
  court_house?: CourtHouse;
  assigned_judge_id?: string;
  assigned_judge?: CourtJudge;
  filing_date: string;
  status: 'filed' | 'pending' | 'hearing' | 'judgment' | 'appealed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  police_case_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface CourtParty {
  id: string;
  case_id: string;
  party_type: 'plaintiff' | 'defendant' | 'witness' | 'expert';
  full_name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  represented_by?: string;
  created_at: string;
}

export interface CourtHearing {
  id: string;
  case_id: string;
  case?: CourtCase;
  hearing_type: string;
  court_room_id: string;
  court_room?: CourtRoom;
  scheduled_date: string;
  scheduled_time?: string;
  presiding_judge_id?: string;
  presiding_judge?: CourtJudge;
  status: 'scheduled' | 'ongoing' | 'adjourned' | 'completed' | 'cancelled';
  adjournment_reason?: string;
  notes?: string;
  created_at: string;
}

export interface CourtRoom {
  id: string;
  court_house_id: string;
  name: string;
  capacity: number;
  created_at: string;
}

export interface CourtJudgment {
  id: string;
  case_id: string;
  case?: CourtCase;
  judge_id: string;
  judge?: CourtJudge;
  judgment_type: string;
  delivered_date: string;
  summary: string;
  sentence_type?: string;
  sentence_duration_months?: number;
  fine_amount?: number;
  is_appealable: boolean;
  appeal_deadline?: string;
  created_at: string;
}

export interface CourtAppeal {
  id: string;
  original_case_id: string;
  original_case?: CourtCase;
  appellate_court_id: string;
  appellate_court?: CourtHouse;
  appellant: string;
  grounds: string;
  status: 'filed' | 'pending' | 'hearing' | 'judgment' | 'dismissed';
  filing_date: string;
  created_at: string;
}

export interface CourtBail {
  id: string;
  case_id: string;
  party_id: string;
  party?: CourtParty;
  amount: number;
  conditions?: string;
  status: 'posted' | 'forfeited' | 'returned' | 'pending';
  posted_date?: string;
  created_at: string;
}

export interface CourtFine {
  id: string;
  case_id: string;
  party_id: string;
  amount: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'waived';
  receipt_number?: string;
  due_date?: string;
  created_at: string;
}

export interface CourtJuror {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  id_number: string;
  occupation?: string;
  is_available: boolean;
  created_at: string;
}

export interface CourtJuryAssignment {
  id: string;
  case_id: string;
  juror_id: string;
  juror?: CourtJuror;
  is_foreperson: boolean;
  stipend_amount: number;
  status: 'active' | 'dismissed' | 'completed';
  created_at: string;
}

export interface CourtStaffAttendance {
  id: string;
  staff_id: string;
  court_house_id: string;
  shift_date: string;
  hours_worked: number;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  notes?: string;
  created_at: string;
}

export interface CourtPayroll {
  id: string;
  staff_id: string;
  court_house_id: string;
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

export interface CourtProcurement {
  id: string;
  court_house_id: string;
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

export interface CourtStats {
  id: string;
  court_house_id: string;
  total_cases: number;
  pending_cases: number;
  resolved_cases: number;
  appealed_cases: number;
  avg_resolution_days: number;
  cases_by_status: Record<string, number>;
  cases_by_type: Record<string, number>;
  created_at: string;
}
