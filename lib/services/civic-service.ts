// ============================================================
// MTAA OS V10 - Civic Service (Police + Courts + Prisons + Government)
// 68 tables total
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface CivicCase {
  id: string; case_number: string; title: string; description?: string; category?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed'; priority?: string; assigned_to?: string;
  reporter_id?: string; created_at?: string; updated_at?: string;
}

export interface PoliceCase {
  id: string; case_number: string; title: string; description?: string; crime_type?: string;
  status: 'reported' | 'investigating' | 'solved' | 'closed' | 'dismissed'; officer_id?: string;
  victim_id?: string; suspect_id?: string; location?: string; reported_at?: string; created_at?: string;
}

export interface PoliceOfficer {
  id: string; user_id?: string; badge_number: string; rank: string; department?: string;
  station_id?: string; status: 'active' | 'inactive' | 'suspended'; created_at?: string;
}

export interface PolicePatrol {
  id: string; officer_id: string; vehicle_id?: string; route?: string; start_time?: string;
  end_time?: string; status: 'active' | 'completed' | 'cancelled'; notes?: string; created_at?: string;
}

export interface PoliceFine {
  id: string; case_id?: string; offender_id?: string; amount: number; reason: string;
  status: 'pending' | 'paid' | 'overdue' | 'appealed'; issued_at?: string; due_date?: string;
}

export interface CourtCase {
  id: string; case_number: string; police_case_id?: string; title: string; description?: string;
  case_type?: string; status: 'filed' | 'hearing' | 'deliberation' | 'judgment' | 'appealed' | 'closed';
  judge_id?: string; plaintiff_id?: string; defendant_id?: string; filed_at?: string; created_at?: string;
}

export interface CourtHearing {
  id: string; case_id: string; hearing_date: string; hearing_time?: string; courtroom?: string;
  judge_id?: string; status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  notes?: string; created_at?: string;
}

export interface CourtJudge {
  id: string; user_id?: string; court_id?: string; name: string; specialization?: string;
  appointment_date?: string; status: 'active' | 'retired' | 'suspended'; created_at?: string;
}

export interface CourtJudgment {
  id: string; case_id: string; hearing_id?: string; judge_id: string; verdict: string;
  sentence?: string; fine_amount?: number; imprisonment_duration?: string; issued_at?: string;
  status: 'issued' | 'appealed' | 'executed' | 'overturned';
}

export interface PrisonInmate {
  id: string; user_id?: string; case_id?: string; prison_id: string; cell_id?: string;
  sentence_start?: string; sentence_end?: string; status: 'incarcerated' | 'released' | 'transferred' | 'escaped';
  created_at?: string;
}

export interface PrisonCell {
  id: string; prison_id: string; cell_number: string; capacity: number; current_occupants?: number;
  type?: string; status: 'available' | 'occupied' | 'maintenance';
}

export interface PrisonVisit {
  id: string; inmate_id: string; visitor_id: string; visit_date: string; visit_time?: string;
  duration?: number; status: 'scheduled' | 'completed' | 'cancelled' | 'denied'; notes?: string;
}

export interface Prison {
  id: string; name: string; location?: string; capacity: number; current_inmates?: number;
  status: 'active' | 'closed' | 'overcrowded'; created_at?: string;
}

export interface TreasuryPayment {
  id: string; payer_id?: string; amount: number; payment_type: string; description?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded'; created_at?: string;
}

export interface TreasuryTaxpayer {
  id: string; user_id?: string; tax_id: string; name: string; tax_type?: string; amount_due?: number;
  amount_paid?: number; status?: string; created_at?: string;
}

export interface RevenuePayment {
  id: string; taxpayer_id?: string; amount: number; revenue_type: string; description?: string;
  status: 'pending' | 'completed' | 'failed'; created_at?: string;
}

export interface RevenueTaxpayer {
  id: string; user_id?: string; taxpayer_id: string; name: string; sector?: string; status?: string;
  created_at?: string;
}

