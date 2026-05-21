import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TransitGuarantee {
  id: string;
  guarantee_ref: string;
  corridor_name: string;
  operator_name: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  guarantee_value: number;
  currency: string;
  origin_border: string;
  destination_border: string;
  expiry_date: string;
}

export function useTransitGuarantees() {
  return useQuery({
    queryKey: ['border', 'guarantees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transit_guarantees')
        .select('*')
        .order('expiry_date', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as TransitGuarantee[];
    },
  });
}
