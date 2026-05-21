export type JurisdictionLevel = 'county' | 'sub_county' | 'national' | 'appeal' | 'supreme';
export type RoomType = 'criminal' | 'civil' | 'family' | 'traffic' | 'appeal' | 'small_claims' | 'chamber';
export type JudgeDesignation = 'magistrate' | 'judge' | 'principal_magistrate' | 'registrar' | 'chief_magistrate' | 'justice';
export type CaseType = 'criminal' | 'civil' | 'family' | 'traffic' | 'small_claims' | 'constitutional' | 'appeal';
export type CaseCategory = 'felony' | 'misdemeanor' | 'petty' | 'civil_suit' | 'divorce' | 'custody' | 'probate' | 'traffic_violation' | 'appeal_criminal' | 'appeal_civil';
export type CaseStatus = 'filed' | 'scheduled' | 'heard' | 'reserved' | 'judgment' | 'sentenced' | 'closed' | 'appealed' | 'dismissed' | 'withdrawn';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type HearingType = 'mention' | 'pretrial' | 'trial' | 'sentencing' | 'ruling' | 'appeal_hearing' | 'review' | 'mediation';
export type HearingStatus = 'scheduled' | 'ongoing' | 'adjourned' | 'completed' | 'cancelled';
export type TranscriptStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
export type JudgmentType = 'guilty' | 'not_guilty' | 'acquitted' | 'liable' | 'not_liable' | 'dismissed' | 'settled' | 'default' | 'contempt';
export type SentenceType = 'fine' | 'imprisonment' | 'probation' | 'community_service' | 'death' | 'discharge' | 'suspended' | 'restitution';
export type AppealType = 'appeal_against_conviction' | 'appeal_against_sentence' | 'appeal_against_acquittal' | 'civil_appeal' | 'constitutional_appeal';
export type AppealStatus = 'filed' | 'scheduled_for_hearing' | 'heard' | 'allowed' | 'dismissed' | 'withdrawn';
export type FineType = 'court_fee' | 'traffic_fine' | 'criminal_fine' | 'restitution' | 'bail_forfeiture' | 'contempt_fine';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'waived' | 'escalated';
export type BailType = 'cash_bail' | 'surety_bond' | 'property_bond' | 'personal_recognizance';
export type BailStatus = 'pending' | 'posted' | 'released' | 'forfeited' | 'revoked';
export type StaffType = 'judge' | 'clerk' | 'bailiff' | 'reporter' | 'registrar' | 'security';
export type PayrollStatus = 'pending' | 'approved' | 'paid' | 'disputed';
export type ProcurementCategory = 'stationery' | 'furniture' | 'equipment' | 'vehicle' | 'software' | 'security' | 'maintenance';
export type ProcurementStatus = 'requested' | 'approved' | 'ordered' | 'delivered' | 'rejected';
export type PartyType = 'plaintiff' | 'defendant' | 'witness' | 'expert_witness' | 'intervener' | 'guardian' | 'estate';

