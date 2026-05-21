// app/(os)/settings/payment-methods.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/lib/wallet/store';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { paymentMethods, loadPaymentMethods, addPaymentMethod, isLoading, error, selectedAccount } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedAccount?.id) {
      loadPaymentMethods(selectedAccount.id);
    }
  }, [selectedAccount]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedAccount?.id) await loadPaymentMethods(selectedAccount.id);
    setRefreshing(false);
  };

  const getMethodIcon = (type: string) => {
    const icons: Record<string, string> = {
      mobile_money: 'phone-portrait',
      bank_transfer: 'business',
      card: 'card',
      crypto: 'logo-bitcoin',
      cash: 'cash',
    };
    return icons[type] || 'card';
  };

  const getMethodColor = (type: string) => {
    const colors: Record<string, string> = {
      mobile_money: '#10B981',
      bank_transfer: '#3B82F6',
      card: '#8B5CF6',
      crypto: '#F59E0B',
      cash: '#64748B',
    };
    return colors[type] || '#3B82F6';
  };

  const renderMethod = ({ item }: { item: any }) => (
    <View style={styles.methodCard}>
      <View style={[styles.methodIcon, { backgroundColor: getMethodColor(item.method_type) + '15' }]}>
        <Ionicons name={getMethodIcon(item.method_type) as any} size={24} color={getMethodColor(item.method_type)} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{item.account_name || item.provider}</Text>
        <Text style={styles.methodDetail}>{item.phone_number || item.account_number || 'No details'}</Text>
        <View style={styles.methodBadges}>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: item.is_verified ? '#D1FAE5' : '#FEF3C7' }]}>
            <Text style={[styles.statusText, { color: item.is_verified ? '#10B981' : '#F59E0B' }]}>
              {item.is_verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => Alert.alert('Options', 'Edit or remove this payment method')}>
        <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => router.push('/settings/add-payment-method' as any)}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {isLoading && paymentMethods.length === 0 ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderMethod}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No payment methods yet</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/settings/add-payment-method' as any)}>
                <Text style={styles.addButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  methodIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  methodDetail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  methodBadges: { flexDirection: 'row', gap: 8, marginTop: 8 },
  defaultBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultText: { fontSize: 10, fontWeight: '600', color: '#3B82F6' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12, marginBottom: 20 },
  addButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
