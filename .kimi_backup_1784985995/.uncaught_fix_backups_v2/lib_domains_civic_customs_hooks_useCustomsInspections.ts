import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomsInspection {
  id: string;
  inspection_id: string;
  entry_number: string;
  inspection_type: string;
  result: 'cleared' | 'flagged' | 'pending' | 're_inspection';
  officer_name: string;
  inspection_location: string;
  findings: string | null;
  created_at: string;
}

export function useCustomsInspections() {
  return useQuery({
    queryKey: ['customs', 'inspections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customs_inspections').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomsInspection[];
    },
  });
}
