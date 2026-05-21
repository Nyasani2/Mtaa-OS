import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Container {
  id: string;
  container_id: string;
  container_type: string;
  status: 'in_transit' | 'at_border' | 'cleared' | 'held';
  current_location: string;
  manifest_number: string;
  events: { description: string; timestamp: string }[];
}

export function useContainers() {
  return useQuery({
    queryKey: ['border', 'containers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('containers')
        .select('*, container_events(description, timestamp)')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Container[];
    },
  });
}
