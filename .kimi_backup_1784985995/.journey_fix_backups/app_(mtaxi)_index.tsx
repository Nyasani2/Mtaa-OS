import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useLocation } from '@/lib/hooks/useLocation';

const RIDE_TYPES = [
  { key: 'economy', label: 'Economy', desc: 'Affordable rides', price: 250, icon: 'car', color: '#3b82f6' },
  { key: 'comfort', label: 'Comfort', desc: 'Newer cars, top drivers', price: 400, icon: 'car-sport', color: '#8B5CF6' },
  { key: 'premium', label: 'Premium', desc: 'Luxury vehicles', price: 800, icon: 'diamond', color: '#f59e0b' },
];

export default function MTaxiScreen() {
  const router = useRouter();
  const { latitude, longitude } = useLocation();
  const [selectedType, setSelectedType] = useState('economy');
  const selected = RIDE_TYPES.find(r => r.key === selectedType)!;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <UnifiedMap latitude={latitude} longitude={longitude} zoom={14}
          markers={[{ id: 'pickup', latitude, longitude, title: 'Pickup', color: '#3b82f6' }]}
          showUserLocation />
      </View>
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose your ride</Text>
        <View style={styles.rideOptions}>
          {RIDE_TYPES.map(type => (
            <TouchableOpacity key={type.key}
              style={[styles.rideCard, selectedType === type.key && { borderColor: type.color, borderWidth: 2 }]}
              onPress={() => setSelectedType(type.key)}>
              <Ionicons name={type.icon as any} size={24} color={type.color} />
              <View style={styles.rideInfo}>
                <Text style={styles.rideLabel}>{type.label}</Text>
                <Text style={styles.rideDesc}>{type.desc}</Text>
              </View>
              <Text style={[styles.ridePrice, { color: type.color }]}>KES {type.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: selected.color }]} onPress={() => router.push({ pathname: '/(mtaxi)/request', params: { rideType: selectedType } })}>
          <Text style={styles.bookBtnText}>Book {selected.label} — KES {selected.price}</Text>
        </TouchableOpacity>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(mtaxi)/request')}>
            <Ionicons name="location" size={20} color="#3b82f6" /><Text style={styles.navText}>Book Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(mtaxi)/tracking')}>
            <Ionicons name="navigate" size={20} color="#94a3b8" /><Text style={styles.navText}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(mtaxi)/driver')}>
            <Ionicons name="car" size={20} color="#94a3b8" /><Text style={styles.navText}>Driver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  bottomSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, marginTop: -20 },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 },
  rideOptions: { gap: 10, marginBottom: 16 },
  rideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  rideInfo: { flex: 1, marginLeft: 12 },
  rideLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  rideDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  ridePrice: { fontSize: 15, fontWeight: '700' },
  bookBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  navItem: { alignItems: 'center', gap: 4 },
  navText: { fontSize: 11, color: '#94a3b8' },
});
