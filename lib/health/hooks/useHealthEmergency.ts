import { useState, useCallback } from 'react';
import {
  requestAmbulance,
  getDispatchStatus,
  cancelDispatch,
  getPatientDispatches,
  getEmergencyDataForMedic,
  AmbulanceDispatch,
} from '../services/health-emergency.service';
import { EmergencyData } from '../security/emergency-card';

export function useHealthEmergency(patientId: string) {
  const [dispatches, setDispatches] = useState<AmbulanceDispatch[]>([]);
  const [activeDispatch, setActiveDispatch] = useState<AmbulanceDispatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getPatientDispatches(patientId);
      setDispatches(d);
      const active = d.find(x => ['requested', 'dispatched', 'en_route'].includes(x.status));
      setActiveDispatch(active || null);
      return d;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const request = useCallback(async (
    location: { lat: number; lng: number; address: string },
    condition: string,
    priority: AmbulanceDispatch['priority']
  ) => {
    setLoading(true);
    try {
      const d = await requestAmbulance(patientId, location, condition, priority);
      if (d) await loadDispatches();
      return d;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const cancel = useCallback(async (dispatchId: string) => {
    setLoading(true);
    try {
      const ok = await cancelDispatch(dispatchId);
      if (ok) await loadDispatches();
      return ok;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadDispatches]);

  const getStatus = useCallback(async (dispatchId: string) => {
    return getDispatchStatus(dispatchId);
  }, []);

  const getMedicData = useCallback(async (): Promise<EmergencyData | null> => {
    return getEmergencyDataForMedic();
  }, []);

  return {
    dispatches,
    activeDispatch,
    loading,
    error,
    loadDispatches,
    request,
    cancel,
    getStatus,
    getMedicData,
  };
}
