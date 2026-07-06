import { supabase } from '@/lib/supabase';

export const cashierService = {
  // ─── Insurance Claims ───
  async getAllClaims() {
    const { data, error } = await supabase
      .from('health_insurance_claims')
      .select(`
        id, claim_type, amount, description, status, created_at, diagnosis,
        patient:patient_id (full_name),
        policy:policy_id (provider, policy_number)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async approveClaim(claimId: string, approverId?: string) {
    const { error } = await supabase
      .from('health_insurance_claims')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approverId,
      })
      .eq('id', claimId)
      .eq('status', 'pending');
    if (error) throw error;
  },

  async rejectClaim(claimId: string, reason: string, approverId?: string) {
    const { error } = await supabase
      .from('health_insurance_claims')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: approverId,
        rejection_reason: reason,
      })
      .eq('id', claimId)
      .eq('status', 'pending');
    if (error) throw error;
  },

  // ─── Invoices ───
  async getInvoices() {
    const { data, error } = await supabase
      .from('health_invoices')
      .select(`
        id, invoice_number, total_amount, status, due_date, created_at,
        patient:patient_id (full_name),
        items:health_invoice_items (*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createInvoice(data: any) {
    const { data: result, error } = await supabase
      .from('health_invoices')
      .insert({
        patient_id: data.patient_id,
        total_amount: data.total_amount,
        status: 'unpaid',
        due_date: data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;

    if (data.items?.length > 0) {
      const items = data.items.map((item: any) => ({
        invoice_id: result.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));
      await supabase.from('health_invoice_items').insert(items);
    }
    return result;
  },

  async getUnpaidInvoices() {
    const { data, error } = await supabase
      .from('health_invoices')
      .select('id, invoice_number, total_amount, patient:patient_id (full_name)')
      .eq('status', 'unpaid')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // ─── Payments ───
  async getPayments() {
    const { data, error } = await supabase
      .from('health_payments')
      .select(`
        id, amount, method, reference, notes, created_at,
        invoice:invoice_id (invoice_number)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async processPayment(data: any) {
    const { data: result, error } = await supabase
      .from('health_payments')
      .insert({
        invoice_id: data.invoice_id,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;

    // Update invoice status if fully paid
    const { data: invoice } = await supabase
      .from('health_invoices')
      .select('total_amount')
      .eq('id', data.invoice_id)
      .single();

    const { data: totalPaid } = await supabase
      .from('health_payments')
      .select('amount')
      .eq('invoice_id', data.invoice_id);

    const paidSum = totalPaid?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

    if (paidSum >= (invoice?.total_amount || 0)) {
      await supabase
        .from('health_invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', data.invoice_id);
    }

    return result;
  },
};
