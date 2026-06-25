import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface Transaction {
  id: string;
  type: 'tip' | 'gift' | 'payout' | 'revenue';
  amount: number;
  description: string;
  date: string;
}

const MOCK_TXNS: Transaction[] = [
  { id: '1', type: 'tip', amount: 5.00, description: 'Tip from @user1', date: '2026-06-24' },
  { id: '2', type: 'gift', amount: 12.50, description: 'Live gift - Diamond', date: '2026-06-23' },
  { id: '3', type: 'revenue', amount: 45.00, description: 'Creator fund payout', date: '2026-06-22' },
  { id: '4', type: 'payout', amount: -30.00, description: 'Withdrawal to bank', date: '2026-06-20' },
];

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(127.50);

  const openWallet = useCallback(() => {
    router.push('/(os)/wallet');
  }, [router]);

  const renderTxn = (txn: Transaction) => (
    <View key={txn.id} style={styles.txnRow}>
      <View style={[styles.txnIcon, { backgroundColor: txn.amount > 0 ? '#0d2b1a' : '#2b0d0d' }]}>
        <Ionicons
          name={
            txn.type === 'tip' ? 'heart' :
            txn.type === 'gift' ? 'gift' :
            txn.type === 'revenue' ? 'trending-up' : 'cash'
          }
          size={18}
          color={txn.amount > 0 ? '#4CAF50' : '#ff4444'}
        />
      </View>
      <View style={styles.txnBody}>
        <Text style={styles.txnDesc}>{txn.description}</Text>
        <Text style={styles.txnDate}>{txn.date}</Text>
      </View>
      <Text style={[styles.txnAmount, txn.amount > 0 ? styles.txnIn : styles.txnOut]}>
        {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets Wallet</Text>
        <TouchableOpacity onPress={openWallet} style={styles.backBtn}>
          <Ionicons name="wallet" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={openWallet}>
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openWallet}>
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.actionText}>Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openWallet}>
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Creator Revenue</Text>
      <View style={styles.revenueGrid}>
        <TouchableOpacity style={styles.revenueCard} onPress={openWallet}>
          <Ionicons name="heart" size={24} color="#ff4444" />
          <Text style={styles.revenueLabel}>Tips</Text>
          <Text style={styles.revenueValue}>$45.00</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.revenueCard} onPress={openWallet}>
          <Ionicons name="gift" size={24} color="#FFD700" />
          <Text style={styles.revenueLabel}>Live Gifts</Text>
          <Text style={styles.revenueValue}>$32.50</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.revenueCard} onPress={openWallet}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.revenueLabel}>Payouts</Text>
          <Text style={styles.revenueValue}>$50.00</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {MOCK_TXNS.map(renderTxn)}

      {/* Connect to MTAA Wallet */}
      <TouchableOpacity style={styles.connectBtn} onPress={openWallet}>
        <Ionicons name="wallet" size={20} color="#fff" />
        <Text style={styles.connectText}>Open MTAA Wallet</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  balanceCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: { color: '#888', fontSize: 14 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 4 },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  revenueLabel: { color: '#888', fontSize: 12, marginTop: 6 },
  revenueValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnBody: { flex: 1 },
  txnDesc: { color: '#fff', fontSize: 14 },
  txnDate: { color: '#666', fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  txnIn: { color: '#4CAF50' },
  txnOut: { color: '#ff4444' },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  connectText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
