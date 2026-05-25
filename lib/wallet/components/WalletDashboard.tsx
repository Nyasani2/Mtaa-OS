// lib/wallet/components/WalletDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWalletStore } from '@/hooks/useWalletStore';

export function WalletDashboard() {
  const { wallet, transactions, loading } = useWalletStore();

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balance}>KES {wallet?.balance?.toLocaleString() ?? '0'}</Text>
        <Text style={styles.currency}>{wallet?.currency ?? 'KES'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions yet</Text>
      ) : (
        transactions.slice(0, 5).map((tx, i) => (
          <View key={i} style={styles.txRow}>
            <Text style={styles.txDesc}>{tx.description ?? 'Transaction'}</Text>
            <Text style={[styles.txAmount, tx.type === 'credit' ? styles.credit : styles.debit]}>
              {tx.type === 'credit' ? '+' : '-'} KES {tx.amount}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default WalletDashboard;

const styles = StyleSheet.create({
  container: { padding: 16 },
  balanceCard: { backgroundColor: '#1e40af', padding: 20, borderRadius: 12, marginBottom: 20 },
  balanceLabel: { color: '#93c5fd', fontSize: 14 },
  balance: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  currency: { color: '#93c5fd', fontSize: 14, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#9ca3af', fontStyle: 'italic' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  txDesc: { fontSize: 14, color: '#374151' },
  txAmount: { fontSize: 14, fontWeight: '600' },
  credit: { color: '#059669' },
  debit: { color: '#dc2626' },
});
