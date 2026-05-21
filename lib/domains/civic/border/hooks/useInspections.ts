import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Inspection {
  id: string;
  inspection_id: string;
  inspection_type: string;
  result: 'cleared' | 'flagged' | 'pending';
  officer_name: string;
  container_id: string | null;
  findings: string | null;
  created_at: string;
}

export function useInspections() {
  return useQuery({
    queryKey: ['border', 'inspections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('border_inspections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Inspection[];
    },
  });
}
