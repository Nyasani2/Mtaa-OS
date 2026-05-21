// lib/health/hooks/useHospital.ts
import { useState, useEffect, useCallback } from 'react';
import { HospitalService } from '../services/hospital.service';
import { HealthHospital, HealthDepartment, HealthBed, HealthAlert } from '../types';

export function useHospital(hospitalId?: string) {
  const [hospital, setHospital] = useState<HealthHospital | null>(null);
  const [departments, setDepartments] = useState<HealthDepartment[]>([]);
  const [beds, setBeds] = useState<HealthBed[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadHospital = useCallback(async (id: string) => {
    try {
      setIsLoading(true); setError(null);
      const [hospitalData, departmentsData, alertsData, statsData] = await Promise.all([
        HospitalService.getHospitalById(id),
        HospitalService.getHospitalDepartments(id),
        HospitalService.getHospitalAlerts(id),
        HospitalService.getHospitalStats(id),
      ]);
      setHospital(hospitalData);
      setDepartments(departmentsData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) { setError(err as Error); }
    finally { setIsLoading(false); }
  }, []);

  const loadDepartmentBeds = useCallback(async (departmentId: string) => {
    try {
      const bedsData = await HospitalService.getDepartmentBeds(departmentId);
      setBeds(bedsData);
    } catch (err) { setError(err as Error); }
  }, []);

  const resolveAlert = useCallback(async (alertId: string, resolvedBy: string, notes?: string) => {
    try {
      await HospitalService.resolveAlert(alertId, resolvedBy, notes);
      if (hospitalId) { const alertsData = await HospitalService.getHospitalAlerts(hospitalId); setAlerts(alertsData); }
    } catch (err) { setError(err as Error); }
  }, [hospitalId]);

  useEffect(() => { if (hospitalId) loadHospital(hospitalId); }, [hospitalId, loadHospital]);

  return { hospital, departments, beds, alerts, stats, isLoading, error, loadDepartmentBeds, resolveAlert, refresh: () => hospitalId && loadHospital(hospitalId) };
}
