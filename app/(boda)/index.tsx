import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function BodaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rideType, setRideType] = useState<'solo' | 'shared'>('solo');

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
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([-1.2921, 36.8219], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Boda stops
    L.marker([-1.2921, 36.8219]).addTo(map).bindPopup('You are here').openPopup();
    L.marker([-1.2950, 36.8250]).addTo(map).bindPopup('Boda Stop 1');
    L.marker([-1.2880, 36.8180]).addTo(map).bindPopup('Boda Stop 2');

    var latlngs = [[-1.2921, 36.8219], [-1.2950, 36.8250]];
    L.polyline(latlngs, {color: '#8B5CF6', weight: 4}).addTo(map);
  </script>
</body>
</html>
  `;

  const prices = { solo: 100, shared: 50 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boda</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.mapLoadingText}>Loading boda map...</Text>
          </View>
        )}
      </View>

      <View style={styles.ridePanel}>
        <Text style={styles.panelTitle}>Book Boda</Text>

        <View style={styles.rideTypes}>
          <TouchableOpacity
            style={[styles.rideOption, rideType === 'solo' && styles.rideOptionActive]}
            onPress={() => setRideType('solo')}
          >
            <Ionicons name="bicycle-outline" size={28} color={rideType === 'solo' ? '#8B5CF6' : '#94a3b8'} />
            <Text style={[styles.rideTypeName, rideType === 'solo' && styles.rideTypeNameActive]}>Solo</Text>
            <Text style={styles.ridePrice}>KES {prices.solo}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rideOption, rideType === 'shared' && styles.rideOptionActive]}
            onPress={() => setRideType('shared')}
          >
            <Ionicons name="people-outline" size={28} color={rideType === 'shared' ? '#8B5CF6' : '#94a3b8'} />
            <Text style={[styles.rideTypeName, rideType === 'shared' && styles.rideTypeNameActive]}>Shared</Text>
            <Text style={styles.ridePrice}>KES {prices.shared}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(boda)/request')}>
          <Text style={styles.bookBtnText}>Book {rideType} Boda — KES {prices[rideType]}</Text>
        </TouchableOpacity>
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
  rideOptionActive: { borderColor: '#8B5CF6', backgroundColor: '#8B5CF610' },
  rideTypeName: { fontSize: 12, color: '#64748b', marginTop: 4 },
  rideTypeNameActive: { color: '#8B5CF6', fontWeight: '600' },
  ridePrice: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  bookBtn: { backgroundColor: '#8B5CF6', borderRadius: 12, padding: 16, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
