import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RiskScore {
  id: string;
  entity_name: string;
  entity_type: string;
  manifest_number: string;
  risk_score: number;
  factors: string[];
  assessed_at: string;
}

export function useRiskScores() {
  return useQuery({
    queryKey: ['border', 'risk-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_scores')
        .select('*')
        .order('risk_score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as RiskScore[];
    },
  });
}
