import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { cashierService } from '@/lib/health/services/cashier.service';

// ─── Insurance Claims Hook ───
export function useCashierInsurance() {
  const { user } = useAuthStore();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    const data = await cashierService.getAllClaims();
    setClaims(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const approveClaim = async (claimId: string) => {
    await cashierService.approveClaim(claimId, user?.id);
  };

  const rejectClaim = async (claimId: string, reason: string) => {
    await cashierService.rejectClaim(claimId, reason, user?.id);
  };

  const refresh = async () => {
    await fetchClaims();
  };

  return { claims, loading, approveClaim, rejectClaim, refresh };
}

// ─── Invoices Hook ───
export function useCashierInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const data = await cashierService.getInvoices();
    setInvoices(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const createInvoice = async (data: any) => {
    const result = await cashierService.createInvoice(data);
    return result;
  };

  const refresh = async () => {
    await fetchInvoices();
  };

  return { invoices, loading, createInvoice, refresh };
}

// ─── Payments Hook ───
export function useCashierPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [p, i] = await Promise.all([
      cashierService.getPayments(),
      cashierService.getUnpaidInvoices(),
    ]);
    setPayments(p);
    setInvoices(i);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processPayment = async (data: any) => {
    const result = await cashierService.processPayment(data);
    return result;
  };

  const refresh = async () => {
    await fetchData();
  };

  return { payments, invoices, loading, processPayment, refresh };
}
