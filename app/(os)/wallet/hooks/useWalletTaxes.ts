import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface TaxReport {
  id: string; user_id: string; year: number;
  tax_liability: number; total_income: number;
  total_deductible: number; status: string; created_at: string;
}

export const useWalletTaxes = () => {
  const { user } = useAuthStore();
  const [taxes, setTaxes] = useState<TaxReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('wallet_tax_reports').select('*')
        .eq('user_id', user.id).order('year', { ascending: false });
      if (dbError) throw dbError;
      setTaxes(data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [user]);

  const exportTaxCSV = () => null;
  return { taxes, loading, error, refresh, exportTaxCSV };
};
export default useWalletTaxes;
