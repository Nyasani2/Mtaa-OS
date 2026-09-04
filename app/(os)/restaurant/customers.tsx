import React, { useState, useEffect } from 'react';
// ============================================================================
// MTAA Restaurant Module — Customers & Loyalty Screen
// ============================================================================

import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';

export default function RestaurantCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'loyalty'>('customers');

  // In real implementation, fetch from Supabase restaurant_customers + restaurant_loyalty
  const loadCustomers = async () => {
    // const { data } = await supabase.from('restaurant_customers').select('*').limit(50);
    // setCustomers(data || []);
  };

  useEffect(() => { loadCustomers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['customers', 'loyalty'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'customers' ? '👥 Customers' : '⭐ Loyalty'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'customers' ? (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>{(item.name || '?').charAt(0)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.name || 'Guest'}</Text>
                <Text style={styles.customerPhone}>{item.phone || 'No phone'}</Text>
                <Text style={styles.customerEmail}>{item.email || 'No email'}</Text>
              </View>
              <View style={styles.customerStats}>
                <Text style={styles.statValue}>{item.total_orders || 0}</Text>
                <Text style={styles.statLabel}>orders</Text>
                <Text style={[styles.statValue, { color: '#10B981', marginTop: 4 }]}>
                  £{(item.total_spent || 0).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>spent</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No customers yet</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.loyaltyContainer}>
          <View style={styles.loyaltyCard}>
            <Text style={styles.loyaltyTitle}>Loyalty Program</Text>
            <Text style={styles.loyaltySubtitle}>Points per £1 spent: 1</Text>
            <Text style={styles.loyaltySubtitle}>Redemption: 100 points = £1</Text>
          </View>
          <FlatList
            data={customers.filter((c: any) => (c.loyalty_points || 0) > 0)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.loyaltyRow}>
                <Text style={styles.loyaltyName}>{item.name}</Text>
                <View style={styles.loyaltyBadge}>
                  <Text style={styles.loyaltyPoints}>{item.loyalty_points || 0} pts</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No loyalty members yet</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  searchBar: { padding: 12, backgroundColor: '#FFFFFF' },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  tabBar: { flexDirection: 'row', padding: 4, backgroundColor: '#FFFFFF' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#1F2937' },
  tabText: { fontSize: 13, color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  list: { padding: 12 },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  customerPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  customerEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  customerStats: { alignItems: 'flex-end' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  loyaltyContainer: { flex: 1 },
  loyaltyCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loyaltyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  loyaltySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  loyaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 12,
  },
  loyaltyName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  loyaltyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loyaltyPoints: { fontSize: 14, fontWeight: 'bold', color: '#92400E' },
});
