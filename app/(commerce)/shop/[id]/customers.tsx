import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShopOrders } from '@/domains/shop/hooks/useShop';

interface Customer {
  id: string; name: string; phone?: string;
  order_count: number; total_spent: number; last_order: string;
}

export default function ShopCustomersScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders } = useShopOrders(shopId);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!orders) return;
    const map = new Map<string, Customer>();
    orders.forEach((order: any) => {
      const cid = order.customer_id;
      if (!cid) return;
      const existing = map.get(cid);
      if (existing) {
        existing.order_count += 1;
        existing.total_spent += order.total_amount || 0;
        if (new Date(order.created_at) > new Date(existing.last_order)) existing.last_order = order.created_at;
      } else {
        map.set(cid, {
          id: cid, name: order.customer_name || 'Customer', phone: order.customer_phone,
          order_count: 1, total_spent: order.total_amount || 0, last_order: order.created_at,
        });
      }
    });
    setCustomers(Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent));
  }, [orders]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSub}>{customers.length} total customers</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="Search customers..." value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.customerCard} onPress={() => router.push(`/(os)/messenger?to=${item.id}` as any)}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerMeta}>{item.order_count} orders · ${item.total_spent.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.messageBtn} onPress={() => router.push(`/(os)/messenger?to=${item.id}` as any)}>
              <Text style={styles.messageBtnText}>💬</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySub}>Customers appear here after their first order</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  customerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  customerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  customerMeta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  messageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { fontSize: 18 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
