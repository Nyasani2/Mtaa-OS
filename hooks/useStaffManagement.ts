import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  department?: string;
  license_number?: string;
  specialization?: string;
  years_experience?: number;
  is_verified: boolean;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  rating?: number;
  total_patients?: number;
  earnings_today?: number;
  earnings_month?: number;
  created_at: string;
  // Joined fields
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export interface StaffFilters {
  role?: string;
  department?: string;
  status?: string;
  search?: string;
  verified?: boolean;
}

export function useStaffManagement(facilityId?: string) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StaffFilters>({});

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('health_staff')
        .select(`
          *,
          user_profiles:user_id (full_name, email, phone, avatar_url)
        `);

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.verified !== undefined) {
        query = query.eq('is_verified', filters.verified);
      }

      const { data, error: err } = await query.order('created_at', { ascending: false });

      if (err) throw err;

      const mapped: StaffMember[] = (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        role: s.role,
        department: s.department,
        license_number: s.license_number,
        specialization: s.specialization,
        years_experience: s.years_experience,
        is_verified: s.is_verified ?? false,
        status: s.status || 'pending',
        rating: s.rating,
        total_patients: s.total_patients,
        earnings_today: s.earnings_today,
        earnings_month: s.earnings_month,
        created_at: s.created_at,
        full_name: s.user_profiles?.full_name,
        email: s.user_profiles?.email,
        phone: s.user_profiles?.phone,
        avatar_url: s.user_profiles?.avatar_url,
      }));

      // Apply search filter client-side
      let result = mapped;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = mapped.filter(s => 
          (s.full_name && s.full_name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.role && s.role.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q)) ||
          (s.license_number && s.license_number.toLowerCase().includes(q))
        );
      }

      setStaff(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [facilityId, filters.role, filters.department, filters.status, filters.verified, filters.search]);

  const updateStaffStatus = useCallback(async (staffId: string, status: string) => {
    try {
      const { error: err } = await supabase
        .from('health_staff')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', staffId);

      if (err) throw err;
      await fetchStaff();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchStaff]);

  const verifyStaff = useCallback(async (staffId: string) => {
    try {
      const { error: err } = await supabase
        .from('health_staff')
        .update({ is_verified: true, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', staffId);

      if (err) throw err;
      await fetchStaff();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchStaff]);

  const deleteStaff = useCallback(async (staffId: string) => {
    try {
      const { error: err } = await supabase
        .from('health_staff')
        .delete()
        .eq('id', staffId);

      if (err) throw err;
      await fetchStaff();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchStaff]);

  const updateFilters = useCallback((newFilters: Partial<StaffFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const roles = Array.from(new Set(staff.map(s => s.role).filter(Boolean)));
  const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    pending: staff.filter(s => s.status === 'pending').length,
    verified: staff.filter(s => s.is_verified).length,
    suspended: staff.filter(s => s.status === 'suspended').length,
  };

  return {
    staff,
    loading,
    error,
    filters,
    updateFilters,
    updateStaffStatus,
    verifyStaff,
    deleteStaff,
    refresh: fetchStaff,
    roles,
    departments,
    stats,
  };
}
