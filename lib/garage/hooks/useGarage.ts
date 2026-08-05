import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Garage {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  registration_number?: string;
  tax_id?: string;
  services_offered?: string[];
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export interface GarageDevice {
  id: string; garage_id: string; name: string; type: string;
  status: 'online' | 'offline' | 'maintenance'; last_seen?: string;
}

export interface GarageRecording {
  id: string; device_id: string; url: string; duration: number; created_at: string;
}

export interface GarageIncident {
  id: string; garage_id: string; title: string; description?: string;
  severity: 'low' | 'medium' | 'high'; status: 'open' | 'resolved' | 'escalated'; created_at: string;
}

export function useGarage() {
  const { user } = useAuthStore();
  const [garage, setGarage] = useState<Garage | null>(null);
  const [devices, setDevices] = useState<GarageDevice[]>([]);
  const [recordings, setRecordings] = useState<GarageRecording[]>([]);
  const [incidents, setIncidents] = useState<GarageIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGarage = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase
        .from('garages').select('*').eq('owner_id', user.id).maybeSingle();
      if (err) throw err;
      setGarage(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load garage');
      console.warn('loadGarage error:', err);
    } finally { setIsLoading(false); }
  }, [user?.id]);

  const loadDevices = useCallback(async (filters?: { status?: string }) => {
    if (!user?.id) return;
    try {
      let q = supabase.from('garage_devices').select('*');
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error: err } = await q;
      if (err) throw err;
      setDevices(data || []);
    } catch (err: any) { console.warn('loadDevices error:', err); }
  }, [user?.id]);

  const loadRecordings = useCallback(async (filters?: { limit?: number }) => {
    if (!user?.id) return;
    try {
      let q = supabase.from('garage_recordings').select('*').order('created_at', { ascending: false });
      if (filters?.limit) q = q.limit(filters.limit);
      const { data, error: err } = await q;
      if (err) throw err;
      setRecordings(data || []);
    } catch (err: any) { console.warn('loadRecordings error:', err); }
  }, [user?.id]);

  const loadIncidents = useCallback(async (filters?: { limit?: number; status?: string }) => {
    if (!user?.id) return;
    try {
      let q = supabase.from('garage_incidents').select('*').order('created_at', { ascending: false });
      if (filters?.limit) q = q.limit(filters.limit);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error: err } = await q;
      if (err) throw err;
      setIncidents(data || []);
    } catch (err: any) { console.warn('loadIncidents error:', err); }
  }, [user?.id]);

  const registerGarage = useCallback(async (payload: Partial<Garage>) => {
    if (!user?.id) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('garages')
      .insert({ ...payload, owner_id: user.id, status: 'pending' })
      .select().maybeSingle();
    if (err) throw err;
    setGarage(data);
    return data;
  }, [user?.id]);

  return {
    garage, devices, recordings, incidents, isLoading, error,
    loadGarage, loadDevices, loadRecordings, loadIncidents, registerGarage,
  };
}
