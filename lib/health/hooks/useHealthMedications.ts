import { useState, useEffect, useCallback } from 'react';
import {
  getActiveMedications,
  getAllMedications,
  addMedication,
  updateMedication,
  logMedication,
  getMedicationLogs,
  getTodaysMedicationSchedule,
  Medication,
  MedicationLog,
} from '../services/health-medication.service';

export function useHealthMedications(patientId: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  async function load() {
    setLoading(true);
    try {
      const [all, active, schedule] = await Promise.all([
        getAllMedications(patientId),
        getActiveMedications(patientId),
        getTodaysMedicationSchedule(patientId),
      ]);
      setMedications(all);
      setActiveMedications(active);
      setTodaysSchedule(schedule);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const add = useCallback(async (med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const m = await addMedication(med);
      if (m) await load();
      return m;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const update = useCallback(async (medId: string, updates: Partial<Medication>) => {
    setLoading(true);
    try {
      const ok = await updateMedication(medId, updates);
      if (ok) await load();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const log = useCallback(async (logEntry: Omit<MedicationLog, 'id'>) => {
    setLoading(true);
    try {
      const l = await logMedication(logEntry);
      if (l) await load();
      return l;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLogs = useCallback(async (medicationId: string) => {
    return getMedicationLogs(medicationId);
  }, []);

  return {
    medications,
    activeMedications,
    todaysSchedule,
    loading,
    error,
    refresh: load,
    add,
    update,
    log,
    getLogs,
  };
}
