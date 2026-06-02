import { useState, useEffect, useCallback } from 'react';
import { businessService, Business } from '../services/businessService';
import { channel } from '@/lib/kernel/communication/Channel';

export interface UseBusinessReturn {
  business: Business | null; loading: boolean; error: string | null;
  refresh: () => Promise<void>;
  updateBusiness: (updates: Partial<Business>) => Promise<void>;
  uploadDocument: (file: File, docType: string) => Promise<string>;
}

export function useBusiness(): UseBusinessReturn {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await businessService.getMyBusiness(); setBusiness(data); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const updateBusiness = useCallback(async (updates: Partial<Business>) => {
    if (!business) throw new Error('No business loaded');
    const updated = await businessService.updateBusiness(business.id, updates);
    setBusiness(updated);
  }, [business]);

  const uploadDocument = useCallback(async (file: File, docType: string) => {
    if (!business) throw new Error('No business loaded');
    return await businessService.uploadDocument(business.id, file, docType);
  }, [business]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const unsub = channel.subscribe('business', 'business_updated', (msg) => {
      if (msg.payload.businessId === business?.id) refresh();
    }, { source: 'useBusiness-hook' });
    return () => unsub();
  }, [business?.id, refresh]);

  return { business, loading, error, refresh, updateBusiness, uploadDocument };
}
