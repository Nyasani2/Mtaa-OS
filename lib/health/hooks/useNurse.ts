
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useNurse(facilityId: string | null) {
  const { user } = useAuthStore();
  const [medications, setMedications] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [// STUB_REMOVED: "patients", setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!facilityId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Get active // STUB_REMOVED: "patients" (admissions)
      const { data: admissionsData } = await supabase
        .from('health_admissions')
        .select('patient_id, patient:patient_id(id, name)')
        .eq('facility_id', facilityId)
        .eq('status', 'active');
      const activePatients = (admissionsData || []).map((a: any) => ({ id: a.patient_id, name: a.patient?.name || 'Unknown' }));
      if (isMounted.current) setPatients(activePatients);

      // Medications
      const { data: medsData } = await supabase
        .from('health_medications')
        .select('*, patient:patient_id(name)')
        .eq('facility_id', facilityId)
        .order('scheduled_time');
      if (isMounted.current) setMedications((medsData || []).map((m: any) => ({ ...m, patient_name: m.patient?.name })));

      // Vitals
      const { data: vitalsData } = await supabase
        .from('// STUB_REMOVED: "health_vitals"')
        .select('*, patient:patient_id(name)')
        .eq('facility_id', facilityId)
        .order('recorded_at', { ascending: false });
      if (isMounted.current) setVitals((vitalsData || []).map((v: any) => ({ ...v, patient_name: v.patient?.name })));

      // Handovers
      const { data: handoverData } = await supabase
        .from('health_staff_assignments')
        .select('*, patient:patient_id(name), created_by:created_by(name)')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });
      if (isMounted.current) setHandovers((handoverData || []).map((h: any) => ({ ...h, patient_name: h.patient?.name, created_by_name: h.created_by?.name })));
    } catch (err: any) {
      if (isMounted.current) setError(err.message || 'Failed to load nurse data');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [facilityId, user?.id]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [fetchData]);

  const administerMed = useCallback(async (medId: string, patientId: string) => {
    const { error } = await supabase.from('health_dispensing_logs').insert({
      medication_id: medId, patient_id: patientId, administered_by: user?.id,
      facility_id: facilityId, administered_at: new Date().toISOString(), status: 'given'
    });
    if (error) throw error;
    await fetchData();
  }, [facilityId, user?.id, fetchData]);

  const addMedication = useCallback(async (medData: any) => {
    const { error } = await supabase.from('health_medications').insert(medData);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const recordVitals = useCallback(async (vitalData: any) => {
    const { error } = await supabase.from('// STUB_REMOVED: "health_vitals"').insert({
      ...vitalData, recorded_by: user?.id, recorded_at: new Date().toISOString()
    });
    if (error) throw error;
    await fetchData();
  }, [user?.id, fetchData]);

  const createHandover = useCallback(async (handoverData: any) => {
    const { error } = await supabase.from('health_staff_assignments').insert({
      ...handoverData, created_by: user?.id, created_at: new Date().toISOString(), acknowledged: false
    });
    if (error) throw error;
    await fetchData();
  }, [user?.id, fetchData]);

  const acknowledgeHandover = useCallback(async (handoverId: string) => {
    const { error } = await supabase.from('health_staff_assignments').update({
      acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString()
    }).eq('id', handoverId);
    if (error) throw error;
    await fetchData();
  }, [user?.id, fetchData]);

  return {
    medications, vitals, handovers, // STUB_REMOVED: "patients", loading, error, refresh: fetchData,
    administerMed, addMedication, recordVitals, createHandover, acknowledgeHandover
  };
}
