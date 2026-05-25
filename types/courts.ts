// types/courts.ts - Complete court system types
export type CaseStatus = 'pending' | 'active' | 'adjourned' | 'closed' | 'appealed' | 'dismissed';
export type CourtType = 'magistrate' | 'high_court' | 'court_of_appeal' | 'supreme_court';
export type StaffType = 'judge' | 'magistrate' | 'registrar' | 'clerk' | 'bailiff' | 'prosecutor';
export type ProcurementCategory = 'stationery' | 'furniture' | 'equipment' | 'vehicles' | 'IT' | 'security';
export type ProcurementStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'delivered';
export type AppealType = 'civil' | 'criminal' | 'constitutional';
export type BailType = 'cash' | 'surety' | 'bond' | 'personal_recognizance';

export interface CourtCase {
  id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  court_id: string;
  judge_id?: string;
  plaintiff: string;
  defendant: string;
  filing_date: string;
  hearing_date?: string;
  judgment_date?: string;
  verdict?: string;
  sentence?: string;
  created_at: string;
  updated_at: string;
}

export interface CourtDocument {
  id: string;
  case_id: string;
  title: string;
  type: 'pleading' | 'evidence' | 'judgment' | 'order' | 'notice';
  file_url?: string;
  uploaded_by: string;
  created_at: string;
}

export interface CourtRoom {
  id: string;
  court_id: string;
  name: string;
  capacity: number;
  is_available: boolean;
  equipment: string[];
  created_at: string;
}

export interface CourtStaffAttendance {
  id: string;
  court_house_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  station_id?: string;
  clock_in: string;
  clock_out?: string;
  status: 'present' | 'absent' | 'on_leave';
  created_at: string;
}

export interface CourtPayroll {
  id: string;
  court_house_id: string;
  staff_id: string;
  staff_name: string;
  staff_type: StaffType;
  pay_period_start: string;
  pay_period_end: string;
  base_amount: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'approved' | 'paid';
  created_at: string;
}

export interface CourtProcurement {
  id: string;
  court_house_id: string;
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

export interface CourtAppeal {
  id: string;
  original_case_id: string;
  original_judgment_id: string;
  appeal_case_number: string;
  appellant_party_id: string;
  appeal_type: AppealType;
  grounds: string;
  appellate_court_id: string;
  status: 'filed' | 'hearing_scheduled' | 'heard' | 'decided' | 'dismissed';
  decision?: string;
  created_at: string;
}

export interface CourtBail {
  id: string;
  case_id: string;
  party_id: string;
  bail_type: BailType;
  amount: number;
  conditions: string[];
  granted_by: string;
  granted_date: string;
  expiry_date?: string;
  status: 'granted' | 'posted' | 'forfeited' | 'released';
  created_at: string;
}

export interface CourtHearing {
  id: string;
  case_id: string;
  court_room_id: string;
  scheduled_date: string;
  actual_date?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'adjourned' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface CourtJudgment {
  id: string;
  case_id: string;
  judge_id: string;
  date: string;
  verdict: string;
  sentence?: string;
  damages?: number;
  costs?: number;
  document_url?: string;
  created_at: string;
}

export interface CourtParty {
  id: string;
  case_id: string;
  type: 'plaintiff' | 'defendant' | 'witness' | 'expert' | 'intervener';
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  represented_by?: string;
  created_at: string;
}
