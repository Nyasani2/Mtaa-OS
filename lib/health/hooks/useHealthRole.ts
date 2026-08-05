import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export type HealthRole = 'patient' | 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'admin' | 'cashier' | 'traditional_healer' | 'herbalist' | 'ambulance_dispatcher' | 'accountant' | 'receptionist';

export function useHealthRole() {
  const { user } = useAuthStore();
  const [role, setRole] = useState<HealthRole | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data: staff } = await supabase.from('health_staff').select('*, health_facilities!inner(id, name)').eq('user_id', user.id).maybeSingle();
      if (staff) {
        setRole(staff.role_type as HealthRole);
        setSelectedFacilityId(staff.health_facilities?.id || null);
        const { data: allStaff } = await supabase.from('health_staff').select('facility_id, health_facilities(id, name)').eq('user_id', user.id);
        setFacilities(allStaff?.map(s => s.health_facilities).filter(Boolean) || []);
        setIsLoading(false); return;
      }
      const { data: healer } = await supabase.from('health_traditional_healers').select('*').eq('user_id', user.id).maybeSingle();
      if (healer) { setRole('traditional_healer'); setSelectedFacilityId(healer.facility_id); setIsLoading(false); return; }
      const { data: patient } = await supabase.from('health_patients').select('*').eq('user_id', user.id).maybeSingle();
      if (patient) { setRole('patient'); setIsLoading(false); return; }
      setRole(null);
    } finally { setIsLoading(false); }
  }, [user, supabase]);

  const selectFacility = useCallback((facilityId: string) => { setSelectedFacilityId(facilityId); }, []);
  useEffect(() => { fetchRole(); }, [fetchRole]);
  return { role, selectedFacilityId, facilities, isLoading, selectFacility, refresh: fetchRole };
}
