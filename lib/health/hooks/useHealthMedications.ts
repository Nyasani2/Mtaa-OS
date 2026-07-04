import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedAt: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
}

export function useHealthMedications(patientId?: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_medications')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false });
      if (error) throw error;
      setMedications((data || []).map(mapDb));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (med: Omit<Medication, 'id'>) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('health_medications').insert(mapToDb(med));
      if (error) throw error;
      await load();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: Medication['status']) => {
    const { error } = await supabase.from('health_medications').update({ status }).eq('id', id);
    if (error) return false;
    await load();
    return true;
  }, [load]);

  return { medications, loading, error, refresh: load, add, updateStatus };
}

function mapDb(row: any): Medication {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    genericName: row.generic_name,
    dosage: row.dosage,
    frequency: row.frequency,
    prescribedBy: row.prescribed_by,
    prescribedAt: row.prescribed_at,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    notes: row.notes,
  };
}

function mapToDb(m: Partial<Medication>): any {
  return {
    id: m.id,
    patient_id: m.patientId,
    name: m.name,
    generic_name: m.genericName,
    dosage: m.dosage,
    frequency: m.frequency,
    prescribed_by: m.prescribedBy,
    prescribed_at: m.prescribedAt,
    start_date: m.startDate,
    end_date: m.endDate,
    status: m.status,
    notes: m.notes,
  };
}
