// hooks/useHealthMap.ts
// Health facility map data hook for MTAA Health
// Imported by: app/(os)/health/map/index.tsx

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface HealthFacility {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  email?: string;
  services: string[];
  isOpen: boolean;
  rating?: number;
  distance?: number;
}

export interface MapFilters {
  type?: string;
  services?: string[];
  isOpen?: boolean;
  maxDistance?: number; // km
}

export function useHealthMap() {
  const user = useAuthStore((s) => s.user);
  const [facilities, setFacilities] = useState<HealthFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchFacilities = useCallback(async (filters?: MapFilters) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('health_facilities')
        .select('id, name, type, latitude, longitude, address, phone, email, services, is_open, rating')
        .eq('status', 'active');

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.isOpen !== undefined) {
        query = query.eq('is_open', filters.isOpen);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: HealthFacility[] = (data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        latitude: f.latitude || 0,
        longitude: f.longitude || 0,
        address: f.address || '',
        phone: f.phone,
        email: f.email,
        services: f.services || [],
        isOpen: f.is_open ?? true,
        rating: f.rating,
      }));

      setFacilities(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFacilities = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('health_facilities')
        .select('id, name, type, latitude, longitude, address, phone, email, services, is_open, rating')
        .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
        .eq('status', 'active');

      if (err) throw err;

      const mapped: HealthFacility[] = (data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        latitude: f.latitude || 0,
        longitude: f.longitude || 0,
        address: f.address || '',
        phone: f.phone,
        email: f.email,
        services: f.services || [],
        isOpen: f.is_open ?? true,
        rating: f.rating,
      }));

      setFacilities(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    loading,
    error,
    userLocation,
    fetchFacilities,
    searchFacilities,
    setUserLocation,
  };
}

export default useHealthMap;
