import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BorderCrossing {
  id: string;
  crossing_type: 'entry' | 'exit';
  traveler_name: string;
  passport_number: string;
  nationality: string;
  border_point: string;
  travel_mode: string;
  visa_number: string | null;
  crossed_at: string;
  overstay_days: number;
}

export function useBorderCrossings() {
  return useQuery({
    queryKey: ['immigration', 'crossings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('border_crossings').select('*').order('crossed_at', { ascending: false });
      if (error) throw error;
      return data as BorderCrossing[];
    },
  });
}
