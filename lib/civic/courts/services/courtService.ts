import { supabase } from '@/lib/supabase';

export async function getAppeals() {
  const { data } = await supabase.from('court_appeals').select('*');
  return data || [];
}

export async function createAppeal(data: any) {
  const { data: result } = await supabase.from('court_appeals').insert(data).select().maybeSingle();
  return result;
}

export async function updateAppeal(id: string, data: any) {
  const { data: result } = await supabase.from('court_appeals').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function getAttendance() {
  const { data } = await supabase.from('court_attendance').select('*');
  return data || [];
}

export async function clockIn(data: any) {
  const { data: result } = await supabase.from('court_attendance').insert(data).select().maybeSingle();
  return result;
}

export async function clockOut(id: string) {
  const { data: result } = await supabase.from('court_attendance').update({ clock_out: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getBails() {
  const { data } = await supabase.from('court_bails').select('*');
  return data || [];
}

export async function createBail(data: any) {
  const { data: result } = await supabase.from('court_bails').insert(data).select().maybeSingle();
  return result;
}

export async function updateBail(id: string, data: any) {
  const { data: result } = await supabase.from('court_bails').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function postBail(id: string, amount: number) {
  const { data: result } = await supabase.from('court_bails').update({ status: 'posted', posted_date: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function releaseOnBail(id: string) {
  const { data: result } = await supabase.from('court_bails').update({ status: 'released', release_date: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getCases() {
  const { data } = await supabase.from('court_cases').select('*');
  return data || [];
}

export async function getCase(id: string) {
  const { data } = await supabase.from('court_cases').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function createCase(data: any) {
  const { data: result } = await supabase.from('court_cases').insert(data).select().maybeSingle();
  return result;
}

export async function updateCase(id: string, data: any) {
  const { data: result } = await supabase.from('court_cases').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteCase(id: string) {
  await supabase.from('court_cases').delete().eq('id', id);
}

export async function addParty(caseId: string, party: any) {
  const { data: result } = await supabase.from('court_parties').insert({ ...party, case_id: caseId }).select().maybeSingle();
  return result;
}

export async function removeParty(partyId: string) {
  await supabase.from('court_parties').delete().eq('id', partyId);
}

export async function getCourtHouses() {
  const { data } = await supabase.from('court_houses').select('*');
  return data || [];
}

export async function getCourtHouse(id: string) {
  const { data } = await supabase.from('court_houses').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function createCourtHouse(data: any) {
  const { data: result } = await supabase.from('court_houses').insert(data).select().maybeSingle();
  return result;
}

export async function updateCourtHouse(id: string, data: any) {
  const { data: result } = await supabase.from('court_houses').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteCourtHouse(id: string) {
  await supabase.from('court_houses').delete().eq('id', id);
}

export async function getFines() {
  const { data } = await supabase.from('court_fines').select('*');
  return data || [];
}

export async function createFine(data: any) {
  const { data: result } = await supabase.from('court_fines').insert(data).select().maybeSingle();
  return result;
}

export async function updateFine(id: string, data: any) {
  const { data: result } = await supabase.from('court_fines').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function recordPayment(id: string, amount: number) {
  const { data: result } = await supabase.from('court_fines').update({ paid_amount: amount, paid_date: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getHearings() {
  const { data } = await supabase.from('court_hearings').select('*');
  return data || [];
}

export async function createHearing(data: any) {
  const { data: result } = await supabase.from('court_hearings').insert(data).select().maybeSingle();
  return result;
}

export async function updateHearing(id: string, data: any) {
  const { data: result } = await supabase.from('court_hearings').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteHearing(id: string) {
  await supabase.from('court_hearings').delete().eq('id', id);
}

export async function getCourtJudges() {
  const { data } = await supabase.from('court_judges').select('*');
  return data || [];
}

export async function createCourtJudge(data: any) {
  const { data: result } = await supabase.from('court_judges').insert(data).select().maybeSingle();
  return result;
}

export async function updateCourtJudge(id: string, data: any) {
  const { data: result } = await supabase.from('court_judges').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteCourtJudge(id: string) {
  await supabase.from('court_judges').delete().eq('id', id);
}

export async function getJudgments() {
  const { data } = await supabase.from('court_judgments').select('*');
  return data || [];
}

export async function createJudgment(data: any) {
  const { data: result } = await supabase.from('court_judgments').insert(data).select().maybeSingle();
  return result;
}

export async function updateJudgment(id: string, data: any) {
  const { data: result } = await supabase.from('court_judgments').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteJudgment(id: string) {
  await supabase.from('court_judgments').delete().eq('id', id);
}

export async function getJuryPool() {
  const { data } = await supabase.from('court_jurors').select('*');
  return data || [];
}

export async function createJuror(data: any) {
  const { data: result } = await supabase.from('court_jurors').insert(data).select().maybeSingle();
  return result;
}

export async function updateJuror(id: string, data: any) {
  const { data: result } = await supabase.from('court_jurors').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function getJuryAssignments() {
  const { data } = await supabase.from('court_jury_assignments').select('*');
  return data || [];
}

export async function assignJuror(caseId: string, jurorId: string) {
  const { data: result } = await supabase.from('court_jury_assignments').insert({ case_id: caseId, juror_id: jurorId }).select().maybeSingle();
  return result;
}

export async function removeJurorAssignment(id: string) {
  await supabase.from('court_jury_assignments').delete().eq('id', id);
}

export async function getPayroll() {
  const { data } = await supabase.from('court_payroll').select('*');
  return data || [];
}

export async function createPayrollEntry(data: any) {
  const { data: result } = await supabase.from('court_payroll').insert(data).select().maybeSingle();
  return result;
}

export async function approvePayroll(id: string) {
  const { data: result } = await supabase.from('court_payroll').update({ status: 'approved' }).eq('id', id).select().maybeSingle();
  return result;
}

export async function markPaid(id: string) {
  const { data: result } = await supabase.from('court_payroll').update({ status: 'paid' }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getProcurement() {
  const { data } = await supabase.from('court_procurement').select('*');
  return data || [];
}

export async function createProcurement(data: any) {
  const { data: result } = await supabase.from('court_procurement').insert(data).select().maybeSingle();
  return result;
}

export async function updateProcurement(id: string, data: any) {
  const { data: result } = await supabase.from('court_procurement').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function getCourtStats() {
  return { total_cases: 0, pending_cases: 0, resolved_cases: 0, total_hearings: 0, total_fines: 0, total_bails: 0 };
}

export async function getCourtRooms() {
  const { data } = await supabase.from('court_rooms').select('*');
  return data || [];
}
