import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { JURISDICTIONS } from '../config/jurisdictions';

export interface RegulatoryWalletDashboard {
  totalWithheld: number;
  pendingTaxAmount: number;
  taxRate: number;
  currency: string;
  authorityName: string;
  authorityWalletId: string;
  pendingBusinesses: number;
  pendingTaxPayments: number;
  pendingCompliance: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
  lastFilingDate?: string;
  nextFilingDate?: string;
  totalBusinesses: number;
  totalRevenue: number;
}

export function useRegulatoryWallet(jurisdictionCode: string) {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<RegulatoryWalletDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const jurisdiction = JURISDICTIONS[jurisdictionCode];

  const fetchDashboard = useCallback(async () => {
    if (!user?.id || !jurisdiction) return;

    try {
      setLoading(true);

      // Get total withheld for this user in this jurisdiction
      const { data: withholdings } = await supabase
        .from('tax_withholdings')
        .select('amount, status')
        .eq('taxpayer_id', user.id)
        .eq('jurisdiction_code', jurisdictionCode);

      const totalWithheld = withholdings?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
      const pendingTaxAmount = withholdings
        ?.filter((w) => w.status === 'pending')
        .reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      // Get business count
      const { count: businessCount } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('tax_id', user.id);

      // Get compliance status
      const { data: compliance } = await supabase
        .from('regulatory_compliance')
        .select('*')
        .eq('taxpayer_id', user.id)
        .eq('jurisdiction_code', jurisdictionCode)
        .order('last_assessed', { ascending: false })
        .limit(1)
        .single();

      // Get pending items
      const { count: pendingTax } = await supabase
        .from('regulatory_tax_payments')
        .select('*', { count: 'exact', head: true })
        .eq('taxpayer_id', user.id)
        .eq('jurisdiction_code', jurisdictionCode)
        .eq('status', 'pending');

      const { count: pendingCompliance } = await supabase
        .from('compliance_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', user.id)
        .eq('status', 'pending');

      setDashboard({
        totalWithheld,
        pendingTaxAmount,
        taxRate: jurisdiction.taxRate,
        currency: jurisdiction.currency,
        authorityName: jurisdiction.authorityName,
        authorityWalletId: jurisdiction.authorityWalletId,
        pendingBusinesses: 0,
        pendingTaxPayments: pendingTax || 0,
        pendingCompliance: pendingCompliance || 0,
        complianceStatus: compliance?.status || 'unknown',
        lastFilingDate: compliance?.last_assessed,
        nextFilingDate: compliance?.next_assessment,
        totalBusinesses: businessCount || 0,
        totalRevenue: 0,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load regulatory dashboard'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, jurisdictionCode, jurisdiction]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refresh: fetchDashboard };
}
