import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  status: string;
  owner_id: string;
  images: string[] | null;
}

export function useProperty() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    try {
      let q = supabase.from('properties').select('*');
      if (filters?.type) q = q.eq('type', filters.type);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(50);
      if (!error) setProperties(data || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, []);

  const getProperty = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error) return null;
      return data as Property;
    } catch (e) { return null; }
  }, []);

  return { properties, loading, fetchProperties, getProperty };
}
