/**
 * MTAA OS V10 — useTreasury Hook
 * Dashboard: revenue + expenditure + budget overview
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchTreasuryRevenue,
  fetchTreasuryExpenditure,
  fetchTreasuryBudgets,
  fetchTreasuryCategories,
  TreasuryRevenue,
  TreasuryExpenditure,
  TreasuryBudget,
} from '@/lib/services/treasury-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useTreasury() {
  const [revenue, setRevenue] = useState<TreasuryRevenue[]>([]);
  const [expenditure, setExpenditure] = useState<TreasuryExpenditure[]>([]);
  const [budgets, setBudgets] = useState<TreasuryBudget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [r, e, b, c] = await Promise.all([
        fetchTreasuryRevenue(),
        fetchTreasuryExpenditure(),
        fetchTreasuryBudgets(),
        fetchTreasuryCategories(),
      ]);
      setRevenue(r);
      setExpenditure(e);
      setBudgets(b);
      setCategories(c);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = revenue.filter((r) => r.status === 'verified').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenditure = expenditure.filter((e) => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalRevenue - totalExpenditure;

  return {
    revenue, expenditure, budgets, categories,
    isLoading, error, refresh: load,
    totalRevenue, totalExpenditure, balance,
  };
}
