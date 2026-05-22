import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomsStats {
  entries_today: number;
  duty_collected: number;
  containers_cleared: number;
  flagged_items: number;
}

export function useCustomsStats() {
  return useQuery({
    queryKey: ['customs', 'stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: entries, error: eErr } = await supabase.from('customs_entries').select('id').gte('lodged_at', today);
      if (eErr) throw eErr;
      const { data: duty, error: dErr } = await supabase.from('customs_entries').select('duty_payable').gte('lodged_at', today).eq('status', 'cleared');
      if (dErr) throw dErr;
      const { data: containers, error: cErr } = await supabase.from('customs_entries').select('id').gte('lodged_at', today).eq('status', 'cleared');
      if (cErr) throw cErr;
      const { data: flagged, error: fErr } = await supabase.from('customs_entries').select('id').eq('status', 'inspection_required');
      if (fErr) throw fErr;
      const totalDuty = duty?.reduce((sum: number, d: any) => sum + (d.duty_payable || 0), 0) || 0;
      return {
        entries_today: entries?.length || 0,
        duty_collected: totalDuty,
        containers_cleared: containers?.length || 0,
        flagged_items: flagged?.length || 0,
      } as CustomsStats;
    },
  });
}
