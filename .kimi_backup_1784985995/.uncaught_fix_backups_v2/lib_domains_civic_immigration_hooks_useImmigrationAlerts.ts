import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ImmigrationAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  created_at: string;
  resolved_at: string | null;
}

export function useImmigrationAlerts() {
  return useQuery({
    queryKey: ['immigration', 'alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('immigration_alerts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as ImmigrationAlert[];
    },
  });
}
