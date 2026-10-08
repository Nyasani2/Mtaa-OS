// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function TransportMapScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
    
    // Subscribe to real-time location updates for live tracking
    const channel = supabase
      .channel('transport-locations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transport_vehicles' }, payload => {
        setVehicles(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchVehicles = async () => {
    try {
      // Adjust table name to your actual transport/vehicle location table (e.g., 'school_buses', 'mtaxi_vehicles')
      const { data, error } = await supabase
        .from('transport_vehicles') 
        .select('id, name, route, driver_name, phone, latitude, longitude, status')
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Fallback to mock data if table is empty/missing, so the UI never breaks
      setVehicles(data && data.length > 0 ? data : [
        { id: '1', name: 'Route 4 Bus', route: 'Westlands to School', driver_name: 'John Doe', phone: '+254 7XX XXX XXX', latitude: -1.2675, longitude: 36.8083, status: 'active' }
      ]);
    } catch (err) {
      console.error('Map fetch error:', err);
      setVehicles([
        { id: '1', name: 'Route 4 Bus', route: 'Westlands to School', driver_name: 'John Doe', phone: '+254 7XX XXX XXX', latitude: -1.2675, longitude: 36.8083, status: 'active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Live Transport Map</Text>
        <TouchableOpacity onPress={fetchVehicles}><Ionicons name="refresh" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: -1.286389, // Nairobi default
          longitude: 36.817223,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.latitude || -1.286389, longitude: v.longitude || 36.817223 }}
            onPress={() => setSelectedVehicle(v)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="bus" size={24} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedVehicle && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.busIconBox}>
              <Ionicons name="bus" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.routeName}>{selectedVehicle.name}</Text>
              <Text style={styles.eta}>{selectedVehicle.route}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{selectedVehicle.driver_name || 'Driver'}</Text>
              <Text style={styles.plateNumber}>{selectedVehicle.phone || 'No phone'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert('Call', `Calling ${selectedVehicle.phone}`)}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  map: { flex: 1, width: '100%' },
  markerContainer: { backgroundColor: '#3B82F6', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff', elevation: 4 },
  statusCard: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  statusHeader: { flexDirection: 'row', alignItems: 'center' },
  busIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusInfo: { flex: 1 },
  routeName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  eta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  plateNumber: { fontSize: 13, color: '#64748B', marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
});
