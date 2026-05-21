import { supabase } from '@/lib/supabase';
import { PrisonPayroll } from '@/types/prisons';

export async function getPayroll(filters?: {
  facility_id?: string;
  staff_id?: string;
  status?: string;
}): Promise<PrisonPayroll[]> {
  let q = supabase.from('prison_payroll').select('*');
  if (filters?.facility_id) q = q.eq('facility_id', filters.facility_id);
  if (filters?.staff_id) q = q.eq('staff_id', filters.staff_id);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q.order('pay_period_start', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPayrollEntry(entry: Partial<PrisonPayroll>): Promise<PrisonPayroll> {
  const net = (entry.base_amount || 0) + (entry.hazard_allowance || 0) + (entry.overtime || 0) - (entry.deductions || 0);
  const insert = { ...entry, net_amount: net };
  const { data, error } = await supabase.from('prison_payroll').insert(insert).select().single();
  if (error) throw error;
  return data;
}

export async function approvePayroll(id: string): Promise<PrisonPayroll> {
  const { data, error } = await supabase.from('prison_payroll').update({ status: 'approved' }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function markPaid(id: string, transactionRef: string): Promise<PrisonPayroll> {
  const { data, error } = await supabase
    .from('prison_payroll')
    .update({ status: 'paid', paid_date: new Date().toISOString(), transaction_ref: transactionRef })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
