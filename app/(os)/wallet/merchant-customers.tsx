// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, TextInput, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_spent: number;
  transaction_count: number;
  last_visit: string;
  loyalty_points: number;
}

export default function MerchantCustomersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get business transactions and derive customers
      const { data: txs } = await supabase
        .from('business_transactions')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      // Aggregate by customer
      const customerMap = new Map<string, Customer>();
      (txs || []).forEach(tx => {
        const cid = tx.customer_id || tx.buyer_id || 'unknown';
        const existing = customerMap.get(cid);
        if (existing) {
          existing.total_spent += tx.amount || 0;
          existing.transaction_count += 1;
          if (new Date(tx.created_at) > new Date(existing.last_visit)) {
            existing.last_visit = tx.created_at;
          }
        } else {
          customerMap.set(cid, {
            id: cid,
            name: tx.customer_name || 'Customer ' + cid.slice(0, 6),
            email: tx.customer_email || null,
            phone: tx.customer_phone || null,
            total_spent: tx.amount || 0,
            transaction_count: 1,
            last_visit: tx.created_at,
            loyalty_points: 0,
          });
        }
      });

      const list = Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(list);
      setFiltered(list);
    } catch (err) {
      console.error('Customers error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(customers);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(customers.filter((c: any) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.phone?.includes(q))
      ));
    }
  }, [searchQuery, customers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }, [fetchCustomers]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.phone && <Text style={styles.customerMeta}>{item.phone}</Text>}
          {item.email && <Text style={styles.customerMeta}>{item.email}</Text>}
        </View>
        <View style={styles.customerStats}>
          <Text style={styles.customerSpent}>KES {item.total_spent.toLocaleString()}</Text>
          <Text style={styles.customerTxns}>{item.transaction_count} orders</Text>
        </View>
      </View>
      <View style={styles.customerFooter}>
        <Text style={styles.footerText}>Last visit: {formatDate(item.last_visit)}</Text>
        <View style={styles.loyaltyBadge}>
          <Text style={styles.loyaltyText}>{item.loyalty_points} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSubtitle}>{customers.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderCustomer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>No customers yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 10 },
  listContent: { padding: 16, paddingBottom: 40 },
  customerCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  customerHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  customerMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  customerStats: { alignItems: 'flex-end' },
  customerSpent: { fontSize: 14, fontWeight: '700', color: '#22C55E' },
  customerTxns: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  customerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2C2C2E' },
  footerText: { fontSize: 12, color: '#8E8E93' },
  loyaltyBadge: { backgroundColor: '#8B5CF620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  loyaltyText: { fontSize: 11, fontWeight: '600', color: '#8B5CF6' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },
});
