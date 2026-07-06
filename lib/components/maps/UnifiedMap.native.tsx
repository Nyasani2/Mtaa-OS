import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
}

interface UnifiedMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<{ latitude: number; longitude: number }>;
  showUserLocation?: boolean;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

const DEFAULT_COORDS = { lat: -1.2921, lng: 36.8219 };

export default function UnifiedMap({
  latitude = DEFAULT_COORDS.lat,
  longitude = DEFAULT_COORDS.lng,
  zoom = 14,
  markers = [],
  route,
  showUserLocation = true,
  onMapPress,
  style,
  mapType = 'standard',
}: UnifiedMapProps) {
  const delta = 0.05 * (20 / zoom);

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        onPress={(e: any) => onMapPress?.(e.nativeEvent.coordinate)}
        mapType={mapType}
      >
        {markers.map((m: any) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            pinColor={m.color || '#3b82f6'}
          />
        ))}
        {route && route.length > 1 && (
          <Polyline coordinates={route} strokeColor="#3b82f6" strokeWidth={4} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 12 },
});
