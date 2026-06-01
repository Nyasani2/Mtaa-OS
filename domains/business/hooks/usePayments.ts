import { useState, useEffect, useCallback } from 'react';
import { businessService, TillPayment, PaybillPayment } from '../services/businessService';

export function usePayments(businessId?: string) {
  const [payments, setPayments] = useState<(TillPayment | PaybillPayment)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [till, paybill] = await Promise.all([
        businessService.getTillPayments(businessId),
        businessService.getPaybillPayments(businessId),
      ]);
      setPayments([...till, ...paybill]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return { payments, loading, error, refresh: loadPayments };
}
