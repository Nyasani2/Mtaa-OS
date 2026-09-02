// @ts-nocheck
// app/(os)/wallet/transactions.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletTransactions } from 'app/(os)/wallet/hooks';

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, isLoading, error } = useWalletTransactions(100);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color="#00d4ff" /></View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.txItem}>
      <View style={styles.txIcon}>
        <Ionicons name={item.type === 'send' ? 'send' : item.type === 'deposit' ? 'add-circle' : item.type === 'withdrawal' ? 'arrow-down' : 'swap-horizontal'} size={20} color={item.type === 'send' || item.type === 'withdrawal' ? '#ff4444' : '#00d4ff'} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{item.type?.toUpperCase()}</Text>
        <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
      </View>
      <View style={styles.txAmountCol}>
        <Text style={[styles.txAmount, item.type === 'send' || item.type === 'withdrawal' ? styles.txNegative : styles.txPositive]}>
          {item.type === 'send' || item.type === 'withdrawal' ? '-' : '+'}{item.currency} {item.amount?.toLocaleString()}
        </Text>
        <Text style={[styles.txStatus, item.status === 'completed' ? styles.statusCompleted : item.status === 'failed' ? styles.statusFailed : styles.statusPending]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 24 }} />
      </View>
      {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  errorBanner: { backgroundColor: '#ff444422', padding: 12, margin: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ff444444' },
  errorText: { color: '#ff4444', fontSize: 12, textAlign: 'center' },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txType: { color: '#fff', fontSize: 13, fontWeight: '600' },
  txDate: { color: '#666', fontSize: 11, marginTop: 2 },
  txDesc: { color: '#888', fontSize: 11, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '600' },
  txNegative: { color: '#ff4444' },
  txPositive: { color: '#00d4ff' },
  txStatus: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  statusCompleted: { color: '#00ff88' },
  statusFailed: { color: '#ff4444' },
  statusPending: { color: '#f59e0b' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#444', fontSize: 14, marginTop: 8 },
});

