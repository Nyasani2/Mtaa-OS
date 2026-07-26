import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useLocation } from '@/lib/hooks/useLocation';

export default function BodaScreen() {
  const router = useRouter();
  const { latitude, longitude } = useLocation();

  const prices = { solo: 100, shared: 50 };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <UnifiedMap latitude={latitude} longitude={longitude} zoom={15}
          markers={[{ id: 'user', latitude, longitude, title: 'You are here', color: '#8B5CF6' }]}
          showUserLocation />
      </View>
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Book Boda</Text>
        <Text style={styles.subtitle}>Fast, affordable motorcycle rides</Text>
        <View style={styles.rideOptions}>
          <TouchableOpacity style={[styles.rideCard, { borderColor: '#8B5CF6' }]} onPress={() => router.push({ pathname: '/(boda)/request', params: { rideType: 'solo' } })}>
            <Ionicons name="bicycle" size={28} color="#8B5CF6" />
            <View style={styles.rideInfo}>
              <Text style={styles.rideLabel}>Solo Boda</Text>
              <Text style={styles.rideDesc}>Just for you · Helmet included</Text>
            </View>
            <Text style={styles.ridePrice}>KES {prices.solo}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rideCard} onPress={() => router.push({ pathname: '/(boda)/request', params: { rideType: 'shared' } })}>
            <Ionicons name="people" size={28} color="#3b82f6" />
            <View style={styles.rideInfo}>
              <Text style={styles.rideLabel}>Shared Boda</Text>
              <Text style={styles.rideDesc}>Split the ride · Save money</Text>
            </View>
            <Text style={styles.ridePrice}>KES {prices.shared}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(boda)/request')}>
          <Text style={styles.bookBtnText}>Book Boda Ride</Text>
        </TouchableOpacity>

        {/* Onboarding CTA */}
        <TouchableOpacity style={styles.onboardBtn} onPress={() => router.push('/(boda)/onboarding' as any)}>
          <Ionicons name="bicycle" size={18} color="#8B5CF6" />
          <Text style={styles.onboardText}>Become a Boda Rider</Text>
          <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  bottomSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, marginTop: -20 },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 16 },
  rideOptions: { gap: 10, marginBottom: 20 },
  rideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  rideInfo: { flex: 1, marginLeft: 12 },
  rideLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  rideDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  ridePrice: { fontSize: 16, fontWeight: '700', color: '#8B5CF6' },
  bookBtn: { backgroundColor: '#8B5CF6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  onboardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#334155', gap: 8,
  },
  onboardText: { color: '#8B5CF6', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'center' },
});
