// components/health/PharmacyMap.tsx
// Pharmacy location map component for MTAA Health
// Imported by: app/(os)/health/herbal-pharmacy/index.tsx, app/(os)/health/pharmacy/map.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface PharmacyLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  isOpen: boolean;
  distance?: number;
  type: 'pharmacy' | 'herbal' | 'hospital';
}

interface PharmacyMapProps {
  locations?: PharmacyLocation[];
  onSelect?: (location: PharmacyLocation) => void;
  selectedId?: string;
  showUserLocation?: boolean;
  filterType?: 'pharmacy' | 'herbal' | 'hospital' | 'all';
}

export default function PharmacyMap({
  locations: propLocations,
  onSelect,
  selectedId,
  showUserLocation = true,
  filterType = 'all',
}: PharmacyMapProps) {
  const user = useAuthStore((s) => s.user);
  const [locations, setLocations] = useState<PharmacyLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propLocations) {
      setLocations(propLocations);
      return;
    }
    fetchLocations();
  }, [propLocations]);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('health_facilities')
        .select('id, name, latitude, longitude, address, phone, type, is_open')
        .eq('status', 'active');

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: PharmacyLocation[] = (data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        latitude: f.latitude || 0,
        longitude: f.longitude || 0,
        address: f.address || '',
        phone: f.phone,
        isOpen: f.is_open ?? true,
        type: f.type || 'pharmacy',
      }));

      setLocations(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Placeholder map view — replace with react-native-maps when available
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>🗺️ Map View</Text>
        <Text style={styles.mapSubtitle}>{locations.length} locations found</Text>
        {locations.map((loc) => (
          <View
            key={loc.id}
            style={[
              styles.locationCard,
              selectedId === loc.id && styles.locationCardSelected,
            ]}
          >
            <Text style={styles.locationName}>{loc.name}</Text>
            <Text style={styles.locationAddress}>{loc.address}</Text>
            <Text style={styles.locationMeta}>
              {loc.isOpen ? '🟢 Open' : '🔴 Closed'}
              {loc.phone ? `  |  📞 ${loc.phone}` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    padding: 16,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationCardSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  locationMeta: {
    fontSize: 12,
    color: '#374151',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
});
