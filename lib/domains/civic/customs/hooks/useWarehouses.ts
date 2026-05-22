import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Warehouse {
  id: string;
  warehouse_name: string;
  license_number: string;
  operator_name: string;
  location: string;
  capacity_sqm: number;
  occupied_sqm: number;
  goods_value: number;
  status: 'active' | 'inactive' | 'suspended';
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['customs', 'warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bonded_warehouses').select('*').order('warehouse_name');
      if (error) throw error;
      return data as Warehouse[];
    },
  });
}
