import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ImmigrationStats {
  active_passports: number;
  visas_issued: number;
  pending_applications: number;
  overstays: number;
}

export function useImmigrationStats() {
  return useQuery({
    queryKey: ['immigration', 'stats'],
    queryFn: async () => {
      const { data: passports, error: pErr } = await supabase.from('passports').select('id').eq('status', 'active');
      if (pErr) throw pErr;
      const { data: visas, error: vErr } = await supabase.from('visas').select('id').eq('status', 'approved');
      if (vErr) throw vErr;
      const { data: pending, error: pdErr } = await supabase.from('visa_applications').select('id').eq('status', 'pending');
      if (pdErr) throw pdErr;
      const { data: overstays, error: oErr } = await supabase.from('overstays').select('id').is('resolved_at', null);
      if (oErr) throw oErr;
      return {
        active_passports: passports?.length || 0,
        visas_issued: visas?.length || 0,
        pending_applications: pending?.length || 0,
        overstays: overstays?.length || 0,
      } as ImmigrationStats;
    },
  });
}
