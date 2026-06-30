// app/(os)/wallet/index.tsx -- MTAA Wallet
// v3.2: Added Treasury/Escrow/Tax hub navigation, integrated with edge functions

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/lib/wallet/state/wallet.store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  color: string;
}

const PRIMARY_ACTIONS: QuickAction[] = [
  { icon: 'add-circle', label: 'Top Up', route: '/(os)/wallet/top-up', color: '#10b981' },
  { icon: 'arrow-down-circle', label: 'Withdraw', route: '/(os)/wallet/withdraw', color: '#ef4444' },
  { icon: 'swap-horizontal', label: 'Transfer', route: '/(os)/wallet/transfer', color: '#6366f1' },
  { icon: 'qr-code', label: 'Scan', route: '/(os)/wallet/scan', color: '#8b5cf6' },
];

const HUB_ACTIONS: QuickAction[] = [
  { icon: 'business', label: 'Treasury', route: '/(os)/wallet/treasury-hub', color: '#059669' },
  { icon: 'shield-checkmark', label: 'Escrow', route: '/(os)/wallet/escrow-hub', color: '#d97706' },
  { icon: 'receipt', label: 'Tax', route: '/(os)/wallet/tax-hub', color: '#dc2626' },
  { icon: 'card', label: 'Cards', route: '/(os)/wallet/cards', color: '#7c3aed' },
];

const MORE_ACTIONS: QuickAction[] = [
  { icon: 'trending-up', label: 'Invest', route: '/(os)/wallet/invest', color: '#0891b2' },
  { icon: 'people', label: 'SACCO', route: '/(os)/wallet/sacco', color: '#ea580c' },
  { icon: 'heart', label: 'GoFund', route: '/(os)/wallet/gofund', color: '#db2777' },
  { icon: 'settings', label: 'Settings', route: '/(os)/wallet/settings', color: '#4b5563' },
];

export default function WalletScreen() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { balance, setBalance } = useWalletStore();
  const router = useRouter();
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
      const bal = account?.balance || 0;
      setBalance(bal);

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
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(os)/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWalletData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(os)/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.balanceActions}>
            {PRIMARY_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={[styles.actionBtn, { backgroundColor: a.color }]} onPress={() => router.push(a.route as any)}>
                <Ionicons name={a.icon as any} size={20} color="#fff" />
                <Text style={styles.actionText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.hubSection}>
          <Text style={styles.sectionTitle}>Financial Hubs</Text>
          <View style={styles.hubGrid}>
            {HUB_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={styles.hubItem} onPress={() => router.push(a.route as any)}>
                <View style={[styles.hubIcon, { backgroundColor: a.color + '15' }]}>
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text style={styles.hubLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.hubSection}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.hubGrid}>
            {MORE_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={styles.hubItem} onPress={() => router.push(a.route as any)}>
                <View style={[styles.hubIcon, { backgroundColor: a.color + '15' }]}>
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text style={styles.hubLabel}>{a.label}</Text>
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
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: item.type === 'credit' ? '#dcfce7' : '#fee2e2' }]}>
                  <Ionicons name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={18} color={item.type === 'credit' ? '#10b981' : '#ef4444'} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{item.description || item.type}</Text>
                  <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString('en-KE')}</Text>
                </View>
                <Text style={[styles.txAmount, { color: item.type === 'credit' ? '#10b981' : '#ef4444' }]}>
                  {item.type === 'credit' ? '+' : '-'}KSh {Math.abs(item.amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: 14, color: '#64748b' },
  userName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  settingsBtn: { padding: 8, borderRadius: 12, backgroundColor: '#f1f5f9' },
  balanceCard: { margin: 16, padding: 24, borderRadius: 20, backgroundColor: '#1e293b' },
  balanceLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20 },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, minWidth: 72 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 4 },
  hubSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hubItem: { width: '22%', alignItems: 'center', marginBottom: 8 },
  hubIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  hubLabel: { fontSize: 11, fontWeight: '500', color: '#475569', textAlign: 'center' },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#334155', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  button: { backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', marginBottom: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  txDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
