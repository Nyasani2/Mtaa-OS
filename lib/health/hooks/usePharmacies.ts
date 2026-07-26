import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Pharmacy {
  id: string;
  name: string;
  type: 'chemist' | 'pharmacy' | 'herbal' | 'hospital' | 'clinic';
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  email?: string;
  is_open?: boolean;
  rating?: number;
  hours?: string;
  license_number?: string;
  created_at: string;
  distance_km?: number;
}

interface UsePharmaciesOptions {
  filter?: 'all' | 'chemist' | 'pharmacy' | 'herbal' | 'hospital' | 'clinic';
  search?: string;
  limit?: number;
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
}

export function usePharmacies(options: UsePharmaciesOptions = {}) {
  const {
    filter = 'all',
    search = '',
    limit = 100,
    nearLat,
    nearLng,
    radiusKm = 50,
  } = options;

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('health_pharmacies')
        .select('id, name, type, latitude, longitude, address, phone, email, is_open, rating, hours, license_number, created_at')
        .order('name', { ascending: true });

      if (filter !== 'all') {
        q = q.eq('type', filter);
      }
      if (search.trim()) {
        q = q.ilike('name', `%${search.trim()}%`);
      }

      const { data, error: dbError } = await q.limit(limit);
      if (dbError) throw dbError;

      let results: Pharmacy[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type || 'pharmacy',
        latitude: p.latitude,
        longitude: p.longitude,
        address: p.address,
        phone: p.phone,
        email: p.email,
        is_open: p.is_open,
        rating: p.rating,
        hours: p.hours,
        license_number: p.license_number,
        created_at: p.created_at,
      }));

      // Compute distances if location provided
      if (nearLat !== undefined && nearLng !== undefined) {
        results = results.map((p) => {
          if (!p.latitude || !p.longitude) return p;
          return { ...p, distance_km: haversine(nearLat, nearLng, p.latitude, p.longitude) };
        }).sort((a, b) => (a.distance_km ?? 99999) - (b.distance_km ?? 99999));

        // Filter by radius
        if (radiusKm) {
          results = results.filter((p) => (p.distance_km ?? 99999) <= radiusKm);
        }
      }

      setPharmacies(results);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, limit, nearLat, nearLng, radiusKm]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  return { pharmacies, loading, error, refetch: fetchPharmacies };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
