// app/(os)/wallet/index.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/lib/wallet/store';
import { Ionicons } from '@expo/vector-icons';

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, transactions, selectedAccount, loadAccounts, loadTransactions, selectAccount, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAccounts(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedAccount?.id) {
      loadTransactions(selectedAccount.id);
    }
  }, [selectedAccount?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) await loadAccounts(user.id);
    if (selectedAccount?.id) await loadTransactions(selectedAccount.id);
    setRefreshing(false);
  };

  const mainAccount = selectedAccount || accounts[0];
  const recentTransactions = transactions.slice(0, 5);

  const getTxIcon = (type: string) => {
    const icons: Record<string, string> = {
      deposit: 'arrow-down',
      withdrawal: 'arrow-up',
      transfer: 'swap-horizontal',
      payment: 'card',
      refund: 'return-up-back',
      escrow: 'lock-closed',
      fee: 'receipt',
      commission: 'trending-up',
    };
    return icons[type] || 'cash';
  };

  const getTxColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: '#10B981',
      withdrawal: '#EF4444',
      transfer: '#3B82F6',
      payment: '#F59E0B',
      refund: '#10B981',
      escrow: '#8B5CF6',
      fee: '#64748B',
      commission: '#EC4899',
    };
    return colors[type] || '#64748B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/settings' as any)}>
          <Ionicons name="settings-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {mainAccount?.currency || 'KES'} {mainAccount?.balance?.toLocaleString() || '0.00'}
          </Text>
          <Text style={styles.balanceSub}>
            Available: {mainAccount?.available_balance?.toLocaleString() || '0.00'}
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/deposit' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="arrow-down" size={20} color="#10B981" />
              </View>
              <Text style={styles.actionLabel}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/withdraw' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="arrow-up" size={20} color="#EF4444" />
              </View>
              <Text style={styles.actionLabel}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/transfer' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.actionLabel}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/escrow' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.actionLabel}>Escrow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accounts */}
        {accounts.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
              {accounts.map(account => (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountChip, selectedAccount?.id === account.id && styles.accountChipActive]}
                  onPress={() => selectAccount(account)}
                >
                  <Text style={[styles.accountName, selectedAccount?.id === account.id && styles.accountNameActive]}>
                    {account.account_name}
                  </Text>
                  <Text style={[styles.accountBalance, selectedAccount?.id === account.id && styles.accountBalanceActive]}>
                    {account.currency} {account.balance.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/wallet/transactions' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map(tx => (
            <TouchableOpacity key={tx.id} style={styles.txRow} onPress={() => router.push(`/wallet/transaction/${tx.id}` as any)}>
              <View style={[styles.txIcon, { backgroundColor: getTxColor(tx.transaction_type) + '15' }]}>
                <Ionicons name={getTxIcon(tx.transaction_type) as any} size={20} color={getTxColor(tx.transaction_type)} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txType}>{tx.transaction_type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.txDesc}>{tx.description || 'No description'}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.txAmount}>
                <Text style={[styles.amountText, { color: getTxColor(tx.transaction_type) }]}>
                  {['deposit', 'refund'].includes(tx.transaction_type) ? '+' : '-'}{tx.amount.toLocaleString()}
                </Text>
                <Text style={styles.txStatus}>{tx.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {recentTransactions.length === 0 && (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  content: { flex: 1 },
  balanceCard: { backgroundColor: '#0F172A', marginHorizontal: 16, borderRadius: 20, padding: 24, marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  balanceSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  actionButton: { alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#94A3B8' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginBottom: 12 },
  accountsScroll: { paddingHorizontal: 16 },
  accountChip: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginRight: 12, minWidth: 160, borderWidth: 2, borderColor: '#E2E8F0' },
  accountChipActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  accountName: { fontSize: 14, fontWeight: '600', color: '#475569' },
  accountNameActive: { color: '#3B82F6' },
  accountBalance: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  accountBalanceActive: { color: '#3B82F6' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, marginBottom: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  txDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700' },
  txStatus: { fontSize: 11, color: '#94A3B8', textTransform: 'capitalize', marginTop: 2 },
  emptyTx: { alignItems: 'center', paddingVertical: 32 },
  emptyTxText: { fontSize: 14, color: '#94A3B8' },
});
