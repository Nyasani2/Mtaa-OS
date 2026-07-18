import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function usePatientConsent() {
  const { supabase } = useSupabase();
  const { user } = useAuthStore();
  const [consents, setConsents] = useState<any[]>([]);
  const [activeGrants, setActiveGrants] = useState<any[]>([]);
  const [accessLog, setAccessLog] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: patient } = await supabase.from('health_patients').select('id, qr_access_enabled, biometric_consent_enabled, emergency_access_granted').eq('user_id', user.id).single();
    if (patient) {
      setSettings(patient);
      const { data: grants } = await supabase.from('health_consent_logs').select('*').eq('patient_id', patient.id).eq('is_active', true).order('created_at', { ascending: false });
      setActiveGrants(grants || []);
      const { data: logs } = await supabase.from('health_access_audit').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(50);
      setAccessLog(logs || []);
    }
  }, [user, supabase]);

  const grantConsent = useCallback(async (payload: any) => {
    if (!user) return;
    const { data: patient } = await supabase.from('health_patients').select('id').eq('user_id', user.id).single();
    if (!patient) return;
    const { data, error } = await supabase.rpc('grant_health_consent', {
      p_patient_id: patient.id, p_granted_to: payload.granted_to, p_granted_to_type: payload.granted_to_type,
      p_consent_type: payload.consent_type, p_resource_type: payload.resource_type,
      p_duration_minutes: payload.duration_minutes || 60, p_method: payload.method || 'qr_scan'
    });
    if (!error) fetchData();
    return data;
  }, [user, supabase, fetchData]);

  const revokeConsent = useCallback(async (consentId: string) => {
    const { error } = await supabase.from('health_consent_logs').update({ is_active: false, revoked_at: new Date().toISOString(), revoked_by: user?.id }).eq('id', consentId);
    if (!error) fetchData();
  }, [user, supabase, fetchData]);

  const updateSettings = useCallback(async (key: string, value: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('health_patients').update({ [key]: value }).eq('user_id', user.id);
    if (!error) fetchData();
  }, [user, supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { consents, activeGrants, accessLog, settings, grantConsent, revokeConsent, updateSettings };
}
