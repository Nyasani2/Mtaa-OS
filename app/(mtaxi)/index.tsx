// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

// Use web-compatible maps if on web, otherwise react-native-maps
const MapView = Platform.OS === 'web' 
  ? require('@teovilla/react-native-web-maps').default
  : require('react-native-maps').default;

const Marker = Platform.OS === 'web'
  ? require('@teovilla/react-native-web-maps').Marker
  : require('react-native-maps').Marker;

const { width } = Dimensions.get('window');

const SERVICE_CARDS = [
  { label: 'Rides', sub: "Let's get moving", icon: 'taxi', color: '#3B82F6', bg: '#EFF6FF', route: '/(mtaxi)/request?serviceType=car' },
  { label: 'Schedule', sub: 'Book ahead', icon: 'calendar-alt', color: '#10B981', bg: '#ECFDF5', route: '/(mtaxi)/schedule' },
  { label: 'Motorbike', sub: '2-wheel rides', icon: 'motorcycle', color: '#8B5CF6', bg: '#F5F3FF', route: '/(mtaxi)/request?serviceType=boda' },
  { label: 'Food', sub: 'Quick delivery', icon: 'hamburger', color: '#F59E0B', bg: '#FFFBEB', route: '/(mtaxi)/request?serviceType=delivery' },
  { label: 'Send', sub: 'Send or receive', icon: 'box', color: '#EF4444', bg: '#FEF2F2', route: '/(mtaxi)/request?serviceType=send' },
];

export default function MTaxiHub() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recentPlaces, setRecentPlaces] = useState<any[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    setRecentPlaces([
      { name: 'Home', address: 'Lavington, Nairobi', icon: 'home' },
      { name: 'Work', address: 'Upper Hill, Nairobi', icon: 'briefcase' },
    ]);
    fetchNearbyDrivers();
  }, []);

  const fetchNearbyDrivers = async () => {
    try {
      const { data: drivers, error } = await supabase
        .from('mtaxi_drivers')
        .select('id, user_id, vehicle_type, vehicle_plate, current_lat, current_lng, rating')
        .eq('is_online', true)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null)
        .limit(20);

      if (!error && drivers) {
        setNearbyDrivers(drivers);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            {nearbyDrivers.map((driver) => (
              driver.current_lat && driver.current_lng && (
                <Marker
                  key={driver.id}
                  coordinate={{ latitude: driver.current_lat, longitude: driver.current_lng }}
                  title={driver.vehicle_type}
                  description={driver.vehicle_plate || ''}
                >
                  <View style={styles.driverMarker}>
                    <Text style={styles.driverEmoji}>
                      {driver.vehicle_type === 'boda' ? '🏍️' : driver.vehicle_type === 'truck' ? '🚛' : '🚗'}
                    </Text>
                  </View>
                </Marker>
              )
            ))}
          </MapView>
          {loadingDrivers && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
          <View style={styles.driversCount}>
            <Text style={styles.driversCountText}>
              {nearbyDrivers.length} {nearbyDrivers.length === 1 ? 'driver' : 'drivers'} nearby
            </Text>
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoIcon}>
            <FontAwesome5 name="tag" size={16} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>15% off 5 rides</Text>
            <TouchableOpacity><Text style={styles.promoLink}>View details</Text></TouchableOpacity>
          </View>
          <TouchableOpacity><Ionicons name="close" size={20} color="#9CA3AF" /></TouchableOpacity>
        </View>

        <Text style={styles.heading}>Your journey begins here.</Text>

        <View style={styles.cardsRow}>
          {SERVICE_CARDS.slice(0, 2).map((card: any) => (
            <TouchableOpacity key={card.label} style={[styles.bigCard, { backgroundColor: card.bg }]} onPress={() => router.push(card.route as any)}>
              <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                <FontAwesome5 name={card.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardSub}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardsRowSmall}>
          {SERVICE_CARDS.slice(2).map((card: any) => (
            <TouchableOpacity key={card.label} style={[styles.smallCard, { backgroundColor: card.bg }]} onPress={() => router.push(card.route as any)}>
              <View style={[styles.cardIconSmall, { backgroundColor: card.color }]}>
                <FontAwesome5 name={card.icon as any} size={18} color="#fff" />
              </View>
              <Text style={styles.cardLabelSmall}>{card.label}</Text>
              <Text style={styles.cardSubSmall}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.whereToBar} onPress={() => router.push('/(mtaxi)/request?serviceType=car' as any)}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <Text style={styles.whereToText}>Where to?</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.laterBtn} onPress={() => router.push('/(mtaxi)/schedule' as any)}>
            <FontAwesome5 name="clock" size={14} color="#374151" style={{ marginRight: 6 }} />
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {recentPlaces.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent</Text>
            {recentPlaces.map((place, idx) => (
              <TouchableOpacity key={idx} style={styles.recentItem}>
                <View style={styles.recentIcon}>
                  <FontAwesome5 name={place.icon} size={16} color="#6B7280" />
                </View>
                <View>
                  <Text style={styles.recentName}>{place.name}</Text>
                  <Text style={styles.recentAddress}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
          <TouchableOpacity onPress={() => router.push('/(mtaxi)/driver/onboarding')} style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>🧑🔧 Become a Driver — earn per ride</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { height: 250, width: '100%', position: 'relative', marginBottom: 16 },
  map: { width: '100%', height: '100%' },
  driverMarker: { backgroundColor: '#fff', padding: 4, borderRadius: 20, borderWidth: 2, borderColor: '#3B82F6', elevation: 5 },
  driverEmoji: { fontSize: 18 },
  loadingOverlay: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', padding: 8, borderRadius: 8, elevation: 5 },
  driversCount: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(59, 130, 246, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  driversCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  promoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', margin: 16, padding: 12, borderRadius: 12 },
  promoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  promoLink: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111827', marginHorizontal: 16, marginTop: 8 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16, gap: 10 },
  bigCard: { flex: 1, borderRadius: 16, padding: 16, minHeight: 100 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardsRowSmall: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 10, gap: 10 },
  smallCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  cardIconSmall: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardLabelSmall: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardSubSmall: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  whereToBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 },
  whereToText: { fontSize: 16, fontWeight: '600', color: '#374151', marginLeft: 10 },
  laterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  laterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  recentSection: { marginTop: 20, paddingHorizontal: 16 },
  recentTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  recentAddress: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
