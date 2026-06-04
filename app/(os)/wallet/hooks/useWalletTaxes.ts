import { useState, useCallback } from 'react';

export interface TaxReport {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalFees: number;
  taxableAmount: number;
  currency: string;
  transactionCount: number;
}

export function useWalletTaxes() {
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTaxReport = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    setReports([{
      year,
      totalIncome: 0,
      totalExpenses: 0,
      totalFees: 0,
      taxableAmount: 0,
      currency: 'USD',
      transactionCount: 0,
    }]);
    setLoading(false);
  }, []);

  return { reports, transactions: [], loading, error, loadTaxReport, exportTaxCSV: () => null };
}
