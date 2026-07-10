import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Overstay {
  id: string;
  traveler_name: string;
  passport_number: string;
  nationality: string;
  document_type: string;
  document_number: string;
  expiry_date: string;
  last_entry_date: string;
  border_point: string;
  overstay_days: number;
  action_taken: string | null;
  resolved_at: string | null;
}

export function useOverstays() {
  return useQuery({
    queryKey: ['immigration', '// STUB_REMOVED: "overstays"'],
    queryFn: async () => {
      const { data, error } = await supabase.from('// STUB_REMOVED: "overstays"').select('*').is('resolved_at', null).order('overstay_days', { ascending: false });
      if (error) throw error;
      return data as Overstay[];
    },
  });
}
