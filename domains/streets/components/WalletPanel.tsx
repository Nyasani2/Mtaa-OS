import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useWallet } from '../hooks/useWallet';

export function WalletPanel() {
  const { balance, transactions, isLoading, showTopUp, setShowTopUp, topUpAmount, setTopUpAmount, topUp, withdraw } = useWallet();

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.txRow}>
      <View>
        <Text style={styles.txType}>{item.type}</Text>
        <Text style={styles.txDate}>{item.createdAt}</Text>
      </View>
      <Text style={[styles.txAmount, item.amount > 0 ? styles.positive : styles.negative]}>
        {item.amount > 0 ? '+' : ''}{item.amount}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>${balance?.toFixed(2) || '0.00'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => setShowTopUp(true)}>
            <Text style={styles.actionText}>➕ Top Up</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => withdraw.mutate(10)}>
            <Text style={styles.actionText}>➖ Withdraw</Text>
          </Pressable>
        </View>
      </View>

      {showTopUp && (
        <View style={styles.topUpBox}>
          <TextInput
            style={styles.topUpInput}
            placeholder="Amount"
            keyboardType="numeric"
            value={topUpAmount}
            onChangeText={setTopUpAmount}
          />
          <Pressable onPress={() => topUp.mutate({ amount: parseFloat(topUpAmount), method: 'card' })}>
            <Text style={styles.confirmBtn}>Confirm</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Transactions</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  balanceCard: { backgroundColor: '#E91E63', padding: 20, borderRadius: 12, margin: 16 },
  balanceLabel: { color: '#fff', opacity: 0.8, fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginVertical: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
  topUpBox: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  topUpInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  confirmBtn: { color: '#E91E63', fontWeight: '700', padding: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', padding: 16 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  txType: { fontWeight: '600' },
  txDate: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontWeight: '700' },
  positive: { color: '#4CAF50' },
  negative: { color: '#E91E63' },
});
