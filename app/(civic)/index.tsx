// app/(civic)/index.tsx
// MTAA Civic Hub — Gateway to all government services
// Police, Courts, Prisons, Treasury, Health, Revenue, Land

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';

interface CivicApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

const CIVIC_APPS: CivicApp[] = [
  {
    id: 'police',
    name: 'Police',
    description: 'Report incidents, check status, emergency services',
    icon: 'shield',
    route: '/(civic)/police',
    color: '#3B82F6',
  },
  {
    id: 'courts',
    name: 'Courts',
    description: 'Case tracking, filings, judgments, schedules',
    icon: 'hammer',
    route: '/(civic)/courts',
    color: '#8B5CF6',
  },
  {
    id: 'prisons',
    name: 'Prisons',
    description: 'Inmate lookup, visitation, rehabilitation programs',
    icon: 'lock-closed',
    route: '/(civic)/prisons',
    color: '#EF4444',
  },
  {
    id: 'treasury',
    name: 'Treasury',
    description: 'Payments, budgets, financial reports',
    icon: 'cash',
    route: '/(civic)/treasury',
    color: '#10B981',
  },
  {
    id: 'health',
    name: 'Health Authority',
    description: 'Public health, licenses, inspections',
    icon: 'medical',
    route: '/(civic)/health',
    color: '#F59E0B',
  },
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Taxes, duties, collections, compliance',
    icon: 'receipt',
    route: '/(civic)/revenue',
    color: '#EC4899',
  },
  {
    id: 'land',
    name: 'Land Registry',
    description: 'Property records, titles, transfers, disputes',
    icon: 'map',
    route: '/(civic)/land',
    color: '#06B6D4',
    badge: 'New',
  },
];

export default function CivicHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Civic Services</Text>
        <Text style={styles.headerSubtitle}>Government at your fingertips</Text>
      </View>

      {/* User Context */}
      {user && (
        <View style={styles.userCard}>
          <Ionicons name="person-circle" size={40} color="#3B82F6" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.display_name || user.email || 'Citizen'}</Text>
            <Text style={styles.userMeta}>ID: {user.id?.slice(0, 8)}...</Text>
          </View>
        </View>
      )}

      {/* Civic Apps Grid */}
      <View style={styles.grid}>
        {CIVIC_APPS.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            onPress={() => handlePress(app.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${app.color}15` }]}>
              <Ionicons name={app.icon as any} size={28} color={app.color} />
            </View>
            <View style={styles.appInfo}>
              <View style={styles.appHeader}>
                <Text style={styles.appName}>{app.name}</Text>
                {app.badge && (
                  <View style={[styles.badge, { backgroundColor: app.color }]}>
                    <Text style={styles.badgeText}>{app.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.appDesc} numberOfLines={2}>{app.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Banner */}
      <TouchableOpacity style={styles.emergencyBanner} onPress={() => router.push('/(civic)/police' as any)}>
        <Ionicons name="warning" size={24} color="#fff" />
        <View style={styles.emergencyText}>
          <Text style={styles.emergencyTitle}>Emergency?</Text>
          <Text style={styles.emergencySubtitle}>Tap for police emergency services</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 15, color: '#64748B', marginTop: 4 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  userMeta: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  grid: { padding: 16 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: { flex: 1, marginLeft: 14 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  appDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },

  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 14,
  },
  emergencyText: { flex: 1, marginLeft: 14 },
  emergencyTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emergencySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
});
