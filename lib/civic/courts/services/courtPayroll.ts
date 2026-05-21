import { supabase } from '@/lib/supabase';
import { CourtPayroll } from '@/types/courts';

export async function getPayroll(filters?: {
  court_house_id?: string;
  staff_id?: string;
  status?: string;
}): Promise<CourtPayroll[]> {
  let q = supabase.from('court_payroll').select('*');
  if (filters?.court_house_id) q = q.eq('court_house_id', filters.court_house_id);
  if (filters?.staff_id) q = q.eq('staff_id', filters.staff_id);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q.order('pay_period_start', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPayrollEntry(entry: Partial<CourtPayroll>): Promise<CourtPayroll> {
  const net = (entry.base_amount || 0) + (entry.allowances || 0) - (entry.deductions || 0);
  const insert = { ...entry, net_amount: net };
  const { data, error } = await supabase.from('court_payroll').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function approvePayroll(id: string): Promise<CourtPayroll> {
  const { data, error } = await supabase.from('court_payroll').update({ status: 'approved' }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function markPaid(id: string, transactionRef: string): Promise<CourtPayroll> {
  const { data, error } = await supabase
    .from('court_payroll')
    .update({ status: 'paid', paid_date: new Date().toISOString(), transaction_ref: transactionRef })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
