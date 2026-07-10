import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Permit {
  id: string;
  permit_number: string;
  holder_name: string;
  permit_type: string;
  nationality: string;
  employer_name: string;
  sector: string;
  status: 'active' | 'expired' | 'pending' | 'revoked' | 'renewal_due';
  issued_at: string;
  expires_at: string;
}

export function usePermits() {
  return useQuery({
    queryKey: ['immigration', 'permits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('work_permits').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data as Permit[];
    },
  });
}
