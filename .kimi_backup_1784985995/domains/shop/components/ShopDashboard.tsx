// domains/shop/components/ShopDashboard.tsx
// Main shop dashboard — overview of shop health, sales, inventory, wallet
// Fixed: wallet section now uses canonical useWalletBalance

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShop, useShopProducts, useShopOrders } from '@/domains/shop/hooks/useShop';
import { useWalletBalance } from '@/domains/wallet/hooks/useWallet';
import { Ionicons } from '@expo/vector-icons';

interface ShopDashboardProps {
  shopId: string;
}

export default function ShopDashboard({ shopId }: ShopDashboardProps) {
  const router = useRouter();
  const { shop, loading: shopLoading, error: shopError, refresh: refreshShop } = useShop(shopId);
  const { products, loading: productsLoading, refresh: refreshProducts } = useShopProducts(shopId);
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useShopOrders(shopId);
  const { balance, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useWalletBalance();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshShop(),
      refreshProducts(),
      refreshOrders(),
      refreshBalance(),
    ]);
    setRefreshing(false);
  }, [refreshShop, refreshProducts, refreshOrders, refreshBalance]);

  const formatCurrency = (amount: number, currency = 'KES') => {
    return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
  };

  const totalRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) < 10).length;

  const quickActions = [
    { label: 'POS', icon: 'cart', route: `/(commerce)/shop/${shopId}/pos`, color: '#007AFF' },
    { label: 'Orders', icon: 'list', route: `/(commerce)/shop/${shopId}/orders`, color: '#34C759' },
    { label: 'Products', icon: 'cube', route: `/(commerce)/shop/${shopId}/products`, color: '#FF9500' },
    { label: 'Wallet', icon: 'wallet', route: `/(commerce)/shop/${shopId}/wallet`, color: '#5856D6' },
    { label: 'Analytics', icon: 'bar-chart', route: `/(commerce)/shop/${shopId}/analytics`, color: '#AF52DE' },
    { label: 'Settings', icon: 'settings', route: `/(commerce)/shop/${shopId}/settings`, color: '#8E8E93' },
  ];

  if (shopLoading && !shop) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading shop...</Text>
      </View>
    );
  }

  if (shopError && !shop) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{shopError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refreshShop}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Shop Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.shopName}>{shop?.name || 'My Shop'}</Text>
          <Text style={styles.shopStatus}>{shop?.status === 'active' ? '● Active' : '● Inactive'}</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/(commerce)/shop/${shopId}/settings`)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <TouchableOpacity
        style={styles.walletCard}
        onPress={() => router.push(`/(commerce)/shop/${shopId}/wallet`)}
      >
        <View style={styles.walletHeader}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.walletAmount}>
          {balanceLoading ? '...' : formatCurrency(balance?.available || 0, balance?.currency)}
        </Text>
        {balanceError ? (
          <Text style={styles.walletError}>Tap to retry</Text>
        ) : balance?.pending ? (
          <Text style={styles.walletPending}>Pending: {formatCurrency(balance.pending, balance.currency)}</Text>
        ) : null}
      </TouchableOpacity>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{orders.length}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, pendingOrders > 0 && styles.warningValue]}>{pendingOrders}</Text>
          <Text style={styles.metricLabel}>Pending</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, lowStockProducts > 0 && styles.dangerValue]}>{lowStockProducts}</Text>
          <Text style={styles.metricLabel}>Low Stock</Text>
        </View>
      </View>

      {/* Inventory Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/inventory`)}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionMeta}>{products.length} products · {productsLoading ? '...' : 'loaded'}</Text>
        {lowStockProducts > 0 && (
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={14} color="#FF9500" />
            <Text style={styles.alertText}>{lowStockProducts} products running low</Text>
          </View>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/orders`)}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {ordersLoading && orders.length === 0 ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={32} color="#C7C7CC" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push(`/(commerce)/shop/${shopId}/pos`)}
            >
              <Text style={styles.emptyCtaText}>Open POS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.slice(0, 5).map(order => (
            <View key={order.id} style={styles.orderRow}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.orderAmount}>{formatCurrency(order.total_amount || 0)}</Text>
              <View style={[styles.statusBadge, styles[`status_${order.status}`] || styles.status_pending]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionBtn}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#8E8E93' },
  errorText: { marginTop: 12, fontSize: 15, color: '#FF3B30', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  shopName: { fontSize: 22, fontWeight: '800', color: '#000' },
  shopStatus: { fontSize: 13, color: '#34C759', marginTop: 4, fontWeight: '600' },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  walletCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  walletAmount: { color: '#fff', fontSize: 32, fontWeight: '800' },
  walletPending: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  walletError: { color: '#FFD60A', fontSize: 13, marginTop: 4 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginRight: '4%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#000' },
  metricLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  warningValue: { color: '#FF9500' },
  dangerValue: { color: '#FF3B30' },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  sectionLink: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  sectionMeta: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },

  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  alertText: { fontSize: 12, color: '#FF9500', marginLeft: 6, fontWeight: '600' },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: '600', color: '#000' },
  orderDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  orderAmount: { fontSize: 14, fontWeight: '700', color: '#000', marginRight: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  status_completed: { backgroundColor: '#E8F5E9' },
  status_paid: { backgroundColor: '#E8F5E9' },
  status_pending: { backgroundColor: '#FFF3E0' },
  status_processing: { backgroundColor: '#E3F2FD' },
  status_cancelled: { backgroundColor: '#FFEBEE' },

  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 15, color: '#8E8E93', marginTop: 8 },
  emptyCta: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionBtn: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, color: '#333', fontWeight: '500' },
});
