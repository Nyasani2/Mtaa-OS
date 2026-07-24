import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  rating?: number;
  is_24h?: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

const FACILITY_SELECT = `
  id, name, type, address, city, phone, email, rating, is_24h, latitude, longitude, created_at
`;

export function useFindCare() {
  const { data: facilities, isLoading, error } = useQuery({
    queryKey: ['health-facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_facilities')
        .select(FACILITY_SELECT)
        .order('name');
      if (error) throw error;
      return (data || []) as Facility[];
    },
  });

  const searchFacilities = async (query: string, filters?: { type?: string; city?: string }) => {
    let q = supabase
      .from('health_facilities')
      .select(FACILITY_SELECT);

    if (query) {
      q = q.or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`);
    }
    if (filters?.type) {
      q = q.eq('type', filters.type);
    }
    if (filters?.city) {
      q = q.eq('city', filters.city);
    }

    const { data, error } = await q.order('name');
    if (error) throw error;
    return (data || []) as Facility[];
  };

  return { facilities: facilities || [], isLoading, error, searchFacilities };
}
