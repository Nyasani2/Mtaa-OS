import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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

export default function PharmacyMap({
  pharmacies,
  userLatitude,
  userLongitude,
  onMarkerPress,
}: PharmacyMapProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [region, setRegion] = useState({
    latitude: userLatitude || -1.2921,
    longitude: userLongitude || 36.8219,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  useEffect(() => {
    if (pharmacies.length > 0 && mapRef.current) {
      const coords = pharmacies.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
      if (userLatitude && userLongitude) {
        coords.push({ latitude: userLatitude, longitude: userLongitude });
      }
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [pharmacies, userLatitude, userLongitude]);

  const handleMarkerPress = useCallback((pharmacy: PharmacyLocation) => {
    setSelectedId(pharmacy.id);
    onMarkerPress?.(pharmacy);
  }, [onMarkerPress]);

  const recenter = useCallback(() => {
    if (userLatitude && userLongitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLatitude,
        longitude: userLongitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 500);
    }
  }, [userLatitude, userLongitude]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        {userLatitude && userLongitude && (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            title="You"
            pinColor="#0ea5e9"
          />
        )}
        {pharmacies.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            description={`${p.type}${p.distance_km ? ` • ${p.distance_km.toFixed(1)}km` : ''}`}
            pinColor={TYPE_COLORS[p.type] || '#0ea5e9'}
            onPress={() => handleMarkerPress(p)}
          />
        ))}
      </MapView>

      {selectedId && (
        <View style={styles.overlayCard}>
          {(() => {
            const p = pharmacies.find((x) => x.id === selectedId);
            if (!p) return null;
            return (
              <>
                <View style={styles.overlayRow}>
                  <View style={[styles.overlayIcon, { backgroundColor: (TYPE_COLORS[p.type] || '#0ea5e9') + '20' }]}>
                    <Ionicons name="medkit-outline" size={20} color={TYPE_COLORS[p.type] || '#0ea5e9'} />
                  </View>
                  <View style={styles.overlayBody}>
                    <Text style={styles.overlayName}>{p.name}</Text>
                    <Text style={styles.overlayType}>{p.type.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedId(null)}>
                    <Ionicons name="close" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                {p.address ? <Text style={styles.overlayAddr}>{p.address}</Text> : null}
                {p.phone ? (
                  <TouchableOpacity style={styles.overlayPhoneBtn} onPress={() => Alert.alert('Call', p.phone!)}>
                    <Ionicons name="call-outline" size={14} color="#0ea5e9" />
                    <Text style={styles.overlayPhone}>{p.phone}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            );
          })()}
        </View>
      )}

      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={22} color="#0ea5e9" />
      </TouchableOpacity>

      <View style={styles.legend}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { width, height },
  overlayCard: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  overlayRow: { flexDirection: 'row', alignItems: 'center' },
  overlayIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  overlayBody: { flex: 1 },
  overlayName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  overlayType: { fontSize: 10, fontWeight: '700', color: '#0ea5e9', marginTop: 2 },
  overlayAddr: { fontSize: 13, color: '#64748b', marginTop: 8 },
  overlayPhoneBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  overlayPhone: { fontSize: 13, color: '#0ea5e9', fontWeight: '600' },
  recenterBtn: {
    position: 'absolute', bottom: 20, right: 16,
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  legend: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 11, color: '#475569', textTransform: 'capitalize' },
});
