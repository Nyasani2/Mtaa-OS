import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { insuranceService } from '@/lib/health/services/insurance.service';

// ─── Claims Hook ───
export function useInsuranceClaims() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [p, pol] = await Promise.all([
      insuranceService.getPatients(),
      insuranceService.getPolicies(),
    ]);
    setPatients(p);
    setPolicies(pol);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createClaim = async (data: any) => {
    setIsCreating(true);
    const result = await insuranceService.createClaim(data);
    setIsCreating(false);
    return result;
  };

  return { patients, policies, loading, isCreating, createClaim, refetch: fetchData };
}

// ─── Remaining Claims Hook ───
export function useInsuranceRemaining() {
  const { user } = useAuthStore();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await insuranceService.getClaims(user.id);
    setClaims(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const refresh = async () => {
    await fetchClaims();
  };

  return { claims, loading, refresh };
}
