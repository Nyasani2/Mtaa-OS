import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BorderPost {
  id: string;
  name: string;
  location: string;
  post_type: string;
  is_active: boolean;
  officers_on_duty: number;
  crossings_today: number;
  pending_inspections: number;
}

export function useBorderPosts() {
  return useQuery({
    queryKey: ['border', 'posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('border_posts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as BorderPost[];
    },
  });
}