export interface BorderPost {
  id: string; name: string; location?: string; country?: string; status?: string; created_at?: string;
}

export interface BorderCrossing {
  id: string; border_post_id: string; person_id?: string; vehicle_id?: string; crossing_type?: string;
  direction: 'in' | 'out'; status: 'pending' | 'cleared' | 'denied' | 'detained'; crossed_at?: string;
}

export interface AgricultureRecord {
  id: string; farmer_id?: string; crop_type?: string; acreage?: number; yield_estimate?: number;
  status?: string; created_at?: string;
}

export interface ImmigrationRecord {
  id: string; person_id?: string; passport_number?: string; visa_type?: string; entry_date?: string;
  exit_date?: string; status?: string; created_at?: string;
}

export interface TransportRecord {
  id: string; vehicle_id?: string; license_plate?: string; owner_id?: string; route?: string;
  status?: string; created_at?: string;
}

export interface CustomsRecord {
  id: string; declaration_id?: string; importer_id?: string; goods_description?: string;
  value?: number; duty_amount?: number; status: 'pending' | 'cleared' | 'held' | 'rejected'; created_at?: string;
}

export interface GovernanceRecord {
  id: string; record_type: string; title: string; description?: string; department?: string;
  status?: string; created_at?: string;
}

export interface CountyRecord {
  id: string; county_name: string; governor_id?: string; population?: number; budget?: number;
  status?: string; created_at?: string;
}

export interface CivicAuditLog {
  id: string; user_id?: string; action: string; entity_type?: string; entity_id?: string;
  details?: any; created_at?: string;
}

export interface CivicNotification {
  id: string; recipient_id: string; title: string; message: string; type?: string;
  status: 'unread' | 'read' | 'dismissed'; created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[CivicService]', err?.message || err);
  return fallback;
}

