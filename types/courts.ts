// Courts module type stubs
export interface CourtCase {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  plaintiff?: string;
  defendant?: string;
  judge?: string;
  filingDate?: string;
  hearingDate?: string;
  verdict?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourtHearing {
  id: string;
  caseId: string;
  date: string;
  time: string;
  courtroom: string;
  judge: string;
  status: string;
  notes?: string;
}

export interface CourtDocument {
  id: string;
  caseId: string;
  title: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface CourtJudge {
  id: string;
  name: string;
  title: string;
  court: string;
  active: boolean;
}

export interface CourtAppeal {
  id: string;
  original_case_id: string;
  original_judgment_id?: string;
  appeal_case_number: string;
  appellant_party_id: string;
  appeal_type: string;
  grounds: string;
  appellate_court_id: string;
  status: string;
  filing_date: string;
  hearing_date?: string;
  decision_date?: string;
  decision?: string;
  created_at?: string;
}

export interface CourtBail {
  id: string;
  case_id: string;
  party_id: string;
  bail_type: string;
  amount: number;
  conditions: string[];
  status: string;
  posted_date?: string;
  posted_by?: string;
  release_date?: string;
  created_at?: string;
}

export interface CourtFine {
  id: string;
  case_id: string;
  fine_type: string;
  amount: number;
  due_date: string;
  status: string;
  paid_amount?: number;
  paid_date?: string;
  created_at?: string;
}

export interface CourtHearing_v2 {
  id: string;
  case_id: string;
  court_room_id: string;
  hearing_type: string;
  scheduled_date: string;
  status: string;
  notes?: string;
  created_at?: string;
}

export interface CourtHouse {
  id: string;
  name: string;
  location: string;
  type: string;
  status: string;
  created_at?: string;
}

export interface CourtJudgment {
  id: string;
  case_id: string;
  judge_id: string;
  judgment_date: string;
  verdict: string;
  sentence?: string;
  fine_amount?: number;
  status: string;
  created_at?: string;
}

export interface CourtJuror {
  id: string;
  court_house_id: string;
  full_name: string;
  id_number: string;
  phone?: string;
  occupation?: string;
  status: string;
  created_at?: string;
}

export interface CourtJuryAssignment {
  id: string;
  case_id: string;
  juror_id: string;
  assigned_date: string;
  status: string;
  created_at?: string;
}

export interface CourtParty {
  id: string;
  case_id: string;
  party_type: string;
  name: string;
  id_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  representation?: string;
  created_at?: string;
}

export interface CourtPayroll {
  id: string;
  court_house_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: string;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  allowances?: number;
  deductions?: number;
  net_amount?: number;
  status: string;
  created_at?: string;
}

export interface CourtProcurement {
  id: string;
  court_house_id: string;
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

export interface CourtRoom {
  id: string;
  court_house_id: string;
  room_number: string;
  room_type: string;
  capacity?: number;
  status: string;
  created_at?: string;
}

export interface CourtStaffAttendance {
  id: string;
  court_house_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: string;
  clock_in: string;
  clock_out?: string;
  station_id?: string;
  status: string;
  created_at?: string;
}

export interface CourtStats {
  total_cases: number;
  pending_cases: number;
  resolved_cases: number;
  total_hearings: number;
  total_fines: number;
  total_bails: number;
}

export type CaseStatus = string;
