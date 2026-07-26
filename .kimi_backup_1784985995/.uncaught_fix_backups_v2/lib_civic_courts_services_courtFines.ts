import { supabase } from '@/lib/supabase';
import { CourtFine } from '../types';

export class CourtFinesService {
  static async getFines(caseId?: string): Promise<CourtFine[]> {
    let query = supabase.from('court_fines').select('*');
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createFine(data: Partial<CourtFine>): Promise<CourtFine> {
    const { data: result, error } = await supabase.from('court_fines').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  static async recordPayment(id: string, amount: number, receiptNumber: string): Promise<void> {
    const { data: fine } = await supabase.from('court_fines').select('*').eq('id', id).single();
    if (!fine) throw new Error('Fine not found');
    const newPaid = (fine.amount_paid || 0) + amount;
    const status = newPaid >= fine.amount ? 'paid' : 'partial';
    const { error } = await supabase.from('court_fines').update({
      amount_paid: newPaid,
      payment_status: status,
      receipt_number: receiptNumber
    }).eq('id', id);
    if (error) throw error;
  }
}
