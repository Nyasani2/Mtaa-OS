// domains/shop/components/ShopDashboard.tsx
// Shop owner dashboard component
// Imported by: app/(commerce)/shop/[id]/index.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ShopDashboardProps {
  shopId: string;
  shopName?: string;
  analytics?: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    avgOrderValue: number;
  };
  onNavigate?: (screen: string) => void;
}

export default function ShopDashboard({ shopId, shopName, analytics, onNavigate }: ShopDashboardProps) {
  const stats = [
    { label: 'Revenue', value: `KES ${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: 'cash-outline', color: '#22c55e' },
    { label: 'Orders', value: (analytics?.totalOrders || 0).toString(), icon: 'cart-outline', color: '#2563eb' },
    { label: 'Products', value: (analytics?.totalProducts || 0).toString(), icon: 'cube-outline', color: '#f59e0b' },
    { label: 'Customers', value: (analytics?.totalCustomers || 0).toString(), icon: 'people-outline', color: '#8b5cf6' },
  ];

  const actions = [
    { label: 'Products', screen: 'products', icon: 'cube-outline' },
    { label: 'Orders', screen: 'orders', icon: 'list-outline' },
    { label: 'POS', screen: 'pos', icon: 'card-outline' },
    { label: 'Inventory', screen: 'inventory', icon: 'bar-chart-outline' },
    { label: 'Customers', screen: 'customers', icon: 'people-outline' },
    { label: 'Accounting', screen: 'accounting', icon: 'calculator-outline' },
    { label: 'Staff', screen: 'staff', icon: 'person-outline' },
    { label: 'Settings', screen: 'settings', icon: 'settings-outline' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.shopName}>{shopName || 'My Shop'}</Text>
        <Text style={styles.shopId}>ID: {shopId}</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={() => onNavigate?.(action.screen)}
          >
            <Ionicons name={action.icon as any} size={24} color="#2563eb" />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  shopName: { fontSize: 22, fontWeight: '700', color: '#0a0a0a' },
  shopId: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: { width: '50%', padding: 8 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0a0a0a' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0a0a0a', paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 20 },
  actionCard: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 4,
    elevation: 1,
  },
  actionLabel: { fontSize: 12, color: '#374151', marginTop: 8, fontWeight: '500' },
});
