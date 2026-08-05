import { supabase } from '@/lib/supabase';

export async function getCells() {
  const { data } = await supabase.from('prison_cells').select('*');
  return data || [];
}

export async function getCell(id: string) {
  const { data } = await supabase.from('prison_cells').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function createCell(data: any) {
  const { data: result } = await supabase.from('prison_cells').insert(data).select().maybeSingle();
  return result;
}

export async function updateCell(id: string, data: any) {
  const { data: result } = await supabase.from('prison_cells').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteCell(id: string) {
  await supabase.from('prison_cells').delete().eq('id', id);
}

export async function getFacilities() {
  const { data } = await supabase.from('prison_facilities').select('*');
  return data || [];
}

export async function getFacility(id: string) {
  const { data } = await supabase.from('prison_facilities').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function createFacility(data: any) {
  const { data: result } = await supabase.from('prison_facilities').insert(data).select().maybeSingle();
  return result;
}

export async function updateFacility(id: string, data: any) {
  const { data: result } = await supabase.from('prison_facilities').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteFacility(id: string) {
  await supabase.from('prison_facilities').delete().eq('id', id);
}

export async function getIncidents() {
  const { data } = await supabase.from('prison_incidents').select('*');
  return data || [];
}

export async function createIncident(data: any) {
  const { data: result } = await supabase.from('prison_incidents').insert(data).select().maybeSingle();
  return result;
}

export async function updateIncident(id: string, data: any) {
  const { data: result } = await supabase.from('prison_incidents').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function resolveIncident(id: string) {
  const { data: result } = await supabase.from('prison_incidents').update({ resolved: true }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getInmates() {
  const { data } = await supabase.from('prison_inmates').select('*');
  return data || [];
}

export async function getInmate(id: string) {
  const { data } = await supabase.from('prison_inmates').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function createInmate(data: any) {
  const { data: result } = await supabase.from('prison_inmates').insert(data).select().maybeSingle();
  return result;
}

export async function updateInmate(id: string, data: any) {
  const { data: result } = await supabase.from('prison_inmates').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteInmate(id: string) {
  await supabase.from('prison_inmates').delete().eq('id', id);
}

export async function assignCell(inmateId: string, cellId: string) {
  const { data: result } = await supabase.from('prison_inmates').update({ cell_id: cellId }).eq('id', inmateId).select().maybeSingle();
  return result;
}

export async function releaseInmate(id: string) {
  const { data: result } = await supabase.from('prison_inmates').update({ status: 'released', release_date: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function transferInmate(id: string, toFacilityId: string) {
  const { data: result } = await supabase.from('prison_inmates').update({ facility_id: toFacilityId }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getMovements() {
  const { data } = await supabase.from('prison_movements').select('*');
  return data || [];
}

export async function createMovement(data: any) {
  const { data: result } = await supabase.from('prison_movements').insert(data).select().maybeSingle();
  return result;
}

export async function getParoleReviews() {
  const { data } = await supabase.from('prison_parole_reviews').select('*');
  return data || [];
}

export async function createParoleReview(data: any) {
  const { data: result } = await supabase.from('prison_parole_reviews').insert(data).select().maybeSingle();
  return result;
}

export async function updateParoleReview(id: string, data: any) {
  const { data: result } = await supabase.from('prison_parole_reviews').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function makeParoleDecision(id: string, decision: string) {
  const { data: result } = await supabase.from('prison_parole_reviews').update({ decision, decision_date: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getAttendance() {
  const { data } = await supabase.from('prison_attendance').select('*');
  return data || [];
}

export async function clockIn(data: any) {
  const { data: result } = await supabase.from('prison_attendance').insert(data).select().maybeSingle();
  return result;
}

export async function clockOut(id: string) {
  const { data: result } = await supabase.from('prison_attendance').update({ clock_out: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getPayroll() {
  const { data } = await supabase.from('prison_payroll').select('*');
  return data || [];
}

export async function createPayrollEntry(data: any) {
  const { data: result } = await supabase.from('prison_payroll').insert(data).select().maybeSingle();
  return result;
}

export async function approvePayroll(id: string) {
  const { data: result } = await supabase.from('prison_payroll').update({ status: 'approved' }).eq('id', id).select().maybeSingle();
  return result;
}

export async function markPaid(id: string) {
  const { data: result } = await supabase.from('prison_payroll').update({ status: 'paid' }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getProcurement() {
  const { data } = await supabase.from('prison_procurement').select('*');
  return data || [];
}

export async function createProcurement(data: any) {
  const { data: result } = await supabase.from('prison_procurement').insert(data).select().maybeSingle();
  return result;
}

export async function updateProcurement(id: string, data: any) {
  const { data: result } = await supabase.from('prison_procurement').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function getPrisonStats() {
  return { total_inmates: 0, total_facilities: 0, total_wards: 0, total_visits: 0, total_incidents: 0 };
}

export async function getVisits() {
  const { data } = await supabase.from('prison_visits').select('*');
  return data || [];
}

export async function createVisit(data: any) {
  const { data: result } = await supabase.from('prison_visits').insert(data).select().maybeSingle();
  return result;
}

export async function updateVisit(id: string, data: any) {
  const { data: result } = await supabase.from('prison_visits').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function checkInVisit(id: string) {
  const { data: result } = await supabase.from('prison_visits').update({ status: 'checked_in', check_in: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function checkOutVisit(id: string) {
  const { data: result } = await supabase.from('prison_visits').update({ status: 'checked_out', check_out: new Date().toISOString() }).eq('id', id).select().maybeSingle();
  return result;
}

export async function getWardens() {
  const { data } = await supabase.from('prison_wardens').select('*');
  return data || [];
}

export async function createWarden(data: any) {
  const { data: result } = await supabase.from('prison_wardens').insert(data).select().maybeSingle();
  return result;
}

export async function updateWarden(id: string, data: any) {
  const { data: result } = await supabase.from('prison_wardens').update(data).eq('id', id).select().maybeSingle();
  return result;
}

export async function deleteWarden(id: string) {
  await supabase.from('prison_wardens').delete().eq('id', id);
}