export interface CourtHouse {
  id: string;
  name: string;
  jurisdiction_level: JurisdictionLevel;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  station_wallet_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourtRoom {
  id: string;
  court_house_id: string;
  room_number: string;
  room_type: RoomType;
  has_recording: boolean;
  has_video_link: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CourtJudge {
  id: string;
  court_house_id: string;
  profile_id: string | null;
  employee_number: string | null;
  full_name: string;
  designation: JudgeDesignation;
  specialization: string[];
  is_active: boolean;
  created_at: string;
}

export interface CourtCase {
  id: string;
  case_number: string;
  court_house_id: string;
  court_room_id: string | null;
  assigned_judge_id: string | null;
  case_type: CaseType;
  case_category: CaseCategory;
  filing_date: string;
  status: CaseStatus;
  priority: Priority;
  police_case_ref: string | null;
  prison_case_ref: string | null;
  station_wallet_id: string | null;
  amount_owed: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  court_house?: CourtHouse;
  court_room?: CourtRoom;
  assigned_judge?: CourtJudge;
  parties?: CourtParty[];
  hearings?: CourtHearing[];
  judgments?: CourtJudgment[];
  fines?: CourtFine[];
  bails?: CourtBail[];
}

export interface CourtParty {
  id: string;
  case_id: string;
  party_type: PartyType;
  full_name: string;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  represented_by: string | null;
  is_minor: boolean;
  created_at: string;
}

export interface CourtHearing {
  id: string;
  case_id: string;
  court_room_id: string;
  hearing_type: HearingType;
  scheduled_date: string;
  actual_start: string | null;
  actual_end: string | null;
  status: HearingStatus;
  presiding_judge_id: string | null;
  recording_url: string | null;
  transcript_status: TranscriptStatus;
  adjournment_reason: string | null;
  next_hearing_date: string | null;
  created_by: string | null;
  created_at: string;
  court_room?: CourtRoom;
  presiding_judge?: CourtJudge;
}

export interface CourtJudgment {
  id: string;
  case_id: string;
  hearing_id: string | null;
  judge_id: string;
  judgment_type: JudgmentType;
  sentence_type: SentenceType | null;
  sentence_duration_months: number | null;
  fine_amount: number;
  restitution_amount: number;
  judgment_text: string | null;
  delivered_date: string;
  is_appealable: boolean;
  appeal_deadline: string | null;
  created_at: string;
  judge?: CourtJudge;
}

export interface CourtAppeal {
  id: string;
  original_case_id: string;
  original_judgment_id: string;
  appeal_case_number: string;
  appellant_party_id: string;
  appeal_type: AppealType;
  grounds: string;
  filing_date: string;
  status: AppealStatus;
  appellate_court_id: string;
  decision_date: string | null;
  decision_summary: string | null;
  created_at: string;
  original_case?: CourtCase;
  original_judgment?: CourtJudgment;
  appellate_court?: CourtHouse;
}

export interface CourtFine {
  id: string;
  case_id: string;
  fine_type: FineType;
  amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  due_date: string | null;
  paid_date: string | null;
  receipt_number: string | null;
  station_wallet_id: string | null;
  created_at: string;
}

export interface CourtBail {
  id: string;
  case_id: string;
  party_id: string;
  bail_type: BailType;
  amount: number;
  conditions: string[];
  posted_date: string | null;
  posted_by: string | null;
  release_date: string | null;
  forfeiture_date: string | null;
  forfeiture_reason: string | null;
  status: BailStatus;
  station_wallet_id: string | null;
  created_at: string;
  party?: CourtParty;
}

export interface CourtJuror {
  id: string;
  court_house_id: string;
  full_name: string;
  id_number: string;
  phone: string | null;
  occupation: string | null;
  is_available: boolean;
  summons_date: string | null;
  attendance_date: string | null;
  stipend_paid: number;
  stipend_paid_date: string | null;
  created_at: string;
}

export interface CourtJuryAssignment {
  id: string;
  case_id: string;
  juror_id: string;
  assigned_date: string;
  is_foreperson: boolean;
  stipend_amount: number;
  created_at: string;
  juror?: CourtJuror;
}

export interface CourtStaffAttendance {
  id: string;
  court_house_id: string;
  staff_type: StaffType;
  staff_id: string;
  staff_name: string;
  shift_date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  station_id: string | null;
  verified_by: string | null;
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
  net_amount: number;
  status: PayrollStatus;
  paid_date: string | null;
  transaction_ref: string | null;
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
  vendor_name: string | null;
  status: ProcurementStatus;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface CourtStats {
  total_cases: number;
  cases_by_status: Record<CaseStatus, number>;
  cases_by_type: Record<CaseType, number>;
  total_hearings: number;
  hearings_this_week: number;
  total_judgments: number;
  total_fines: number;
  fines_collected: number;
  fines_outstanding: number;
  total_bails: number;
  bails_posted: number;
  clearance_rate: number;
  backlog_count: number;
  avg_days_to_judgment: number;
}
