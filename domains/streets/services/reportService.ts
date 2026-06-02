// lib/streets/services/reportService.ts
// MTAA Streets — Report Service (wired to streets_reports table)

import { supabase } from '@/lib/supabase';
import { StreetReport } from '../types';

export async function submitReport(
  reporterId: string,
  targetId: string,
  targetType: StreetReport['target_type'],
  reason: string,
  details?: string
): Promise<void> {
  const { error } = await supabase
    .from('streets_reports')
    .insert({
      reporter_id: reporterId,
      target_id: targetId,
      target_type: targetType,
      reason,
      details: details || null,
      status: 'pending',
    });
  if (error) throw error;
}

export async function fetchReports(userId: string): Promise<StreetReport[]> {
  const { data, error } = await supabase
    .from('streets_reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StreetReport[];
}

export async function fetchReportStatus(reportId: string): Promise<StreetReport | null> {
  const { data, error } = await supabase
    .from('streets_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) return null;
  return data as StreetReport;
}
