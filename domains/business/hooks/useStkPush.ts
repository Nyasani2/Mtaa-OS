import { useState, useCallback } from 'react';
import { darajaService, StkPushResult, PaymentStatus } from '../services/darajaService';

export interface UseStkPushReturn {
  loading: boolean; error: string | null; result: StkPushResult | null;
  initiateTill: (tillNumber: string, customerPhone: string, amount: number) => Promise<void>;
  initiatePaybill: (paybillNumber: string, accountNumber: string, customerPhone: string, amount: number) => Promise<void>;
  checkStatus: (paymentId: string, type: 'till' | 'paybill') => Promise<PaymentStatus>;
}

export function useStkPush(): UseStkPushReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StkPushResult | null>(null);

  const initiateTill = useCallback(async (tillNumber: string, customerPhone: string, amount: number) => {
    setLoading(true); setError(null);
    try {
      const res = await darajaService.initiateTillPayment(tillNumber, customerPhone, amount);
      setResult(res);
      if (!res.success) setError(res.error || 'Payment initiation failed');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const initiatePaybill = useCallback(async (paybillNumber: string, accountNumber: string, customerPhone: string, amount: number) => {
    setLoading(true); setError(null);
    try {
      const res = await darajaService.initiatePaybillPayment(paybillNumber, accountNumber, customerPhone, amount);
      setResult(res);
      if (!res.success) setError(res.error || 'Payment initiation failed');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const checkStatus = useCallback(async (paymentId: string, type: 'till' | 'paybill') => {
    return await darajaService.checkPaymentStatus(paymentId, type);
  }, []);

  return { loading, error, result, initiateTill, initiatePaybill, checkStatus };
}
