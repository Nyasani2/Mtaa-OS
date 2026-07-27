// hooks/useStaffManagement.ts
// Hospital staff management hook for MTAA Health
// Imported by: app/(os)/health/hospital-admin/staff/index.tsx

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface StaffMember {
  id: string;
  user_id: string;
  facility_id: string;
  role: string;
  department: string;
  license_number?: string;
  specialization?: string;
  shift_preference?: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  joined_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url?: string;
  };
}

export interface StaffFilters {
  facilityId?: string;
  role?: string;
  department?: string;
  status?: string;
}

export function useStaffManagement() {
  const user = useAuthStore((s) => s.user);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async (filters?: StaffFilters) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('health_staff')
        .select(`
          *,
          profile:user_profiles(full_name, email, phone, avatar_url)
        `);

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId);
      }
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: err } = await query.order('joined_at', { ascending: false });
      if (err) throw err;

      const mapped: StaffMember[] = (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        facility_id: s.facility_id,
        role: s.role,
        department: s.department,
        license_number: s.license_number,
        specialization: s.specialization,
        shift_preference: s.shift_preference,
        status: s.status,
        joined_at: s.joined_at,
        profile: s.profile,
      }));

      setStaff(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addStaff = useCallback(async (staffData: Partial<StaffMember>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('health_staff')
        .insert(staffData)
        .select()
        .single();
      if (err) throw err;
      setStaff((prev) => [data as StaffMember, ...prev]);
      return data as StaffMember;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('health_staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setStaff((prev) => prev.map((s) => (s.id === id ? (data as StaffMember) : s)));
      return data as StaffMember;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeStaff = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('health_staff').delete().eq('id', id);
      if (err) throw err;
      setStaff((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    staff,
    loading,
    error,
    fetchStaff,
    addStaff,
    updateStaff,
    removeStaff,
  };
}

export default useStaffManagement;
