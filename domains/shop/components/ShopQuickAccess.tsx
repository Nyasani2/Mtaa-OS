// domains/shop/components/ShopQuickAccess.tsx
// Shop quick access component for MTAA Shop home
// Imported by: app/(commerce)/shop/index.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

export interface ShopQuickAccessProps {
  actions?: QuickAction[];
  onNavigate?: (route: string) => void;
  recentShops?: { id: string; name: string; type: string }[];
}

const defaultActions: QuickAction[] = [
  { label: 'My Shops', icon: 'storefront-outline', route: 'my-shops', color: '#2563eb' },
  { label: 'Browse', icon: 'search-outline', route: 'browse', color: '#22c55e' },
  { label: 'Create Shop', icon: 'add-circle-outline', route: 'create', color: '#f59e0b' },
  { label: 'Orders', icon: 'cart-outline', route: 'orders', color: '#8b5cf6' },
  { label: 'Favorites', icon: 'heart-outline', route: 'favorites', color: '#ef4444' },
  { label: 'History', icon: 'time-outline', route: 'history', color: '#6b7280' },
];

export default function ShopQuickAccess({ actions = defaultActions, onNavigate, recentShops }: ShopQuickAccessProps) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>Buy, sell, and manage your business</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={() => onNavigate?.(action.route)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={26} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Shops */}
      {recentShops && recentShops.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Shops</Text>
          {recentShops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              style={styles.recentCard}
              onPress={() => onNavigate?.(`shop/${shop.id}`)}
            >
              <View style={styles.recentIcon}>
                <Ionicons name="storefront-outline" size={22} color="#2563eb" />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{shop.name}</Text>
                <Text style={styles.recentType}>{shop.type}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: '800', color: '#0a0a0a' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  actionCard: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 12, color: '#374151', marginTop: 8, fontWeight: '500', textAlign: 'center' },
  recentSection: { marginTop: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0a0a0a', marginBottom: 12 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recentIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  recentInfo: { flex: 1, marginLeft: 12 },
  recentName: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  recentType: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
