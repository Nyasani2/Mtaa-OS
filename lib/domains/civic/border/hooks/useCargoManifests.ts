import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CargoManifest {
  id: string;
  manifest_number: string;
  shipper_name: string;
  status: 'pending' | 'cleared' | 'flagged' | 'inspection_required';
  item_count: number;
  total_value: number;
  currency: string;
  created_at: string;
}

export function useCargoManifests() {
  return useQuery({
    queryKey: ['border', 'manifests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cargo_manifests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CargoManifest[];
    },
  });
}
