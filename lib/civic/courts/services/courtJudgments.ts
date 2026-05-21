import { supabase } from '@/lib/supabase';
import { CourtJudgment } from '@/types/courts';

export async function getJudgments(caseId?: string): Promise<CourtJudgment[]> {
  let q = supabase.from('court_judgments').select(`*, court_judges:judge_id(*)`);
  if (caseId) q = q.eq('case_id', caseId);
  const { data, error } = await q.order('delivered_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, judge: d.court_judges }));
}

export async function createJudgment(judgment: Partial<CourtJudgment>): Promise<CourtJudgment> {
  const { data, error } = await supabase.from('court_judgments').insert(judgment).select().single();
  if (error) throw error;
  return data;
}

export async function updateJudgment(id: string, updates: Partial<CourtJudgment>): Promise<CourtJudgment> {
  const { data, error } = await supabase.from('court_judgments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJudgment(id: string): Promise<void> {
  const { error } = await supabase.from('court_judgments').delete().eq('id', id);
  if (error) throw error;
}
