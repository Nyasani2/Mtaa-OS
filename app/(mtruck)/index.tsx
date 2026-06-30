import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function MTruckScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [haulType, setHaulType] = useState<'local' | 'longhaul' | 'heavy'>('local');

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
    var map = L.map('map').setView([-1.2921, 36.8219], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Sample truck markers
    L.marker([-1.2921, 36.8219]).addTo(map).bindPopup('Depot');
    L.marker([-1.3500, 36.7800]).addTo(map).bindPopup('Destination A');
    L.marker([-1.2500, 36.9000]).addTo(map).bindPopup('Destination B');

    var latlngs = [[-1.2921, 36.8219], [-1.3500, 36.7800]];
    L.polyline(latlngs, {color: '#84CC16', weight: 5, dashArray: '10, 10'}).addTo(map);
  </script>
</body>
</html>
  `;

  const prices = { local: 3500, longhaul: 15000, heavy: 25000 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MTruck</Text>
        <TouchableOpacity onPress={() => router.push('/(mtruck)/haul-history')}>
          <Ionicons name="time-outline" size={24} color="#fff" />
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
            <ActivityIndicator size="large" color="#84CC16" />
            <Text style={styles.mapLoadingText}>Loading logistics map...</Text>
          </View>
        )}
      </View>

      <View style={styles.haulPanel}>
        <Text style={styles.panelTitle}>Request Haul</Text>

        <View style={styles.haulTypes}>
          {(['local', 'longhaul', 'heavy'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.haulOption, haulType === type && styles.haulOptionActive]}
              onPress={() => setHaulType(type)}
            >
              <Ionicons
                name={type === 'local' ? 'car-outline' : type === 'longhaul' ? 'bus-outline' : 'cube-outline'}
                size={24}
                color={haulType === type ? '#84CC16' : '#94a3b8'}
              />
              <Text style={[styles.haulTypeName, haulType === type && styles.haulTypeNameActive]}>
                {type === 'longhaul' ? 'Long Haul' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <Text style={styles.haulPrice}>From KES {prices[type].toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.requestBtn} onPress={() => router.push('/(mtruck)/request-haul')}>
          <Text style={styles.requestBtnText}>Request {haulType === 'longhaul' ? 'Long Haul' : haulType} — KES {prices[haulType].toLocaleString()}</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtruck)/equipment')}>
            <Ionicons name="construct-outline" size={20} color="#84CC16" />
            <Text style={styles.quickBtnText}>Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtruck)/haul-tracking')}>
            <Ionicons name="navigate-outline" size={20} color="#3b82f6" />
            <Text style={styles.quickBtnText}>Track</Text>
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
  haulPanel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 30 },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  haulTypes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  haulOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  haulOptionActive: { borderColor: '#84CC16', backgroundColor: '#84CC1610' },
  haulTypeName: { fontSize: 12, color: '#64748b', marginTop: 4 },
  haulTypeNameActive: { color: '#84CC16', fontWeight: '600' },
  haulPrice: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  requestBtn: { backgroundColor: '#84CC16', borderRadius: 12, padding: 16, alignItems: 'center' },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10 },
  quickBtnText: { fontSize: 12, color: '#475569', fontWeight: '500' },
});
