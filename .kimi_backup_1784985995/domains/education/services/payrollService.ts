
import { supabase } from '@/lib/supabase';
import { PayrollRecord } from '../types/education.types';

export async function getPayroll(teacherId: string, month?: string) {
  let query = supabase
    .from('education_payroll')
    .select('*')
    .eq('teacher_id', teacherId);
  if (month) query = query.eq('month', month);
  const { data, error } = await query.order('month', { ascending: false });
  if (error) throw error;
  return data as PayrollRecord[];
}

export async function processPayroll(payroll: Partial<PayrollRecord>) {
  const { data, error } = await supabase
    .from('education_payroll')
    .insert(payroll)
    .select()
    .single();
  if (error) throw error;
  return data;
}
