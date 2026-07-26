import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ExciseLicense {
  id: string;
  license_number: string;
  holder_name: string;
  license_type: string;
  product_category: string;
  business_location: string;
  annual_volume: string;
  excise_duty_paid: number;
  status: 'active' | 'expired' | 'pending' | 'revoked' | 'suspended';
  issued_at: string;
  expires_at: string;
}

export function useExciseLicenses() {
  return useQuery({
    queryKey: ['customs', 'excise'],
    queryFn: async () => {
      const { data, error } = await supabase.from('excise_licenses').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return data as ExciseLicense[];
    },
  });
}
