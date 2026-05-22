import { supabase } from '@/lib/supabase';

export function useDriver(driver_id: string) {
  return {
    location: null,
    isOnline: false,
    setOnline: (v: boolean) => {},
  };
}
