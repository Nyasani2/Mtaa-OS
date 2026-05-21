import { supabase } from '@/lib/supabase';
import { CourtFine } from '@/types/courts';

export async function getFines(filters?: { case_id?: string; payment_status?: string }): Promise<CourtFine[]> {
  let q = supabase.from('court_fines').select('*');
  if (filters?.case_id) q = q.eq('case_id', filters.case_id);
  if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createFine(fine: Partial<CourtFine>): Promise<CourtFine> {
  const { data, error } = await supabase.from('court_fines').insert(fine).select().single();
  if (error) throw error;
  return data;
}

export async function updateFine(id: string, updates: Partial<CourtFine>): Promise<CourtFine> {
  const { data, error } = await supabase.from('court_fines').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function recordPayment(id: string, amount: number, receiptNumber: string): Promise<CourtFine> {
  const { data, error } = await supabase
    .from('court_fines')
    .update({
      amount_paid: amount,
      payment_status: 'paid',
      paid_date: new Date().toISOString(),
      receipt_number: receiptNumber,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
