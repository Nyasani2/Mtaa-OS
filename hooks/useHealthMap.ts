import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type MapEntityType = 'ambulance' | 'pharmacy' | 'herbal_clinic' | 'hospital' | 'clinic';

export interface MapEntity {
  id: string;
  type: MapEntityType;
  name: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline' | 'open' | 'closed';
  address?: string;
  phone?: string;
  rating?: number;
  distance?: number;
  metadata?: Record<string, any>;
}

export function useHealthMap() {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<MapEntityType | 'all'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchEntities = useCallback(async (type?: MapEntityType) => {
    try {
      setLoading(true);
      const results: MapEntity[] = [];

      if (!type || type === 'ambulance' || type === 'all') {
        const { data } = await supabase
          .from('health_ambulances')
          .select('id, name, latitude, longitude, status, driver_id, vehicle_number')
          .not('latitude', 'is', null);

        if (data) {
          results.push(...data.map(a => ({
            id: a.id,
            type: 'ambulance' as MapEntityType,
            name: a.name || `Ambulance ${a.vehicle_number}`,
            latitude: a.latitude,
            longitude: a.longitude,
            status: (a.status === 'available' ? 'available' : a.status === 'dispatched' ? 'busy' : 'offline') as any,
            metadata: { vehicle_number: a.vehicle_number, driver_id: a.driver_id },
          })));
        }
      }

      if (!type || type === 'pharmacy' || type === 'all') {
        const { data } = await supabase
          .from('health_pharmacies')
          .select('id, name, latitude, longitude, status, address, phone, rating')
          .not('latitude', 'is', null);

        if (data) {
          results.push(...data.map(p => ({
            id: p.id,
            type: 'pharmacy' as MapEntityType,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            status: (p.status === 'active' ? 'open' : 'closed') as any,
            address: p.address,
            phone: p.phone,
            rating: p.rating,
          })));
        }
      }

      if (!type || type === 'herbal_clinic' || type === 'all') {
        const { data } = await supabase
          .from('health_herbal_clinics')
          .select('id, name, latitude, longitude, status, address, phone, rating')
          .not('latitude', 'is', null);

        if (data) {
          results.push(...data.map(h => ({
            id: h.id,
            type: 'herbal_clinic' as MapEntityType,
            name: h.name,
            latitude: h.latitude,
            longitude: h.longitude,
            status: (h.status === 'active' ? 'open' : 'closed') as any,
            address: h.address,
            phone: h.phone,
            rating: h.rating,
          })));
        }
      }

      if (!type || type === 'hospital' || type === 'all') {
        const { data } = await supabase
          .from('health_facilities')
          .select('id, name, latitude, longitude, status, address, phone, type')
          .not('latitude', 'is', null)
          .eq('type', 'hospital');

        if (data) {
          results.push(...data.map(f => ({
            id: f.id,
            type: 'hospital' as MapEntityType,
            name: f.name,
            latitude: f.latitude,
            longitude: f.longitude,
            status: (f.status === 'active' ? 'open' : 'closed') as any,
            address: f.address,
            phone: f.phone,
          })));
        }
      }

      setEntities(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error('Location error:', err);
          setUserLocation({ lat: -1.2921, lng: 36.8219 }); // Default Nairobi
        }
      );
    } else {
      setUserLocation({ lat: -1.2921, lng: 36.8219 });
    }
  }, []);

  const filteredEntities = selectedType === 'all' 
    ? entities 
    : entities.filter(e => e.type === selectedType);

  useEffect(() => {
    fetchEntities();
    getUserLocation();
  }, [fetchEntities, getUserLocation]);

  const refresh = useCallback(() => {
    fetchEntities(selectedType === 'all' ? undefined : selectedType as MapEntityType);
  }, [fetchEntities, selectedType]);

  return {
    entities,
    filteredEntities,
    loading,
    error,
    selectedType,
    setSelectedType,
    userLocation,
    refresh,
  };
}
