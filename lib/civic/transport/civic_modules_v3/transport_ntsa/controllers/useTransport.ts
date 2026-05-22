import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ntsaService } from '../services/ntsaService';
import { useTransportStore } from '../state/store';
import { VehicleRegistration, DrivingLicense, InspectionRecord, Sacco, TrafficOffence, NTSAApplication, RoadIncident } from '../types';

export function useTransport() {
  const store = useTransportStore();

  const loadVehicles = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.getVehicles({ ownerId: userId });
      store.setVehicles(data);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const loadLicenses = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.getLicenses({ holderId: userId });
      store.setLicenses(data);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const loadOffences = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.getOffences({ driverId: userId });
      store.setOffences(data);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const loadApplications = useCallback(async (userId: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.getApplications({ applicantId: userId });
      store.setApplications(data);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const loadIncidents = useCallback(async () => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.getIncidents();
      store.setIncidents(data);
    } catch (err: any) {
      store.setError(err.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const registerVehicle = useCallback(async (vehicle: Omit<VehicleRegistration, 'id' | 'created_at' | 'updated_at'>) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.registerVehicle(vehicle);
      store.setVehicles([...store.vehicles, data]);
      return data;
    } catch (err: any) {
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const payFine = useCallback(async (offenceId: string, paymentRef: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const data = await ntsaService.payFine(offenceId, paymentRef);
      store.setOffences(store.offences.map(o => o.id === offenceId ? data : o));
      return data;
    } catch (err: any) {
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const reportIncident = useCallback(async (incident: Omit<RoadIncident, 'id' | 'created_at'>) => {
    store.setLoading(true);
    store.clearError();
    try {
      const { data, error } = await supabase.from('ntsa_incidents').insert(incident).select().single();
      if (error) throw error;
      store.setIncidents([...store.incidents, data]);
      return data;
    } catch (err: any) {
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const searchPlate = useCallback(async (plateNumber: string) => {
    store.setLoading(true);
    store.clearError();
    try {
      const { data, error } = await supabase.from('ntsa_vehicles').select('*').eq('plate_number', plateNumber).single();
      if (error) throw error;
      store.setSelectedItem(data);
      return data;
    } catch (err: any) {
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  return {
    ...store,
    loadVehicles,
    loadLicenses,
    loadOffences,
    loadApplications,
    loadIncidents,
    registerVehicle,
    payFine,
    reportIncident,
    searchPlate,
  };
}
