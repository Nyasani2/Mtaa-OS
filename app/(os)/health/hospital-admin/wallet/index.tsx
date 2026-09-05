import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalWallet } from '@/lib/health/hooks/useHospitalWallet';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Eye, EyeOff, RefreshCw, DollarSign, Building2 } from 'lucide-react-native';

export default function HospitalWalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedFacilityId } = useHealthRole();
  const { wallet, transactions, balance, stats, loading, refresh, withdraw } = useHospitalWallet(selectedFacilityId);
  const [showBalance, setShowBalance] = useState(true);

  const handleWithdraw = () => {
    Alert.alert('Withdraw Funds', 'Enter amount to withdraw to linked bank account', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', onPress: () => withdraw(1000) }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Building2 size={24} color="#fff" />
          <Text style={styles.headerTitle}>Hospital Wallet</Text>
          <TouchableOpacity onPress={refresh} style={styles.refreshBtn}><RefreshCw size={18} color="#fff" /></TouchableOpacity>
        </View>
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={18} color="rgba(255,255,255,0.7)" /> : <Eye size={18} color="rgba(255,255,255,0.7)" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceValue}>{showBalance ? `$${(balance || 0).toLocaleString()}` : '****'}</Text>
          <View style={styles.balanceMeta}>
            <Text style={styles.balanceSub}>MTAA Commission: {stats?.commissionRate || 2.5}%</Text>
            <Text style={styles.balanceSub}>Net Revenue: ${(stats?.netRevenue || 0).toLocaleString()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleWithdraw}>
          <ArrowUpRight size={20} color="#EF4444" /><Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/health/hospital-admin/pos' as any)}>
          <DollarSign size={20} color="#10B981" /><Text style={styles.actionText}>POS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/health/hospital-admin/accounting' as any)}>
          <TrendingUp size={20} color="#3B82F6" /><Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statValue}>${(stats?.todayRevenue || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Today</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>${(stats?.monthRevenue || 0).toLocaleString()}</Text><Text style={styles.statLabel}>This Month</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats?.totalTransactions || 0}</Text><Text style={styles.statLabel}>Transactions</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>${(stats?.commissionPaid || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Commission</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions?.length === 0 ? <Text style={styles.emptyText}>No transactions yet</Text>
         : transactions?.map((tx: any) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#ECFDF5' : '#FEE2E2' }]}>
                {tx.type === 'credit' ? <ArrowDownLeft size={16} color="#10B981" /> : <ArrowUpRight size={16} color="#EF4444" />}
              </View>
              <View><Text style={styles.txDesc}>{tx.description || 'Transaction'}</Text><Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text></View>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#10B981' : '#EF4444' }]}>{tx.type === 'credit' ? '+' : '-'}${(tx.amount || 0).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#0A4DA6', padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1, marginLeft: 10 },
  refreshBtn: { padding: 8 },
  balanceCard: { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 8 },
  balanceMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  balanceSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  actionsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 14, borderRadius: 12 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0A4DA6' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  txDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 16 },
});

