import { useState, useEffect, useCallback } from 'react';
import { getAlumni, getAlumniStats, registerAlumni, type Alumni } from '../services/alumniService';

export function useAlumni(institutionId?: string) {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlumni = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        getAlumni(institutionId),
        getAlumniStats(institutionId),
      ]);
      if (aRes.error) throw new Error(aRes.error);
      if (sRes.error) throw new Error(sRes.error);
      setAlumni(aRes.data || []);
      setStats(sRes.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const addAlumni = async (payload: Partial<Alumni>) => {
    const res = await registerAlumni(payload);
    if (res.error) throw new Error(res.error);
    await fetchAlumni();
    return res.data;
  };

  return { alumni, stats, loading, error, refresh: fetchAlumni, addAlumni };
}
