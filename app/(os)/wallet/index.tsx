// app/(os)/wallet/index.tsx — My Wallet (full feature dashboard)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/hooks/useWalletStore';
import { supabase } from '@/lib/supabase/config';

export default function WalletHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const wallet = useWalletStore();

  const balance = dbBalance ?? wallet.balance ?? 0;
  const heldBalance = wallet.heldBalance ?? 0;
  const currency = wallet.currency ?? 'KES';
  const loading = wallet.loading ?? false;
  const transactions = dbTx.length ? dbTx : (wallet.transactions ?? []);

  const [refreshing, setRefreshing] = useState(false);
  const [dbBalance, setDbBalance] = useState<number | null>(null);
  const [dbTx, setDbTx] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!user?.id) return;
      const { data: w } = await supabase
        .from('wallet_accounts').select('balance').eq('user_id', user.id).limit(1).maybeSingle();
      const { data: wt } = await supabase
        .from('wallet_transactions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5);
      const { data: mt } = await supabase
        .from('mpesa_transactions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5);
      if (!alive) return;
      if (w) setDbBalance(Number(w.balance) || 0);
      setDbTx([
        ...(wt || []).map((t: any) => ({ id: t.id, type: t.direction || t.transaction_type || 'credit', description: t.description || 'Wallet transaction', created_at: t.created_at, amount: t.amount })),
        ...(mt || []).map((t: any) => ({ id: t.id, type: 'deposit', description: ('M-Pesa Deposit ' + (t.mpesa_receipt || '')).trim(), created_at: t.created_at, amount: t.amount })),
      ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5));
    };
    load();
    const iv = setInterval(load, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await wallet.loadWallet?.(user.id);
      await wallet.loadTransactions?.(user.id, 5);
    }
    setRefreshing(false);
  }, [user, wallet]);

  useEffect(() => {
    if (user?.id) {
      wallet.loadWallet?.(user.id);
      wallet.loadTransactions?.(user.id, 5);
    }
  }, [user]);

  const quickActions = [
    { label: 'Send', icon: 'arrow-up', color: '#007AFF', route: '/(os)/wallet/send' },
    { label: 'Withdraw', icon: 'arrow-down', color: '#34C759', route: '/(os)/wallet/withdraw' },
    { label: 'Deposit', icon: 'download', color: '#5856D6', route: '/(os)/wallet/deposit' },
    { label: 'History', icon: 'time', color: '#FF9500', route: '/(os)/wallet/history' },
  ];

  const services = [
    { label: 'Agent', icon: 'people', color: '#34C759', route: '/(os)/wallet/agent' },
    { label: 'Agent Map', icon: 'map', color: '#34C759', route: '/(os)/wallet/agent-map' },
    { label: 'Banks', icon: 'business', color: '#007AFF', route: '/(os)/wallet/banks' },
    { label: 'Cards', icon: 'card', color: '#007AFF', route: '/(os)/wallet/cards' },
    { label: 'Regulatory', icon: 'document-text', color: '#FF9500', route: '/(os)/wallet/regulatory' },
    { label: 'Central Bank', icon: 'globe', color: '#5856D6', route: '/(os)/wallet/treasury-hub' },
    { label: 'Credit', icon: 'trending-up', color: '#AF52DE', route: '/(os)/wallet/credit' },
    { label: 'Escrow', icon: 'lock-closed', color: '#FF3B30', route: '/(os)/wallet/escrow' },
    { label: 'Savings', icon: 'wallet', color: '#34C759', route: '/(os)/wallet/savings-hub' },
    { label: 'GoFund', icon: 'heart', color: '#FF2D55', route: '/(os)/wallet/gofund-hub' },
    { label: 'Tax', icon: 'calculator', color: '#FF3B30', route: '/(os)/wallet/tax-hub' },
    { label: 'Business', icon: 'briefcase', color: '#5AC8FA', route: '/(os)/wallet/business' },
    { label: 'Merchant', icon: 'storefront', color: '#5AC8FA', route: '/(os)/wallet/merchant-dashboard' },
    { label: 'QR Pay', icon: 'qr-code', color: '#007AFF', route: '/(os)/wallet/qr' },
    { label: 'Rewards', icon: 'gift', color: '#FF9500', route: '/(os)/wallet/rewards' },
    { label: 'Crypto', icon: 'logo-bitcoin', color: '#FF9500', route: '/(os)/wallet/crypto' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/settings')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{currency} {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        {heldBalance > 0 && (
          <Text style={styles.heldText}>Held: {currency} {heldBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickBtn}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/history')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading && transactions.length === 0 ? (
        <ActivityIndicator color="#007AFF" style={{ marginVertical: 20 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={40} color="#8E8E93" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <View style={styles.txCard}>
          {transactions.slice(0, 5).map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' || tx.type === 'deposit' ? '#34C75920' : '#FF3B3020' }]}>
                <Ionicons
                  name={tx.type === 'credit' || tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={tx.type === 'credit' || tx.type === 'deposit' ? '#34C759' : '#FF3B30'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{tx.description || tx.type}</Text>
                <Text style={styles.txDate}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' || tx.type === 'deposit' ? '#34C759' : '#FF3B30' }]}>
                {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}{currency} {tx.amount?.toLocaleString('en-KE')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Services Grid */}
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Services</Text>
      <View style={styles.grid}>
        {services.map((svc) => (
          <TouchableOpacity
            key={svc.label}
            style={styles.gridItem}
            onPress={() => router.push(svc.route as any)}
          >
            <View style={[styles.gridIcon, { backgroundColor: svc.color + '20' }]}>
              <Ionicons name={svc.icon as any} size={22} color={svc.color} />
            </View>
            <Text style={styles.gridLabel}>{svc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  balanceCard: {
    backgroundColor: '#1C1C1E', borderRadius: 20, marginHorizontal: 16,
    padding: 24, alignItems: 'center', marginBottom: 16
  },
  balanceLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff' },
  heldText: { fontSize: 13, color: '#8E8E93', marginTop: 6 },
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 24
  },
  quickBtn: { width: '23%', alignItems: 'center' },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  quickLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#1C1C1E', borderRadius: 16, marginHorizontal: 16,
    padding: 40, alignItems: 'center', marginBottom: 16
  },
  emptyText: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  txCard: {
    backgroundColor: '#1C1C1E', borderRadius: 16, marginHorizontal: 16,
    padding: 16, marginBottom: 16
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2C2C2E'
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  txDesc: { fontSize: 15, fontWeight: '600', color: '#fff' },
  txDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingBottom: 40
  },
  gridItem: {
    width: '25%', alignItems: 'center', paddingVertical: 14
  },
  gridIcon: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6
  },
  gridLabel: { fontSize: 11, color: '#fff', fontWeight: '500', textAlign: 'center' },
});
