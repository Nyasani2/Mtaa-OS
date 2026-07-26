import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Passport {
  id: string;
  passport_number: string;
  full_name: string;
  national_id: string;
  passport_type: string;
  status: 'active' | 'expired' | 'renewal_due' | 'revoked' | 'lost';
  issued_at: string;
  expires_at: string;
  renewal_due: boolean;
}

export function usePassports() {
  return useQuery({
    queryKey: ['immigration', 'passports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('passports').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data as Passport[];
    },
  });
}
