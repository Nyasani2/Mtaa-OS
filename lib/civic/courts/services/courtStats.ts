import { supabase } from '@/lib/supabase';
import { CourtStats } from '@/types/courts';

export async function getCourtStats(): Promise<CourtStats> {
  const { data: cases, error: casesError } = await supabase.from('court_cases').select('status, case_type, filing_date, created_at');
  if (casesError) throw casesError;

  const { data: hearings, error: hearingsError } = await supabase.from('court_hearings').select('scheduled_date');
  if (hearingsError) throw hearingsError;

  const { data: judgments, error: judgmentsError } = await supabase.from('court_judgments').select('delivered_date');
  if (judgmentsError) throw judgmentsError;

  const { data: fines, error: finesError } = await supabase.from('court_fines').select('amount, amount_paid, payment_status');
  if (finesError) throw finesError;

  const { data: bails, error: bailsError } = await supabase.from('court_bails').select('status');
  if (bailsError) throw bailsError;

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const casesByStatus: Record<string, number> = {};
  const casesByType: Record<string, number> = {};
  cases?.forEach((c: any) => {
    casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
    casesByType[c.case_type] = (casesByType[c.case_type] || 0) + 1;
  });

  const totalFines = fines?.reduce((sum: number, f: any) => sum + (f.amount || 0), 0) || 0;
  const finesCollected = fines?.reduce((sum: number, f: any) => sum + (f.amount_paid || 0), 0) || 0;

  const closedStatuses = ['closed', 'judgment', 'sentenced', 'dismissed'];
  const closedCount = cases?.filter((c: any) => closedStatuses.includes(c.status)).length || 0;
  const totalCases = cases?.length || 0;
  const backlogCount = cases?.filter((c: any) => c.status === 'filed' || c.status === 'scheduled').length || 0;

  return {
    total_cases: totalCases,
    cases_by_status: casesByStatus as any,
    cases_by_type: casesByType as any,
    total_hearings: hearings?.length || 0,
    hearings_this_week: hearings?.filter((h: any) => new Date(h.scheduled_date) >= weekStart).length || 0,
    total_judgments: judgments?.length || 0,
    total_fines: fines?.length || 0,
    fines_collected: finesCollected,
    fines_outstanding: totalFines - finesCollected,
    total_bails: bails?.length || 0,
    bails_posted: bails?.filter((b: any) => b.status === 'posted').length || 0,
    clearance_rate: totalCases > 0 ? Math.round((closedCount / totalCases) * 100) : 0,
    backlog_count: backlogCount,
    avg_days_to_judgment: 0, // Requires judgment vs filing date calc
  };
}
