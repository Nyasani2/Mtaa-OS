import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomsAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  created_at: string;
  resolved_at: string | null;
}

export function useCustomsAlerts() {
  return useQuery({
    queryKey: ['customs', 'alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customs_alerts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomsAlert[];
    },
  });
}
