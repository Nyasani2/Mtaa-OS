// lib/health/hooks/useHealthPatient.ts
import { useState, useEffect, useCallback } from 'react';
import { PatientService } from '../services/patient.service';
import { EHRService } from '../services/ehr.service';
import { HealthPatient, HealthRecord, HealthAppointment, HealthLabTest } from '../types';

export function useHealthPatient(userId?: string) {
  const [patient, setPatient] = useState<HealthPatient | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [labTests, setLabTests] = useState<HealthLabTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPatient = useCallback(async (id: string) => {
    try {
      setIsLoading(true); setError(null);
      const patientData = await PatientService.getPatientByUserId(id);
      if (patientData) {
        setPatient(patientData);
        const [recordsData, appointmentsData, labTestsData] = await Promise.all([
          PatientService.getPatientRecords(patientData.id),
          PatientService.getPatientAppointments(patientData.id),
          PatientService.getPatientLabTests(patientData.id),
        ]);
        setRecords(recordsData);
        setAppointments(appointmentsData);
        setLabTests(labTestsData);
      }
    } catch (err) { setError(err as Error); }
    finally { setIsLoading(false); }
  }, []);

  const refresh = useCallback(() => { if (userId) loadPatient(userId); }, [userId, loadPatient]);

  useEffect(() => { if (userId) loadPatient(userId); }, [userId, loadPatient]);

  return { patient, records, appointments, labTests, isLoading, error, refresh };
}
