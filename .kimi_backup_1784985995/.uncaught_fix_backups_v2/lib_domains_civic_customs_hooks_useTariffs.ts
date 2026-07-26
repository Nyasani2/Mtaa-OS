import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Tariff {
  id: string;
  hs_code: string;
  description: string;
  duty_rate: number;
  import_duty: number;
  vat_rate: number;
  excise_rate: number;
  idf_rate: number;
  category: string;
}

export function useTariffs() {
  return useQuery({
    queryKey: ['customs', 'tariffs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tariff_schedule').select('*').order('hs_code');
      if (error) throw error;
      return data as Tariff[];
    },
  });
}
