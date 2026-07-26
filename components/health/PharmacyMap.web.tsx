import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PharmacyLocation {
  id: string;
  name: string;
  type: 'chemist' | 'pharmacy' | 'herbal' | 'hospital' | 'clinic';
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  is_open?: boolean;
  distance_km?: number;
}

interface PharmacyMapProps {
  pharmacies: PharmacyLocation[];
  userLatitude?: number;
  userLongitude?: number;
  onMarkerPress?: (pharmacy: PharmacyLocation) => void;
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  chemist: '#10b981',
  pharmacy: '#0ea5e9',
  herbal: '#f59e0b',
  hospital: '#ef4444',
  clinic: '#8b5cf6',
};

const TYPE_ICONS: Record<string, string> = {
  chemist: 'flask-outline',
  pharmacy: 'medkit-outline',
  herbal: 'leaf-outline',
  hospital: 'medical-outline',
  clinic: 'business-outline',
};

export default function PharmacyMap({
  pharmacies,
  onMarkerPress,
  loading,
}: PharmacyMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePress = (p: PharmacyLocation) => {
    setSelectedId(p.id);
    onMarkerPress?.(p);
  };

  return (
    <View style={styles.container}>
      <View style={styles.webHeader}>
        <Ionicons name="map-outline" size={20} color="#0ea5e9" />
        <Text style={styles.webHeaderText}>Pharmacy Map (Web)</Text>
        <Text style={styles.webSub}>{pharmacies.length} locations found</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0ea5e9" />
      ) : (
        <View style={styles.webList}>
          {pharmacies.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.webCard, selectedId === p.id && styles.webCardActive]}
              onPress={() => handlePress(p)}
            >
              <View style={[styles.webIcon, { backgroundColor: (TYPE_COLORS[p.type] || '#0ea5e9') + '20' }]}>
                <Ionicons name={TYPE_ICONS[p.type] || 'location-outline'} size={20} color={TYPE_COLORS[p.type] || '#0ea5e9'} />
              </View>
              <View style={styles.webBody}>
                <Text style={styles.webName}>{p.name}</Text>
                <Text style={styles.webType}>{p.type.toUpperCase()}</Text>
                {p.address ? <Text style={styles.webAddr}>{p.address}</Text> : null}
                {p.distance_km ? <Text style={styles.webDist}>{p.distance_km.toFixed(1)} km away</Text> : null}
                {p.phone ? <Text style={styles.webPhone}>{p.phone}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
          {pharmacies.length === 0 && (
            <View style={styles.webEmpty}>
              <Ionicons name="map-outline" size={48} color="#cbd5e1" />
              <Text style={styles.webEmptyText}>No pharmacies found nearby</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  webHeader: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  webHeaderText: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  webSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  webList: { padding: 12 },
  webCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  webCardActive: { borderColor: '#0ea5e9', borderWidth: 1.5 },
  webIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  webBody: { flex: 1 },
  webName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  webType: { fontSize: 10, fontWeight: '700', color: '#0ea5e9', marginTop: 2 },
  webAddr: { fontSize: 12, color: '#64748b', marginTop: 2 },
  webDist: { fontSize: 12, color: '#10b981', marginTop: 2, fontWeight: '600' },
  webPhone: { fontSize: 12, color: '#0ea5e9', marginTop: 2 },
  webEmpty: { alignItems: 'center', paddingVertical: 60 },
  webEmptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
});
