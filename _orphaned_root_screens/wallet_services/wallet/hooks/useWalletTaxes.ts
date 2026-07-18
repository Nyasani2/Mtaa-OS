// app/(os)/wallet/hooks/useWalletTaxes.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TaxReport {
  id: string;
  year: number;
  total_income: number;
  total_deductible: number;
  tax_liability: number;
  status: 'draft' | 'filed' | 'paid';
  created_at: string;
}

export function useWalletTaxes() {
  const [taxes, setTaxes] = useState<TaxReport[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadTaxReport = useCallback(async (year: number) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('tax_reports')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setTaxes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadTaxReport(new Date().getFullYear());
  }, [loadTaxReport]);

  const exportTaxCSV = useCallback(() => {
    // Placeholder — implement CSV export
    return taxes;
  }, [taxes]);

  return { taxes, transactions, loading, error, loadTaxReport, refresh, exportTaxCSV };
}

export default useWalletTaxes;
