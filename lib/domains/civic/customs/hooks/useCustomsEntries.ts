import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomsEntry {
  id: string;
  entry_number: string;
  entry_type: 'import' | 'export' | 'transit';
  declarant_name: string;
  consignee: string;
  cargo_value: number;
  currency: string;
  duty_payable: number;
  port_name: string;
  status: 'cleared' | 'pending' | 'under_review' | 'rejected' | 'inspection_required';
  lodged_at: string;
  cleared_at: string | null;
}

export function useCustomsEntries() {
  return useQuery({
    queryKey: ['customs', 'entries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customs_entries').select('*').order('lodged_at', { ascending: false });
      if (error) throw error;
      return data as CustomsEntry[];
    },
  });
}
