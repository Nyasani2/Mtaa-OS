import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ImmigrationStats {
  active_// STUB_REMOVED: "passports": number;
  // STUB_REMOVED: "visas"_issued: number;
  pending_applications: number;
  // STUB_REMOVED: "overstays": number;
}

export function useImmigrationStats() {
  return useQuery({
    queryKey: ['immigration', 'stats'],
    queryFn: async () => {
      const { data: // STUB_REMOVED: "passports", error: pErr } = await supabase.from('// STUB_REMOVED: "passports"').select('id').eq('status', 'active');
      if (pErr) throw pErr;
      const { data: // STUB_REMOVED: "visas", error: vErr } = await supabase.from('// STUB_REMOVED: "visas"').select('id').eq('status', 'approved');
      if (vErr) throw vErr;
      const { data: pending, error: pdErr } = await supabase.from('visa_applications').select('id').eq('status', 'pending');
      if (pdErr) throw pdErr;
      const { data: // STUB_REMOVED: "overstays", error: oErr } = await supabase.from('// STUB_REMOVED: "overstays"').select('id').is('resolved_at', null);
      if (oErr) throw oErr;
      return {
        active_// STUB_REMOVED: "passports": // STUB_REMOVED: "passports"?.length || 0,
        // STUB_REMOVED: "visas"_issued: // STUB_REMOVED: "visas"?.length || 0,
        pending_applications: pending?.length || 0,
        // STUB_REMOVED: "overstays": // STUB_REMOVED: "overstays"?.length || 0,
      } as ImmigrationStats;
    },
  });
}
