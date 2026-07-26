// app/(os)/wallet/index.tsx — FIXED
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function WalletScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadWalletData();
  }, [user?.id]);

  async function loadWalletData() {
    setIsLoading(true);
    try {
      const { data: account } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      setBalance(account?.balance || 0);

      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(txs || []);
    } catch (err) {
      console.error('[Wallet] Load error:', err);
    } finally {
      setIsLoading(false);
    }
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
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/wallet/top-up')}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionText}>Top Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/wallet/withdraw')}>
            <Ionicons name="arrow-down-circle" size={20} color="#fff" />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/wallet/transfer')}>
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={loadWalletData}>
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#007AFF" />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons
                  name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.type === 'credit' ? '#34C759' : '#FF3B30'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{item.description || item.type}</Text>
                <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'credit' ? '#34C759' : '#FF3B30' }]}>
                {item.type === 'credit' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  balanceCard: { backgroundColor: '#007AFF', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '700', marginBottom: 20 },
  balanceActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 4 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
});
