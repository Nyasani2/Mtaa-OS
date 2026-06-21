// app/(os)/wallet/index.tsx — MTAA Wallet
// v3.1: Uses unified useAuth, reads actual user data

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function WalletScreen() {
  const { user, isAuthenticated, initialize } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadWalletData();
  }, [isAuthenticated, user?.id]);

  async function loadWalletData() {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data: account } = await supabase
        .from('wallet_accounts').select('balance').eq('user_id', user.id).single();
      setBalance(account?.balance || 0);
      const { data: txs } = await supabase
        .from('wallet_transactions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20);
      setTransactions(txs || []);
    } catch (err) { console.error('[Wallet] Load error:', err); }
    finally { setIsLoading(false); setRefreshing(false); }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="wallet-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Wallet Locked</Text>
        <Text style={styles.emptyText}>Sign in to access your wallet</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        <View style={styles.balanceActions}>
          {[
            { icon: 'add-circle', label: 'Top Up', route: '/(os)/wallet/top-up' },
            { icon: 'arrow-down-circle', label: 'Withdraw', route: '/(os)/wallet/withdraw' },
            { icon: 'swap-horizontal', label: 'Transfer', route: '/(os)/wallet/transfer' },
            { icon: 'qr-code', label: 'Scan', route: '/(os)/wallet/scan' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
              <Ionicons name={a.icon as any} size={20} color="#fff" />
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={loadWalletData}>
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366f1" />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWalletData(); }} />}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={18} color={item.type === 'credit' ? '#10b981' : '#ef4444'} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{item.description || item.type}</Text>
                <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString('en-KE')}</Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'credit' ? '#10b981' : '#ef4444' }]}>
                {item.type === 'credit' ? '+' : '-'}KSh {Math.abs(item.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  balanceCard: { backgroundColor: '#6366f1', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginVertical: 12 },
  balanceActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 4 },
  button: { backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
});
