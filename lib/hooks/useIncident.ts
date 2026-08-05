import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  lat?: number;
  lng?: number;
  address?: string;
  reporter_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  officer_id?: string;
  recording_id?: string;
  evidence_id?: string;
  trip_id?: string;
  title: string;
  description?: string;
  injuries_reported: boolean;
  property_damage: boolean;
  police_notified: boolean;
  ambulance_notified: boolean;
  fire_notified: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface UseIncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
}

export function useIncident() {
  const [state, setState] = useState<UseIncidentState>({
    incidents: [],
    currentIncident: null,
    isLoading: false,
    error: null,
  });

  const loadIncidents = useCallback(async (filters?: {
    status?: string;
    severity?: string;
    driver_id?: string;
    vehicle_id?: string;
    limit?: number;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          reporter:reporter_id(id, full_name),
          driver:driver_id(id, full_name),
          vehicle:vehicle_id(*),
          officer:officer_id(id, full_name),
          recording:recording_id(*),
          evidence:evidence_id(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      if (filters?.driver_id) query = query.eq('driver_id', filters.driver_id);
      if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, incidents: data || [], isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadIncident = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reporter_id(id, full_name),
          driver:driver_id(id, full_name),
          vehicle:vehicle_id(*),
          officer:officer_id(id, full_name),
          recording:recording_id(*),
          evidence:evidence_id(*),
          resolver:resolved_by(id, full_name)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      setState(prev => ({ ...prev, currentIncident: data, isLoading: false }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const createIncident = useCallback(async (incidentData: Omit<Incident, 'id' | 'created_at' | 'updated_at'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select()
        .maybeSingle();
      if (error) throw error;
      setState(prev => ({
        ...prev,
        incidents: [data, ...prev.incidents],
        currentIncident: data,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const updateIncident = useCallback(async (id: string, updates: Partial<Incident>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      setState(prev => ({
        ...prev,
        incidents: prev.incidents.map(i => i.id === id ? data : i),
        currentIncident: prev.currentIncident?.id === id ? data : prev.currentIncident,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const resolveIncident = useCallback(async (id: string, resolutionNotes: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.user?.id,
          resolution_notes: resolutionNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      setState(prev => ({
        ...prev,
        incidents: prev.incidents.map(i => i.id === id ? data : i),
        currentIncident: prev.currentIncident?.id === id ? data : prev.currentIncident,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const deleteIncident = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { error } = await supabase.from('incidents').delete().eq('id', id);
      if (error) throw error;
      setState(prev => ({
        ...prev,
        incidents: prev.incidents.filter(i => i.id !== id),
        currentIncident: prev.currentIncident?.id === id ? null : prev.currentIncident,
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const getIncidentStats = useCallback(async () => {
    try {
      const { count: open } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'open');
      const { count: critical } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('severity', 'critical');
      const { count: today } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      return {
        open: open || 0,
        critical: critical || 0,
        today: today || 0,
      };
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      return { open: 0, critical: 0, today: 0 };
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadIncidents,
    loadIncident,
    createIncident,
    updateIncident,
    resolveIncident,
    deleteIncident,
    getIncidentStats,
    clearError,
  };
}
