import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BorderAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  border_post_id: string | null;
  created_at: string;
  resolved_at: string | null;
  border_post_name?: string;
}

export function useBorderAlerts() {
  return useQuery({
    queryKey: ['border', 'alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('border_alerts')
        .select('*, border_posts(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BorderAlert[];
    },
  });
}
