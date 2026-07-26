/**
 * MTAA OS V10 — useRestaurantStaff Hook
 * Staff scheduling + attendance
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface RestaurantStaffMember {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: string;
  hourly_rate: number | null;
  shift_start: string | null;
  shift_end: string | null;
  is_active: boolean;
  created_at: string;
}

export function useRestaurantStaff(restaurantId: string) {
  const [staff, setStaff] = useState<RestaurantStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('role');
      if (error) throw error;
      setStaff(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const addStaff = useCallback(async (payload: Partial<RestaurantStaffMember>) => {
    if (!restaurantId) throw new Error('No restaurant');
    const { data, error } = await supabase
      .from('restaurant_staff')
      .insert({ ...payload, restaurant_id: restaurantId })
      .select()
      .single();
    if (error) throw error;
    setStaff((prev) => [...prev, data]);
    return data;
  }, [restaurantId]);

  const updateStaff = useCallback(async (id: string, payload: Partial<RestaurantStaffMember>) => {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setStaff((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  }, []);

  const clockIn = useCallback(async (staffId: string) => {
    const { data, error } = await supabase
      .from('restaurant_attendance')
      .insert({ staff_id: staffId, clock_in: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const clockOut = useCallback(async (attendanceId: string) => {
    const { data, error } = await supabase
      .from('restaurant_attendance')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', attendanceId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  useEffect(() => { load(); }, [load]);

  return { staff, isLoading, error, refresh: load, addStaff, updateStaff, clockIn, clockOut };
}