// ─── CIVIC CASES ───
export async function getCivicCases(): Promise<CivicCase[]> {
  const { data, error } = await supabase.from('civic_cases').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getCivicCaseById(id: string): Promise<CivicCase | null> {
  const { data, error } = await supabase.from('civic_cases').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createCivicCase(data: Partial<CivicCase>): Promise<CivicCase | null> {
  const { data: result, error } = await supabase.from('civic_cases').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCivicCase(id: string, data: Partial<CivicCase>): Promise<CivicCase | null> {
  const { data: result, error } = await supabase.from('civic_cases').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCivicCase(id: string): Promise<boolean> {
  const { error } = await supabase.from('civic_cases').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── POLICE CASES ───
export async function getPoliceCases(): Promise<PoliceCase[]> {
  const { data, error } = await supabase.from('police_cases').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getPoliceCaseById(id: string): Promise<PoliceCase | null> {
  const { data, error } = await supabase.from('police_cases').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPoliceCasesByOfficer(officerId: string): Promise<PoliceCase[]> {
  const { data, error } = await supabase.from('police_cases').select('*').eq('officer_id', officerId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPoliceCase(data: Partial<PoliceCase>): Promise<PoliceCase | null> {
  const { data: result, error } = await supabase.from('police_cases').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePoliceCase(id: string, data: Partial<PoliceCase>): Promise<PoliceCase | null> {
  const { data: result, error } = await supabase.from('police_cases').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePoliceCase(id: string): Promise<boolean> {
  const { error } = await supabase.from('police_cases').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── POLICE OFFICERS ───
export async function getPoliceOfficers(): Promise<PoliceOfficer[]> {
  const { data, error } = await supabase.from('police_officers').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPoliceOfficerById(id: string): Promise<PoliceOfficer | null> {
  const { data, error } = await supabase.from('police_officers').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPoliceOfficerByUserId(userId: string): Promise<PoliceOfficer | null> {
  const { data, error } = await supabase.from('police_officers').select('*').eq('user_id', userId).single();
  if (error) return handleError(error, null); return data;
}
export async function createPoliceOfficer(data: Partial<PoliceOfficer>): Promise<PoliceOfficer | null> {
  const { data: result, error } = await supabase.from('police_officers').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePoliceOfficer(id: string, data: Partial<PoliceOfficer>): Promise<PoliceOfficer | null> {
  const { data: result, error } = await supabase.from('police_officers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePoliceOfficer(id: string): Promise<boolean> {
  const { error } = await supabase.from('police_officers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── POLICE PATROLS ───
export async function getPolicePatrols(): Promise<PolicePatrol[]> {
  const { data, error } = await supabase.from('police_patrols').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPolicePatrolById(id: string): Promise<PolicePatrol | null> {
  const { data, error } = await supabase.from('police_patrols').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPolicePatrolsByOfficer(officerId: string): Promise<PolicePatrol[]> {
  const { data, error } = await supabase.from('police_patrols').select('*').eq('officer_id', officerId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPolicePatrol(data: Partial<PolicePatrol>): Promise<PolicePatrol | null> {
  const { data: result, error } = await supabase.from('police_patrols').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePolicePatrol(id: string, data: Partial<PolicePatrol>): Promise<PolicePatrol | null> {
  const { data: result, error } = await supabase.from('police_patrols').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePolicePatrol(id: string): Promise<boolean> {
  const { error } = await supabase.from('police_patrols').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── POLICE FINES ───
export async function getPoliceFines(): Promise<PoliceFine[]> {
  const { data, error } = await supabase.from('police_fines').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPoliceFineById(id: string): Promise<PoliceFine | null> {
  const { data, error } = await supabase.from('police_fines').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPoliceFinesByOffender(offenderId: string): Promise<PoliceFine[]> {
  const { data, error } = await supabase.from('police_fines').select('*').eq('offender_id', offenderId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPoliceFine(data: Partial<PoliceFine>): Promise<PoliceFine | null> {
  const { data: result, error } = await supabase.from('police_fines').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePoliceFine(id: string, data: Partial<PoliceFine>): Promise<PoliceFine | null> {
  const { data: result, error } = await supabase.from('police_fines').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePoliceFine(id: string): Promise<boolean> {
  const { error } = await supabase.from('police_fines').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── COURT CASES ───
export async function getCourtCases(): Promise<CourtCase[]> {
  const { data, error } = await supabase.from('court_cases').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getCourtCaseById(id: string): Promise<CourtCase | null> {
  const { data, error } = await supabase.from('court_cases').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getCourtCasesByJudge(judgeId: string): Promise<CourtCase[]> {
  const { data, error } = await supabase.from('court_cases').select('*').eq('judge_id', judgeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCourtCase(data: Partial<CourtCase>): Promise<CourtCase | null> {
  const { data: result, error } = await supabase.from('court_cases').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCourtCase(id: string, data: Partial<CourtCase>): Promise<CourtCase | null> {
  const { data: result, error } = await supabase.from('court_cases').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCourtCase(id: string): Promise<boolean> {
  const { error } = await supabase.from('court_cases').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── COURT HEARINGS ───
export async function getCourtHearings(): Promise<CourtHearing[]> {
  const { data, error } = await supabase.from('court_hearings').select('*').order('hearing_date', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function getCourtHearingById(id: string): Promise<CourtHearing | null> {
  const { data, error } = await supabase.from('court_hearings').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getCourtHearingsByCase(caseId: string): Promise<CourtHearing[]> {
  const { data, error } = await supabase.from('court_hearings').select('*').eq('case_id', caseId);
  if (error) return handleError(error, []); return data || [];
}
export async function getCourtHearingsByJudge(judgeId: string): Promise<CourtHearing[]> {
  const { data, error } = await supabase.from('court_hearings').select('*').eq('judge_id', judgeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCourtHearing(data: Partial<CourtHearing>): Promise<CourtHearing | null> {
  const { data: result, error } = await supabase.from('court_hearings').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCourtHearing(id: string, data: Partial<CourtHearing>): Promise<CourtHearing | null> {
  const { data: result, error } = await supabase.from('court_hearings').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCourtHearing(id: string): Promise<boolean> {
  const { error } = await supabase.from('court_hearings').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── COURT JUDGES ───
export async function getCourtJudges(): Promise<CourtJudge[]> {
  const { data, error } = await supabase.from('court_judges').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getCourtJudgeById(id: string): Promise<CourtJudge | null> {
  const { data, error } = await supabase.from('court_judges').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createCourtJudge(data: Partial<CourtJudge>): Promise<CourtJudge | null> {
  const { data: result, error } = await supabase.from('court_judges').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCourtJudge(id: string, data: Partial<CourtJudge>): Promise<CourtJudge | null> {
  const { data: result, error } = await supabase.from('court_judges').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCourtJudge(id: string): Promise<boolean> {
  const { error } = await supabase.from('court_judges').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── COURT JUDGMENTS ───
export async function getCourtJudgments(): Promise<CourtJudgment[]> {
  const { data, error } = await supabase.from('court_judgments').select('*').order('issued_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getCourtJudgmentById(id: string): Promise<CourtJudgment | null> {
  const { data, error } = await supabase.from('court_judgments').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getCourtJudgmentsByCase(caseId: string): Promise<CourtJudgment[]> {
  const { data, error } = await supabase.from('court_judgments').select('*').eq('case_id', caseId);
  if (error) return handleError(error, []); return data || [];
}
export async function createCourtJudgment(data: Partial<CourtJudgment>): Promise<CourtJudgment | null> {
  const { data: result, error } = await supabase.from('court_judgments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCourtJudgment(id: string, data: Partial<CourtJudgment>): Promise<CourtJudgment | null> {
  const { data: result, error } = await supabase.from('court_judgments').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCourtJudgment(id: string): Promise<boolean> {
  const { error } = await supabase.from('court_judgments').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PRISON INMATES ───
export async function getPrisonInmates(): Promise<PrisonInmate[]> {
  const { data, error } = await supabase.from('prison_inmates').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPrisonInmateById(id: string): Promise<PrisonInmate | null> {
  const { data, error } = await supabase.from('prison_inmates').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPrisonInmatesByPrison(prisonId: string): Promise<PrisonInmate[]> {
  const { data, error } = await supabase.from('prison_inmates').select('*').eq('prison_id', prisonId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPrisonInmate(data: Partial<PrisonInmate>): Promise<PrisonInmate | null> {
  const { data: result, error } = await supabase.from('prison_inmates').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePrisonInmate(id: string, data: Partial<PrisonInmate>): Promise<PrisonInmate | null> {
  const { data: result, error } = await supabase.from('prison_inmates').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePrisonInmate(id: string): Promise<boolean> {
  const { error } = await supabase.from('prison_inmates').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PRISON CELLS ───
export async function getPrisonCells(): Promise<PrisonCell[]> {
  const { data, error } = await supabase.from('prison_cells').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPrisonCellById(id: string): Promise<PrisonCell | null> {
  const { data, error } = await supabase.from('prison_cells').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPrisonCellsByPrison(prisonId: string): Promise<PrisonCell[]> {
  const { data, error } = await supabase.from('prison_cells').select('*').eq('prison_id', prisonId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPrisonCell(data: Partial<PrisonCell>): Promise<PrisonCell | null> {
  const { data: result, error } = await supabase.from('prison_cells').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePrisonCell(id: string, data: Partial<PrisonCell>): Promise<PrisonCell | null> {
  const { data: result, error } = await supabase.from('prison_cells').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePrisonCell(id: string): Promise<boolean> {
  const { error } = await supabase.from('prison_cells').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PRISON VISITS ───
export async function getPrisonVisits(): Promise<PrisonVisit[]> {
  const { data, error } = await supabase.from('prison_visits').select('*').order('visit_date', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function getPrisonVisitById(id: string): Promise<PrisonVisit | null> {
  const { data, error } = await supabase.from('prison_visits').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getPrisonVisitsByInmate(inmateId: string): Promise<PrisonVisit[]> {
  const { data, error } = await supabase.from('prison_visits').select('*').eq('inmate_id', inmateId);
  if (error) return handleError(error, []); return data || [];
}
export async function createPrisonVisit(data: Partial<PrisonVisit>): Promise<PrisonVisit | null> {
  const { data: result, error } = await supabase.from('prison_visits').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePrisonVisit(id: string, data: Partial<PrisonVisit>): Promise<PrisonVisit | null> {
  const { data: result, error } = await supabase.from('prison_visits').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePrisonVisit(id: string): Promise<boolean> {
  const { error } = await supabase.from('prison_visits').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── PRISONS ───
export async function getPrisons(): Promise<Prison[]> {
  const { data, error } = await supabase.from('prisons').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getPrisonById(id: string): Promise<Prison | null> {
  const { data, error } = await supabase.from('prisons').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createPrison(data: Partial<Prison>): Promise<Prison | null> {
  const { data: result, error } = await supabase.from('prisons').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updatePrison(id: string, data: Partial<Prison>): Promise<Prison | null> {
  const { data: result, error } = await supabase.from('prisons').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deletePrison(id: string): Promise<boolean> {
  const { error } = await supabase.from('prisons').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TREASURY ───
export async function getTreasuryPayments(): Promise<TreasuryPayment[]> {
  const { data, error } = await supabase.from('treasury_payments').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getTreasuryPaymentById(id: string): Promise<TreasuryPayment | null> {
  const { data, error } = await supabase.from('treasury_payments').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTreasuryPayment(data: Partial<TreasuryPayment>): Promise<TreasuryPayment | null> {
  const { data: result, error } = await supabase.from('treasury_payments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTreasuryPayment(id: string, data: Partial<TreasuryPayment>): Promise<TreasuryPayment | null> {
  const { data: result, error } = await supabase.from('treasury_payments').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTreasuryPayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('treasury_payments').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

export async function getTreasuryTaxpayers(): Promise<TreasuryTaxpayer[]> {
  const { data, error } = await supabase.from('treasury_taxpayers').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTreasuryTaxpayerById(id: string): Promise<TreasuryTaxpayer | null> {
  const { data, error } = await supabase.from('treasury_taxpayers').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTreasuryTaxpayer(data: Partial<TreasuryTaxpayer>): Promise<TreasuryTaxpayer | null> {
  const { data: result, error } = await supabase.from('treasury_taxpayers').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTreasuryTaxpayer(id: string, data: Partial<TreasuryTaxpayer>): Promise<TreasuryTaxpayer | null> {
  const { data: result, error } = await supabase.from('treasury_taxpayers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTreasuryTaxpayer(id: string): Promise<boolean> {
  const { error } = await supabase.from('treasury_taxpayers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── REVENUE ───
export async function getRevenuePayments(): Promise<RevenuePayment[]> {
  const { data, error } = await supabase.from('revenue_payments').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getRevenuePaymentById(id: string): Promise<RevenuePayment | null> {
  const { data, error } = await supabase.from('revenue_payments').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createRevenuePayment(data: Partial<RevenuePayment>): Promise<RevenuePayment | null> {
  const { data: result, error } = await supabase.from('revenue_payments').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRevenuePayment(id: string, data: Partial<RevenuePayment>): Promise<RevenuePayment | null> {
  const { data: result, error } = await supabase.from('revenue_payments').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRevenuePayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('revenue_payments').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

export async function getRevenueTaxpayers(): Promise<RevenueTaxpayer[]> {
  const { data, error } = await supabase.from('revenue_taxpayers').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function createRevenueTaxpayer(data: Partial<RevenueTaxpayer>): Promise<RevenueTaxpayer | null> {
  const { data: result, error } = await supabase.from('revenue_taxpayers').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateRevenueTaxpayer(id: string, data: Partial<RevenueTaxpayer>): Promise<RevenueTaxpayer | null> {
  const { data: result, error } = await supabase.from('revenue_taxpayers').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteRevenueTaxpayer(id: string): Promise<boolean> {
  const { error } = await supabase.from('revenue_taxpayers').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── BORDER ───
export async function getBorderPosts(): Promise<BorderPost[]> {
  const { data, error } = await supabase.from('border_posts').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getBorderPostById(id: string): Promise<BorderPost | null> {
  const { data, error } = await supabase.from('border_posts').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createBorderPost(data: Partial<BorderPost>): Promise<BorderPost | null> {
  const { data: result, error } = await supabase.from('border_posts').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateBorderPost(id: string, data: Partial<BorderPost>): Promise<BorderPost | null> {
  const { data: result, error } = await supabase.from('border_posts').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteBorderPost(id: string): Promise<boolean> {
  const { error } = await supabase.from('border_posts').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

export async function getBorderCrossings(): Promise<BorderCrossing[]> {
  const { data, error } = await supabase.from('border_crossings').select('*').order('crossed_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getBorderCrossingById(id: string): Promise<BorderCrossing | null> {
  const { data, error } = await supabase.from('border_crossings').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createBorderCrossing(data: Partial<BorderCrossing>): Promise<BorderCrossing | null> {
  const { data: result, error } = await supabase.from('border_crossings').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateBorderCrossing(id: string, data: Partial<BorderCrossing>): Promise<BorderCrossing | null> {
  const { data: result, error } = await supabase.from('border_crossings').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteBorderCrossing(id: string): Promise<boolean> {
  const { error } = await supabase.from('border_crossings').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── AGRICULTURE ───
export async function getAgricultureRecords(): Promise<AgricultureRecord[]> {
  const { data, error } = await supabase.from('agriculture_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getAgricultureRecordById(id: string): Promise<AgricultureRecord | null> {
  const { data, error } = await supabase.from('agriculture_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createAgricultureRecord(data: Partial<AgricultureRecord>): Promise<AgricultureRecord | null> {
  const { data: result, error } = await supabase.from('agriculture_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateAgricultureRecord(id: string, data: Partial<AgricultureRecord>): Promise<AgricultureRecord | null> {
  const { data: result, error } = await supabase.from('agriculture_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteAgricultureRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('agriculture_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── IMMIGRATION ───
export async function getImmigrationRecords(): Promise<ImmigrationRecord[]> {
  const { data, error } = await supabase.from('immigration_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getImmigrationRecordById(id: string): Promise<ImmigrationRecord | null> {
  const { data, error } = await supabase.from('immigration_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createImmigrationRecord(data: Partial<ImmigrationRecord>): Promise<ImmigrationRecord | null> {
  const { data: result, error } = await supabase.from('immigration_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateImmigrationRecord(id: string, data: Partial<ImmigrationRecord>): Promise<ImmigrationRecord | null> {
  const { data: result, error } = await supabase.from('immigration_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteImmigrationRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('immigration_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRANSPORT ───
export async function getTransportRecords(): Promise<TransportRecord[]> {
  const { data, error } = await supabase.from('transport_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getTransportRecordById(id: string): Promise<TransportRecord | null> {
  const { data, error } = await supabase.from('transport_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTransportRecord(data: Partial<TransportRecord>): Promise<TransportRecord | null> {
  const { data: result, error } = await supabase.from('transport_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTransportRecord(id: string, data: Partial<TransportRecord>): Promise<TransportRecord | null> {
  const { data: result, error } = await supabase.from('transport_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTransportRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('transport_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CUSTOMS ───
export async function getCustomsRecords(): Promise<CustomsRecord[]> {
  const { data, error } = await supabase.from('customs_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getCustomsRecordById(id: string): Promise<CustomsRecord | null> {
  const { data, error } = await supabase.from('customs_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createCustomsRecord(data: Partial<CustomsRecord>): Promise<CustomsRecord | null> {
  const { data: result, error } = await supabase.from('customs_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCustomsRecord(id: string, data: Partial<CustomsRecord>): Promise<CustomsRecord | null> {
  const { data: result, error } = await supabase.from('customs_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCustomsRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('customs_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── GOVERNANCE ───
export async function getGovernanceRecords(): Promise<GovernanceRecord[]> {
  const { data, error } = await supabase.from('governance_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getGovernanceRecordById(id: string): Promise<GovernanceRecord | null> {
  const { data, error } = await supabase.from('governance_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createGovernanceRecord(data: Partial<GovernanceRecord>): Promise<GovernanceRecord | null> {
  const { data: result, error } = await supabase.from('governance_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateGovernanceRecord(id: string, data: Partial<GovernanceRecord>): Promise<GovernanceRecord | null> {
  const { data: result, error } = await supabase.from('governance_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteGovernanceRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('governance_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── COUNTY ───
export async function getCountyRecords(): Promise<CountyRecord[]> {
  const { data, error } = await supabase.from('county_records').select('*');
  if (error) return handleError(error, []); return data || [];
}
export async function getCountyRecordById(id: string): Promise<CountyRecord | null> {
  const { data, error } = await supabase.from('county_records').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createCountyRecord(data: Partial<CountyRecord>): Promise<CountyRecord | null> {
  const { data: result, error } = await supabase.from('county_records').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCountyRecord(id: string, data: Partial<CountyRecord>): Promise<CountyRecord | null> {
  const { data: result, error } = await supabase.from('county_records').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCountyRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('county_records').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CIVIC AUDIT LOGS ───
export async function getCivicAuditLogs(): Promise<CivicAuditLog[]> {
  const { data, error } = await supabase.from('civic_audit_log').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createCivicAuditLog(data: Partial<CivicAuditLog>): Promise<CivicAuditLog | null> {
  const { data: result, error } = await supabase.from('civic_audit_log').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── CIVIC NOTIFICATIONS ───
export async function getCivicNotifications(): Promise<CivicNotification[]> {
  const { data, error } = await supabase.from('civic_notifications').select('*').eq('status', 'unread').order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getCivicNotificationById(id: string): Promise<CivicNotification | null> {
  const { data, error } = await supabase.from('civic_notifications').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createCivicNotification(data: Partial<CivicNotification>): Promise<CivicNotification | null> {
  const { data: result, error } = await supabase.from('civic_notifications').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateCivicNotification(id: string, data: Partial<CivicNotification>): Promise<CivicNotification | null> {
  const { data: result, error } = await supabase.from('civic_notifications').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteCivicNotification(id: string): Promise<boolean> {
  const { error } = await supabase.from('civic_notifications').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── CIVIC OPERATIONS (edge function stub) ───
export async function civicOperation(type: string, data?: any): Promise<any> {
  try {
    const { data: result, error } = await supabase.functions.invoke('civic-operations', { body: { type, data } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

// ─── HANDOFFS ───
export async function policeToCourtHandoff(policeCaseId: string, courtData: any): Promise<CourtCase | null> {
  try {
    const { data: result, error } = await supabase.functions.invoke('police-to-court-handoff', { body: { policeCaseId, courtData } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

export async function courtToPrisonHandoff(courtCaseId: string, prisonData: any): Promise<PrisonInmate | null> {
  try {
    const { data: result, error } = await supabase.functions.invoke('court-to-prison-handoff', { body: { courtCaseId, prisonData } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

// ─── STATS ───
export async function getCivicStats(): Promise<any> {
  const { count: policeCases } = await supabase.from('police_cases').select('*', { count: 'exact', head: true });
  const { count: courtCases } = await supabase.from('court_cases').select('*', { count: 'exact', head: true });
  const { count: inmates } = await supabase.from('prison_inmates').select('*', { count: 'exact', head: true });
  const { count: officers } = await supabase.from('police_officers').select('*', { count: 'exact', head: true });
  return { policeCases, courtCases, inmates, officers };
}
