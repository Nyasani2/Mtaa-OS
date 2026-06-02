import { useState, useEffect, useCallback } from 'react';
import { businessService, TillPayment, PaybillPayment } from '../services/businessService';
import { channel } from '@/lib/kernel/communication/Channel';

export interface PaymentStats { totalTill: number; totalPaybill: number; todayTill: number; todayPaybill: number; pendingSettlement: number; }

export interface UsePaymentsReturn {
  tillPayments: TillPayment[]; paybillPayments: PaybillPayment[];
  stats: PaymentStats | null; loading: boolean;
  refresh: () => Promise<void>;
  requestSettlement: () => Promise<void>;
}

export function usePayments(businessId: string | undefined): UsePaymentsReturn {
  const [tillPayments, setTillPayments] = useState<TillPayment[]>([]);
  const [paybillPayments, setPaybillPayments] = useState<PaybillPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [till, paybill, statsData] = await Promise.all([
        businessService.getTillPayments(businessId, 50),
        businessService.getPaybillPayments(businessId, 50),
        businessService.getPaymentStats(businessId),
      ]);
      setTillPayments(till); setPaybillPayments(paybill); setStats(statsData);
    } catch (err) { console.error('[usePayments] Error:', err); }
    finally { setLoading(false); }
  }, [businessId]);

  const requestSettlement = useCallback(async () => {
    if (!businessId) return;
    await businessService.requestSettlement(businessId);
  }, [businessId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const unsub = channel.subscribe('business', 'payment_received', (msg) => {
      if (msg.payload.businessId === businessId) refresh();
    }, { source: 'usePayments-hook' });
    return () => unsub();
  }, [businessId, refresh]);

  return { tillPayments, paybillPayments, stats, loading, refresh, requestSettlement };
}
