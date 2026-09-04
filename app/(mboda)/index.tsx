// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { getWalletBalance } from '@/lib/transport/services/ride.service';

export default function MBodaScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address, loading: locLoading } = useLocation();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getWalletBalance(user.id).then((b: any) => {
        setBalance(Number(b.available_balance || 0));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const bookBoda = () => {
    // Navigate to MTaxi request with boda pre-selected
    // We pass state via router params
    router.push({
      pathname: '/(mtaxi)/request',
      params: { initialType: 'boda' },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🏍️ MBoda</Text>
      <Text style={styles.sub}>Beat the traffic. Fast, affordable motorcycle rides.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>📍 Your Location</Text>
        <Text style={styles.value}>{locLoading ? 'Locating...' : address || 'Location unknown'}</Text>
        {position && (
          <Text style={styles.coords}>{position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>💳 Wallet Balance</Text>
        {loading ? (
          <ActivityIndicator color="#e94560" />
        ) : (
          <Text style={styles.balance}>KES {balance.toLocaleString()}</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why Boda?</Text>
        <Text style={styles.infoItem}>⚡ Faster through traffic</Text>
        <Text style={styles.infoItem}>💰 Lower fares — base KES 30, KES 20/km</Text>
        <Text style={styles.infoItem}>🛵 Dedicated boda drivers</Text>
        <Text style={styles.infoItem}>🪖 Helmet included</Text>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={bookBoda}>
        <Text style={styles.bookText}>Book Boda Now</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(mtaxi)/history' as any)}>
        <Text style={styles.secondaryText}>View Ride History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub: { color: '#8892b0', fontSize: 14, marginBottom: 20 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 15 },
  coords: { color: '#555', fontSize: 11, marginTop: 4 },
  balance: { color: '#e94560', fontSize: 24, fontWeight: '800' },
  infoCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoItem: { color: '#8892b0', fontSize: 13, marginBottom: 6 },
  bookBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 10 },
  bookText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  secondaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
