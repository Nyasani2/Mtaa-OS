import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Invoice {
  id: string;
  patient_id: string;
  patient_name: string;
  amount: number;
  status: string;
  items: any[];
  created_at: string;
  paid_at?: string;
}

export function useCashier(facilityId: string | null) {
  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['cashier-invoices', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data, error } = await supabase
        .from('health_billing')
        .select(`
          id, patient_id, amount, status, items, created_at, paid_at,
          patient:patient_id(name)
        `)
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((inv: any) => ({
        id: inv.id,
        patient_id: inv.patient_id,
        patient_name: inv.patient?.name || 'Unknown',
        amount: inv.amount,
        status: inv.status,
        items: inv.items || [],
        created_at: inv.created_at,
        paid_at: inv.paid_at,
      })) as Invoice[];
    },
    enabled: !!facilityId,
  });

  const createInvoice = async (payload: { patient_id: string; items: any[]; amount: number }) => {
    if (!facilityId) throw new Error('No facility selected');
    const { data, error } = await supabase
      .from('health_billing')
      .insert({ ...payload, facility_id: facilityId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const markPaid = async (invoiceId: string) => {
    const { error } = await supabase
      .from('health_billing')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId);
    if (error) throw error;
  };

  return { invoices: invoices || [], isLoading, error, refetch, createInvoice, markPaid };
}
