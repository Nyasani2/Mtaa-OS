import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface TaxWithholding {
  id: string;
  transactionId: string;
  transactionType: 'mtaxi_ride' | 'mtruck_delivery' | 'boda_ride' | 'shop_sale' | 'restaurant_order' | 'creator_earning';
  taxpayerId: string;
  amount: number;
  currency: string;
  jurisdictionCode: string;
  taxRate: number;
  baseAmount: number;
  status: 'pending' | 'remitted' | 'refunded';
  remittedAt?: string;
  authorityWalletId: string;
  createdAt: string;
}

export function useTaxWithholding(jurisdictionCode?: string) {
  const { user } = useAuthStore();
  const [withholdings, setWithholdings] = useState<TaxWithholding[]>([]);
  const [totalWithheld, setTotalWithheld] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithholdings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('tax_withholdings')
        .select('*')
        .eq('taxpayer_id', user.id)
        .order('created_at', { ascending: false });

      if (jurisdictionCode) {
        query = query.eq('jurisdiction_code', jurisdictionCode);
      }

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      const mapped: TaxWithholding[] = (data || []).map((w: any) => ({
        id: w.id,
        transactionId: w.transaction_id,
        transactionType: w.transaction_type,
        taxpayerId: w.taxpayer_id,
        amount: w.amount,
        currency: w.currency,
        jurisdictionCode: w.jurisdiction_code,
        taxRate: w.tax_rate,
        baseAmount: w.base_amount,
        status: w.status,
        remittedAt: w.remitted_at,
        authorityWalletId: w.authority_wallet_id,
        createdAt: w.created_at,
      }));

      setWithholdings(mapped);
      setTotalWithheld(mapped.reduce((sum, w) => sum + (w.status === 'pending' ? w.amount : 0), 0));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load withholdings'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, jurisdictionCode]);

  useEffect(() => {
    fetchWithholdings();
  }, [fetchWithholdings]);

  return { withholdings, totalWithheld, loading, error, refresh: fetchWithholdings };
}
