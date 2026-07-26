import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProperty() {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').limit(50);
    if (!error) setProperties(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  return { properties, bookings, loading, fetchProperties };
}
