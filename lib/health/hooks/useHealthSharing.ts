import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ShareGrant {
  id: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  scope: string[];
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
}

export function useHealthSharing(patientId?: string) {
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_sharing_grants')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGrants((data || []).map(mapDb));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const grant = useCallback(async (hospitalId: string, hospitalName: string, scope: string[], expiryHours: number = 24) => {
    if (!patientId) return null;
    setLoading(true);
    try {
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('health_sharing_grants')
        .insert({
          patient_id: patientId,
          hospital_id: hospitalId,
          hospital_name: hospitalName,
          scope,
          expires_at: expiresAt,
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      await load();
      return mapDb(data);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId, load]);

  const revoke = useCallback(async (grantId: string) => {
    const { error } = await supabase.from('health_sharing_grants').update({ status: 'revoked' }).eq('id', grantId);
    if (error) return false;
    await load();
    return true;
  }, [load]);

  return { grants, loading, error, refresh: load, grant, revoke };
}

function mapDb(row: any): ShareGrant {
  return {
    id: row.id,
    patientId: row.patient_id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    scope: row.scope,
    expiresAt: row.expires_at,
    status: row.status,
    createdAt: row.created_at,
  };
}
