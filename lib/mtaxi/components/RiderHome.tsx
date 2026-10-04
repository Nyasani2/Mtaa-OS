// lib/mtaxi/components/RiderHome.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from "expo-router";
import { MapPin, Clock, CreditCard, Car, Star, ChevronRight, Bike, Truck } from "lucide-react-native";
import { supabase } from '@/lib/supabase';

// Use web-compatible maps
const MapView = Platform.OS === 'web' 
  ? require('@teovilla/react-native-web-maps').default
  : require('react-native-maps').default;

const Marker = Platform.OS === 'web'
  ? require('@teovilla/react-native-web-maps').Marker
  : require('react-native-maps').Marker;

const RECENT_PLACES = [
  { id: "1", name: "Home", address: "Lavington, Nairobi", lat: -1.2921, lng: 36.8219 },
  { id: "2", name: "Work", address: "Upper Hill, Nairobi", lat: -1.3, lng: 36.83 },
];

export default function RiderHome() {
  const router = useRouter();
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    fetchNearbyDrivers();
  }, []);

  const fetchNearbyDrivers = async () => {
    try {
      // Get online drivers from mtaxi_drivers table
      const { data: drivers, error } = await supabase
        .from('mtaxi_drivers')
        .select('id, user_id, vehicle_type, vehicle_plate, current_lat, current_lng, rating')
        .eq('is_online', true)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null)
        .limit(20);

      if (error) {
        console.error('Error fetching drivers:', error);
      } else {
        setNearbyDrivers(drivers || []);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* MAP AT THE TOP */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -1.2921,
            longitude: 36.8219,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Markers for nearby drivers */}
          {nearbyDrivers.map((driver) => (
            driver.current_lat && driver.current_lng && (
              <Marker
                key={driver.id}
                coordinate={{
                  latitude: driver.current_lat,
                  longitude: driver.current_lng,
                }}
                title={driver.vehicle_type}
                description={driver.vehicle_plate || ''}
              >
                <View style={styles.driverMarker}>
                  <Text style={styles.driverEmoji}>
                    {driver.vehicle_type === 'boda' ? '🏍️' : 
                     driver.vehicle_type === 'truck' ? '🚛' : '🚗'}
                  </Text>
                </View>
              </Marker>
            )
          ))}
        </MapView>
        {loadingDrivers && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        )}
        <View style={styles.driversCount}>
          <Text style={styles.driversCountText}>
            {nearbyDrivers.length} {nearbyDrivers.length === 1 ? 'driver' : 'drivers'} nearby
          </Text>
        </View>
      </View>

      {/* RIDE OPTIONS BELOW MAP */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Ride</Text>
        <View style={styles.rideTypes}>
          {[
            { type: "economy", icon: Car, label: "MTaxi", price: "KES 50 base", desc: "Affordable everyday rides" },
            { type: "boda", icon: Bike, label: "Boda", price: "KES 30 base", desc: "Quick 2-wheel rides" },
            { type: "truck", icon: Truck, label: "MTruck", price: "KES 200 base", desc: "Moving & delivery" },
          ].map((r) => (
            <TouchableOpacity
              key={r.type}
              style={styles.rideTypeCard}
              onPress={() => router.push({ pathname: "/(mtaxi)/request", params: { rideType: r.type } })}
            >
              <r.icon size={28} color="#2563eb" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rideTypeLabel}>{r.label}</Text>
                <Text style={styles.rideTypeDesc}>{r.desc}</Text>
              </View>
              <Text style={styles.rideTypePrice}>{r.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* RECENT PLACES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Places</Text>
        {RECENT_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeRow}
            onPress={() => router.push({ pathname: "/(mtaxi)/request", params: { dropoffLat: place.lat, dropoffLng: place.lng, dropoffAddress: place.address } })}
          >
            <Clock size={18} color="#666" />
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeAddress}>{place.address}</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* BECOME A DRIVER */}
      <TouchableOpacity 
        style={styles.driverBtn}
        onPress={() => router.push("/(mtaxi)/driver/onboarding" as any)}
      >
        <Text style={styles.driverBtnText}>👨🔧 Become a Driver — earn per ride</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  mapContainer: { 
    height: 300, 
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  map: { 
    width: '100%', 
    height: '100%',
  },
  driverMarker: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2563eb',
    elevation: 5,
  },
  driverEmoji: {
    fontSize: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    elevation: 5,
  },
  driversCount: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  driversCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: { marginTop: 0, paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  rideTypes: { gap: 10 },
  rideTypeCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 14, 
    backgroundColor: "#fff", 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rideTypeLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  rideTypeDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  rideTypePrice: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  placeRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 14, 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  placeInfo: { flex: 1, marginLeft: 12 },
  placeName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  placeAddress: { fontSize: 13, color: "#666", marginTop: 2 },
  driverBtn: { 
    margin: 16, 
    padding: 16, 
    backgroundColor: "#8b5cf6", 
    borderRadius: 12, 
    alignItems: "center",
  },
  driverBtnText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700",
  },
});
