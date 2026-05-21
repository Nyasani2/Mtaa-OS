import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  border_post_name: string;
  is_clocked_in: boolean;
  shift_start: string;
  shift_end: string;
  last_clock_time: string | null;
}

export function useStaffOperations() {
  return useQuery({
    queryKey: ['border', 'staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('border_staff')
        .select('*, border_posts(name)')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as StaffMember[];
    },
  });
}
