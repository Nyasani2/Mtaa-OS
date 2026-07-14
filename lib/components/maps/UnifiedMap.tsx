// lib/components/maps/UnifiedMap.tsx
// Unified map component for MTAA OS
// Supports: MTaxi, MTruck, Boda tracking and request flows

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UnifiedMapProps {
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  route?: { latitude: number; longitude: number }[];
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    type?: 'driver' | 'pickup' | 'dropoff' | 'vehicle';
  }>;
  onMarkerPress?: (marker: any) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  style?: any;
}

export function UnifiedMap({
  origin,
  destination,
  route,
  markers,
  onMarkerPress,
  onMapPress,
  showsUserLocation = true,
  followsUserLocation = false,
  style,
}: UnifiedMapProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Map View</Text>
        {origin && (
          <Text style={styles.coordText}>
            Origin: {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
          </Text>
        )}
        {destination && (
          <Text style={styles.coordText}>
            Dest: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
          </Text>
        )}
        {markers && markers.length > 0 && (
          <Text style={styles.coordText}>{markers.length} marker(s)</Text>
        )}
        <Text style={styles.hintText}>(Install react-native-maps for full rendering)</Text>
      </View>
    </View>
  );
}

export default UnifiedMap;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b0d4e3',
    minHeight: 200,
  },
  placeholderText: { fontSize: 24, marginBottom: 8 },
  coordText: { fontSize: 12, color: '#555', marginTop: 4 },
  hintText: { fontSize: 10, color: '#999', marginTop: 12, fontStyle: 'italic' },
});
