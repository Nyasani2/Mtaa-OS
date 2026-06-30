import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// OpenStreetMap via WebView for cross-platform support
import { WebView } from 'react-native-webview';

export default function MTaxiScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [rideType, setRideType] = useState<'economy' | 'comfort' | 'premium'>('economy');

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
    .leaflet-control-attribution { font-size: 8px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Nairobi default
    var map = L.map('map').setView([-1.2921, 36.8219], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add sample markers
    var pickup = L.marker([-1.2921, 36.8219]).addTo(map).bindPopup('Pickup');
    var dropoff = L.marker([-1.3000, 36.8300]).addTo(map).bindPopup('Dropoff');

    // Draw route line
    var latlngs = [[-1.2921, 36.8219], [-1.3000, 36.8300]];
    var polyline = L.polyline(latlngs, {color: '#3b82f6', weight: 4}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [20, 20]});
  </script>
</body>
</html>
  `;

  const prices = { economy: 250, comfort: 450, premium: 800 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MTaxi</Text>
        <TouchableOpacity onPress={() => router.push('/(mtaxi)/history')}>
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Ride Options */}
      <View style={styles.ridePanel}>
        <Text style={styles.panelTitle}>Choose your ride</Text>

        <View style={styles.rideTypes}>
          {(['economy', 'comfort', 'premium'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.rideOption, rideType === type && styles.rideOptionActive]}
              onPress={() => setRideType(type)}
            >
              <Ionicons
                name={type === 'economy' ? 'car-outline' : type === 'comfort' ? 'car-sport-outline' : 'car-outline'}
                size={24}
                color={rideType === type ? '#3b82f6' : '#94a3b8'}
              />
              <Text style={[styles.rideTypeName, rideType === type && styles.rideTypeNameActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <Text style={styles.ridePrice}>KES {prices[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(mtaxi)/request')}>
          <Text style={styles.bookBtnText}>Book {rideType} — KES {prices[rideType]}</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtaxi)/book')}>
            <Ionicons name="location-outline" size={20} color="#3b82f6" />
            <Text style={styles.quickBtnText}>Book Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtaxi)/tracking')}>
            <Ionicons name="navigate-outline" size={20} color="#10b981" />
            <Text style={styles.quickBtnText}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtaxi)/driver')}>
            <Ionicons name="person-outline" size={20} color="#f59e0b" />
            <Text style={styles.quickBtnText}>Driver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  mapLoadingText: { marginTop: 8, color: '#94a3b8', fontSize: 14 },
  ridePanel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 30 },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  rideTypes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  rideOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  rideOptionActive: { borderColor: '#3b82f6', backgroundColor: '#3b82f610' },
  rideTypeName: { fontSize: 12, color: '#64748b', marginTop: 4 },
  rideTypeNameActive: { color: '#3b82f6', fontWeight: '600' },
  ridePrice: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  bookBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10 },
  quickBtnText: { fontSize: 12, color: '#475569', fontWeight: '500' },
});
