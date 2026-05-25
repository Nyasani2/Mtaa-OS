// domains/business/hooks/useBusiness.ts
import { useState, useEffect, useCallback } from 'react';
import { businessService, Business } from '../services/businessService';
import { useIdentity } from '@/lib/auth/identity';

export function useBusiness() {
  const { user } = useIdentity();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusiness = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await businessService.getBusinessByOwner(user.id);
      setBusiness(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  return { business, loading, error, refresh: loadBusiness };
}
