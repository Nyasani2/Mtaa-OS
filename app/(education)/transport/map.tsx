// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TransportMapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Live Transport Map</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Mock Map View */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={60} color="#94A3B8" />
        <Text style={styles.mapText}>Interactive Map Loading...</Text>
        <Text style={styles.mapSubtext}>(Integrate with React Native Maps / Google Maps API)</Text>
        
        {/* Mock Bus Marker */}
        <View style={styles.busMarker}>
          <Ionicons name="bus" size={20} color="#fff" />
        </View>
      </View>

      {/* Live Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.busIconBox}>
            <Ionicons name="bus" size={24} color="#3B82F6" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.routeName}>Route 4: Westlands to School</Text>
            <Text style={styles.eta}>ETA: 12 minutes • 2.4 km away</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.statusText, { color: '#166534' }]}>On Time</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>John Doe (Driver)</Text>
            <Text style={styles.plateNumber}>KCA 123X • +254 7XX XXX XXX</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  mapPlaceholder: { flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', margin: 20, borderRadius: 20, position: 'relative' },
  mapText: { color: '#CBD5E1', fontSize: 16, fontWeight: '600', marginTop: 12 },
  mapSubtext: { color: '#64748B', fontSize: 12, marginTop: 4 },
  busMarker: { position: 'absolute', top: '40%', left: '60%', backgroundColor: '#3B82F6', padding: 10, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  
  statusCard: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 16 },
  statusHeader: { flexDirection: 'row', alignItems: 'center' },
  busIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusInfo: { flex: 1 },
  routeName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  eta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  plateNumber: { fontSize: 13, color: '#64748B', marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
});
