import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface HealthFacility { id: string; name: string; role: string; }

export function useHealthRole() {
  const { user } = useAuthStore();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<HealthFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>('staff');

  const load = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('health_facility_staff')
        .select('role, facility_id, health_facilities(id, name)')
        .eq('user_id', user.id).eq('status', 'ACTIVE');
      const list: HealthFacility[] = (data || []).map((r: any) => ({
        id: r.facility_id, name: r.health_facilities?.name || 'Facility', role: r.role,
      }));
      setFacilities(list);
      if (list.length) { setRole(list[0].role); setSelectedFacilityId((p) => p || list[0].id); }
    } catch { /* offline / rls */ }
    finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const selectFacility = (id: string) => {
    setSelectedFacilityId(id);
    const f = facilities.find((x) => x.id === id);
    if (f) setRole(f.role);
  };

  return { selectedFacilityId, setSelectedFacilityId, facilities, isLoading, role, selectFacility, refetch: load };
}
