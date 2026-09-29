// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function MTruckDriverDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats] = useState({ activeHauls: 1, totalEarnings: 15400, rating: 4.9 });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Driver'}</Text>
          <Text style={styles.subGreeting}>MTruck Fleet Command</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={36} color="#84cc16" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainStatCard}>
          <Text style={styles.mainStatLabel}>Total Earnings (This Month)</Text>
          <Text style={styles.mainStatValue}>KES {stats.totalEarnings.toLocaleString()}</Text>
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Ionicons name="cube-outline" size={20} color="#84cc16" />
              <Text style={styles.miniStatText}>{stats.activeHauls} Active Hauls</Text>
            </View>
            <View style={styles.miniStat}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.miniStatText}>{stats.rating} Rating</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Fleet Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtruck)/driver/hauls')}>
            <View style={[styles.actionIcon, { backgroundColor: '#84cc1620' }]}>
              <Ionicons name="trail-sign-outline" size={28} color="#84cc16" />
            </View>
            <Text style={styles.actionText}>My Hauls</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtruck)/driver/earnings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="cash-outline" size={28} color="#3b82f6" />
            </View>
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtruck)/driver/vehicle')}>
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="bus-outline" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.actionText}>My Truck</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(mtruck)/driver/support')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="help-circle-outline" size={28} color="#ef4444" />
            </View>
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Current Assignment</Text>
        <View style={styles.haulCard}>
          <View style={styles.haulHeader}>
            <Text style={styles.haulId}>HAUL #88392</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#84cc1620' }]}>
              <Text style={[styles.statusText, { color: '#84cc16' }]}>In Transit</Text>
            </View>
          </View>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <Ionicons name="location" size={18} color="#84cc16" />
              <Text style={styles.routeText}>Nairobi Depot</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <Ionicons name="flag" size={18} color="#ef4444" />
              <Text style={styles.routeText}>Mombasa Port</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push('/(mtruck)/driver/hauls')}>
            <Text style={styles.detailsText}>View Full Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#84cc16" />
          </TouchableOpacity>
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
  profileBtn: { padding: 4 },
  content: { flex: 1, paddingHorizontal: 16 },
  mainStatCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#84cc1640' },
  mainStatLabel: { color: '#94a3b8', fontSize: 14 },
  mainStatValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: 8 },
  miniStats: { flexDirection: 'row', gap: 24, marginTop: 8 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniStatText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  haulCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16 },
  haulHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  haulId: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  routeContainer: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { color: '#e2e8f0', fontSize: 15, flex: 1 },
  routeLine: { width: 2, height: 24, backgroundColor: '#334155', marginLeft: 8, marginVertical: 4 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#84cc1620', borderRadius: 10 },
  detailsText: { color: '#84cc16', fontSize: 14, fontWeight: '600' },
});
