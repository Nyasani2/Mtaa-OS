import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useHospitalAccounting(facilityId: string | null, period: string) {
  const [stats, setStats] = useState<any>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!facilityId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: payments } = await supabase.from('health_payments').select('*').eq('facility_id', facilityId).eq('status', 'completed').order('created_at', { ascending: false }).limit(50);
      const { data: invoices } = await supabase.from('health_invoices').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }).limit(100);
      const totalRevenue = payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const cashRevenue = payments?.filter((p: any) => p.payment_method === 'cash').reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const cardRevenue = payments?.filter((p: any) => p.payment_method === 'card').reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const walletRevenue = payments?.filter((p: any) => p.payment_method === 'wallet').reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const mpesaRevenue = payments?.filter((p: any) => p.payment_method === 'mpesa').reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const insuranceRevenue = payments?.filter((p: any) => p.payment_method === 'insurance').reduce((s, p) => s + (p.amount || 0), 0) || 0;
      const outstanding = invoices?.filter((i: any) => i.status === 'unpaid' || i.status === 'partial').reduce((s, i) => s + (i.balance_due || 0), 0) || 0;
      const outstandingCount = invoices?.filter((i: any) => i.status === 'unpaid' || i.status === 'partial').length || 0;
      const uniquePatients = new Set(payments?.map((p: any) => p.patient_id)).size;
      setStats({ totalRevenue, cashRevenue, cardRevenue, walletRevenue, mpesaRevenue, insuranceRevenue, outstanding, outstandingCount, uniquePatients, newPatients: 0, revenueGrowth: 0, mtaaCommission: totalRevenue * 0.025, commissionRate: 2.5 });
      setRevenueBreakdown([
        { name: 'Consultation', amount: totalRevenue * 0.35, percentage: 35, color: '#3B82F6' },
        { name: 'Lab Tests', amount: totalRevenue * 0.20, percentage: 20, color: '#10B981' },
        { name: 'Pharmacy', amount: totalRevenue * 0.18, percentage: 18, color: '#F59E0B' },
        { name: 'Imaging', amount: totalRevenue * 0.12, percentage: 12, color: '#8B5CF6' },
        { name: 'Procedures', amount: totalRevenue * 0.10, percentage: 10, color: '#EF4444' },
        { name: 'Other', amount: totalRevenue * 0.05, percentage: 5, color: '#6B7280' },
      ]);
      setRecentTransactions(payments?.slice(0, 10) || []);
    } finally { setLoading(false); }
  }, [facilityId, period, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { stats, revenueBreakdown, recentTransactions, loading, refresh: fetchData };
}
