// hooks/useUnifiedHealth.ts
// Unified health hook — aggregates all health sub-systems for dashboard/overview
// Imported by: app/(os)/health/index.tsx

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface HealthOverview {
  appointmentsToday: number;
  upcomingAppointments: number;
  pendingPrescriptions: number;
  recentLabResults: number;
  insuranceStatus: 'active' | 'expired' | 'none';
  emergencyContacts: number;
  unreadNotifications: number;
}

export interface HealthStats {
  totalVisits: number;
  totalSpent: number;
  activeMedications: number;
  bmi?: number;
  bloodPressure?: string;
}

export function useUnifiedHealth() {
  const user = useAuthStore((s) => s.user);
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch all health subsystems
      const [
        { data: appts },
        { data: prescriptions },
        { data: labs },
        { data: insurance },
        { data: contacts },
      ] = await Promise.all([
        supabase.from('health_appointments').select('id, appointment_date').eq('patient_id', user.id).gte('appointment_date', new Date().toISOString().split('T')[0]),
        supabase.from('health_prescriptions').select('id').eq('patient_id', user.id).eq('status', 'pending'),
        supabase.from('health_lab_results').select('id').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('health_insurance_policies').select('status').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('health_emergency_contacts').select('id').eq('user_id', user.id),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = (appts || []).filter((a: any) => a.appointment_date?.startsWith(today)).length;

      setOverview({
        appointmentsToday: todayAppts,
        upcomingAppointments: (appts || []).length,
        pendingPrescriptions: (prescriptions || []).length,
        recentLabResults: (labs || []).length,
        insuranceStatus: insurance ? 'active' : 'none',
        emergencyContacts: (contacts || []).length,
        unreadNotifications: 0,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: visits } = await supabase.from('health_visits').select('id, total_cost').eq('patient_id', user.id);
      const { data: meds } = await supabase.from('health_prescriptions').select('id').eq('patient_id', user.id).eq('status', 'active');
      const { data: profile } = await supabase.from('health_patient_profiles').select('bmi, blood_pressure').eq('user_id', user.id).maybeSingle();

      setStats({
        totalVisits: (visits || []).length,
        totalSpent: (visits || []).reduce((sum: number, v: any) => sum + (v.total_cost || 0), 0),
        activeMedications: (meds || []).length,
        bmi: profile?.bmi,
        bloodPressure: profile?.blood_pressure,
      });
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOverview();
    fetchStats();
  }, [fetchOverview, fetchStats]);

  return {
    overview,
    stats,
    loading,
    error,
    refresh: () => { fetchOverview(); fetchStats(); },
  };
}

export default useUnifiedHealth;
