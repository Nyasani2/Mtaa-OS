import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface EmergencyRequest {
  id: string;
  patientId: string;
  type: 'ambulance' | 'sos' | 'fire' | 'police';
  location: { lat: number; lng: number };
  status: 'pending' | 'dispatched' | 'resolved' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export function useHealthEmergency() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmergency = useCallback(async (req: Omit<EmergencyRequest, 'id' | 'createdAt' | 'status'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_emergency_requests')
        .insert({ ...req, status: 'pending', created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRequest = useCallback(async (id: string) => {
    const { error } = await supabase.from('health_emergency_requests').update({ status: 'cancelled' }).eq('id', id);
    return !error;
  }, []);

  return { loading, error, sendEmergency, cancelRequest };
}
