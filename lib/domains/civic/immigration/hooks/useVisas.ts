import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Visa {
  id: string;
  visa_number: string;
  applicant_name: string;
  passport_number: string;
  visa_type: string;
  nationality: string;
  entries_allowed: number;
  status: 'approved' | 'pending' | 'rejected' | 'expired' | 'revoked';
  issued_at: string;
  expires_at: string;
}

export function useVisas() {
  return useQuery({
    queryKey: ['immigration', 'visas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('visas').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data as Visa[];
    },
  });
}
