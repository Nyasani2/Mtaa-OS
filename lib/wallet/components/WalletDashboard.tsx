import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/stores/wallet-store';

export function WalletDashboard() {
  const { balance, currency = 'KES', transactions } = useWalletStore();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{currency} {balance?.toLocaleString() || '0.00'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-up" size={20} color="white" />
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-down" size={20} color="white" />
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="swap-horizontal" size={20} color="white" />
            <Text style={styles.actionText}>Swap</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {transactions?.slice(0, 5).map((tx: any, i: number) => (
        <View key={i} style={styles.txRow}>
          <Ionicons name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'credit' ? '#10B981' : '#EF4444'} />
          <View style={styles.txInfo}>
            <Text style={styles.txDesc}>{tx.description || 'Transaction'}</Text>
            <Text style={styles.txDate}>{tx.date || 'Just now'}</Text>
          </View>
          <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#10B981' : '#EF4444' }]}>
            {tx.type === 'credit' ? '+' : '-'}{currency} {tx.amount}
          </Text>
        </View>
      )) || <Text style={styles.empty}>No transactions yet</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  balanceCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, margin: 16 },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  actionBtn: { alignItems: 'center', backgroundColor: '#334155', padding: 12, borderRadius: 12, width: 80 },
  actionText: { color: 'white', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  txInfo: { flex: 1, marginLeft: 12 },
  txDesc: { color: 'white', fontSize: 14 },
  txDate: { color: '#64748B', fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '600' },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 20 },
});
