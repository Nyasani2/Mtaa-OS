import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export type HealthRole = 
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'ambulance_driver'
  | 'lab_tech'
  | 'cashier'
  | 'admin'
  | 'government'
  | 'herbalist'
  | null;

export interface HealthProfile {
  id: string;
  user_id: string;
  role: HealthRole;
  department?: string;
  license_number?: string;
  facility_id?: string;
  is_verified: boolean;
  specialization?: string;
  years_experience?: number;
  rating?: number;
  total_patients?: number;
  earnings_today?: number;
  earnings_month?: number;
  pending_appointments?: number;
  active_cases?: number;
}

export interface HealthStats {
  totalPatients: number;
  todayAppointments: number;
  pendingLabOrders: number;
  emergencyAlerts: number;
  revenueToday: number;
  bedOccupancy: number;
}

export function useUnifiedHealth() {
  const { user, profile } = useAuthStore();
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('health_staff')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (err) throw err;

      if (data) {
        setHealthProfile({
          id: data.id,
          user_id: data.user_id,
          role: data.role as HealthRole,
          department: data.department,
          license_number: data.license_number,
          facility_id: data.facility_id,
          is_verified: data.is_verified ?? false,
          specialization: data.specialization,
          years_experience: data.years_experience,
          rating: data.rating,
          total_patients: data.total_patients,
          earnings_today: data.earnings_today,
          earnings_month: data.earnings_month,
          pending_appointments: data.pending_appointments,
          active_cases: data.active_cases,
        });
      } else {
        // Check if patient
        const { data: patientData } = await supabase
          .from('health_patients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (patientData) {
          setHealthProfile({
            id: patientData.id,
            user_id: user.id,
            role: 'patient',
            is_verified: true,
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    if (!user?.id || !healthProfile?.role) return;
    try {
      const role = healthProfile.role;
      let statsData: Partial<HealthStats> = {};

      if (role === 'doctor' || role === 'nurse') {
        const { count: apptCount } = await supabase
          .from('health_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id)
          .eq('status', 'scheduled')
          .gte('appointment_date', new Date().toISOString().split('T')[0]);

        const { count: labCount } = await supabase
          .from('health_lab_orders')
          .select('*', { count: 'exact', head: true })
          .eq('ordered_by', user.id)
          .eq('status', 'pending');

        statsData = {
          todayAppointments: apptCount ?? 0,
          pendingLabOrders: labCount ?? 0,
        };
      }

      if (role === 'admin') {
        const { count: patientCount } = await supabase
          .from('health_patients')
          .select('*', { count: 'exact', head: true });

        const { count: bedCount } = await supabase
          .from('health_beds')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'occupied');

        const { count: totalBeds } = await supabase
          .from('health_beds')
          .select('*', { count: 'exact', head: true });

        statsData = {
          totalPatients: patientCount ?? 0,
          bedOccupancy: totalBeds ? Math.round((bedCount ?? 0) / totalBeds * 100) : 0,
        };
      }

      if (role === 'ambulance_driver') {
        const { count: activeCount } = await supabase
          .from('health_ambulance_dispatches')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'en_route');

        statsData = {
          emergencyAlerts: activeCount ?? 0,
        };
      }

      setStats(statsData as HealthStats);
    } catch (err: any) {
      console.error('Stats error:', err);
    }
  }, [user?.id, healthProfile?.role]);

  useEffect(() => {
    fetchHealthProfile();
  }, [fetchHealthProfile]);

  useEffect(() => {
    if (healthProfile) {
      fetchStats();
    }
  }, [healthProfile, fetchStats]);

  const getDashboardRoute = useCallback((): string => {
    const role = healthProfile?.role;
    switch (role) {
      case 'doctor': return '/health/doctor';
      case 'nurse': return '/health/doctor';
      case 'pharmacist': return '/health/herbal-pharmacy';
      case 'ambulance_driver': return '/health/ambulance';
      case 'cashier': return '/health/cashier';
      case 'admin': return '/health/hospital-admin';
      case 'government': return '/health/government';
      case 'herbalist': return '/health/herbal-pharmacy';
      case 'patient': return '/health/find-care';
      default: return '/health/onboard';
    }
  }, [healthProfile?.role]);

  const hasRole = useCallback((roles: HealthRole[]): boolean => {
    return healthProfile?.role ? roles.includes(healthProfile.role) : false;
  }, [healthProfile?.role]);

  return {
    healthProfile,
    stats,
    loading,
    error,
    userRole: healthProfile?.role,
    isVerified: healthProfile?.is_verified ?? false,
    getDashboardRoute,
    hasRole,
    refresh: fetchHealthProfile,
  };
}
