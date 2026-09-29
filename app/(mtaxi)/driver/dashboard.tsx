// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats] = useState({ trips: 0, earnings: 0, rating: 4.8 });

  const toggleOnline = () => {
    if (!isOnline) Alert.alert('Go Online', 'You will start receiving ride requests.');
    setIsOnline(!isOnline);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Driver'}</Text>
          <Text style={styles.subGreeting}>Ready to hit the road?</Text>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineText, isOnline ? { color: '#22c55e' } : { color: '#94a3b8' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: '#334155', true: '#22c55e' }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.trips}</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#22c55e" />
            <Text style={styles.statValue}>KES {stats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtaxi)/driver/requests')}>
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="list-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionText}>Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtaxi)/driver/earnings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#22c55e20' }]}>
              <Ionicons name="wallet-outline" size={24} color="#22c55e" />
            </View>
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtaxi)/driver/profile')}>
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="person-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtaxi)/driver/support')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="help-circle-outline" size={24} color="#ef4444" />
            </View>
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={32} color="#64748b" />
          <Text style={styles.emptyText}>No trips completed yet today.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subGreeting: { color: '#94a3b8', fontSize: 14 },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, marginTop: 12 },
});
