import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Stethoscope, Pill,
  FlaskConical, Scan, CreditCard, ChevronRight, Calendar,
  TrendingUp, TrendingDown, Filter
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface HealthTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  direction: 'in' | 'out';
  facility: string;
  description: string;
  created_at: string;
  status: string;
}

export default function HealthWalletScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'consultation' | 'medication' | 'lab' | 'imaging'>('all');

  const transactions: HealthTransaction[] = [
    {
      id: '1', transaction_type: 'consultation', amount: 3500,
      direction: 'out', facility: 'Nairobi West Hospital',
      description: 'Outpatient consultation - Dr. Sarah Kimani',
      created_at: '2025-06-10T09:30:00Z', status: 'completed'
    },
    {
      id: '2', transaction_type: 'medication', amount: 8500,
      direction: 'out', facility: 'Haltons Pharmacy',
      description: 'Metformin 500mg x 60 tablets',
      created_at: '2025-06-10T10:15:00Z', status: 'completed'
    },
    {
      id: '3', transaction_type: 'lab', amount: 12000,
      direction: 'out', facility: 'Lancet Laboratories',
      description: 'HbA1c, FBG, Lipid profile',
      created_at: '2025-06-05T08:00:00Z', status: 'completed'
    },
    {
      id: '4', transaction_type: 'insurance_co_pay', amount: 5000,
      direction: 'out', facility: 'Nairobi West Hospital',
      description: 'Insurance co-payment - Jubilee',
      created_at: '2025-06-01T14:00:00Z', status: 'completed'
    },
    {
      id: '5', transaction_type: 'refund', amount: 2000,
      direction: 'in', facility: 'Nairobi West Hospital',
      description: 'Refund for cancelled appointment',
      created_at: '2025-05-28T10:00:00Z', status: 'completed'
    }
  ];

  const filteredTransactions = activeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.transaction_type === activeFilter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const totalSpent = transactions.filter(t => t.direction === 'out').reduce((sum, t) => sum + t.amount, 0);
  const totalRefunded = transactions.filter(t => t.direction === 'in').reduce((sum, t) => sum + t.amount, 0);
  const netSpend = totalSpent - totalRefunded;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return Stethoscope;
      case 'medication': return Pill;
      case 'lab': return FlaskConical;
      case 'imaging': return Scan;
      default: return CreditCard;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return '#2196F3';
      case 'medication': return '#FF9800';
      case 'lab': return '#9C27B0';
      case 'imaging': return '#4CAF50';
      default: return '#607D8B';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Wallet</Text>
          <Text style={styles.subtitle}>Health spending tracker</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Wallet size={20} color="#fff" />
          <Text style={styles.balanceTitle}>Total Health Spend</Text>
        </View>
        <Text style={styles.balanceAmount}>KES {netSpend.toLocaleString()}</Text>
        <View style={styles.balanceStats}>
          <View style={styles.balanceItem}>
            <ArrowUpRight size={14} color="#FF8A80" />
            <Text style={styles.balanceStatValue}>KES {totalSpent.toLocaleString()}</Text>
            <Text style={styles.balanceStatLabel}>Spent</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <ArrowDownLeft size={14} color="#69F0AE" />
            <Text style={styles.balanceStatValue}>KES {totalRefunded.toLocaleString()}</Text>
            <Text style={styles.balanceStatLabel}>Refunded</Text>
          </View>
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {(['all', 'consultation', 'medication', 'lab', 'imaging'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Wallet size={40} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          filteredTransactions.map(tx => {
            const Icon = getTypeIcon(tx.transaction_type);
            const color = getTypeColor(tx.transaction_type);

            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.txCard}
                onPress={() => router.push({
                  pathname: '/(os)/health/wallet/transaction-detail',
                  params: { id: tx.id }
                } as any)}
              >
                <View style={styles.txHeader}>
                  <View style={[styles.txIcon, { backgroundColor: color + '15' }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txType}>{tx.transaction_type.replace('_', ' ')}</Text>
                    <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                  </View>
                  <View style={styles.txAmount}>
                    <Text style={[styles.amountText, { color: tx.direction === 'in' ? '#4CAF50' : '#F44336' }]}>
                      {tx.direction === 'in' ? '+' : '-'} KES {tx.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.txFooter}>
                  <View style={styles.footerItem}>
                    <Calendar size={12} color="#888" />
                    <Text style={styles.footerText}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Stethoscope size={12} color="#888" />
                    <Text style={styles.footerText}>{tx.facility}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
  },
  balanceCard: {
    backgroundColor: Colors.primary, marginHorizontal: 16,
    borderRadius: 16, padding: 20, marginBottom: 16
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  balanceTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 8 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 16 },
  balanceStats: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  balanceStatValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 4 },
  balanceStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#E8E8E8'
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  txCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 14
  },
  txHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  txIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' },
  txDescription: { fontSize: 11, color: '#888', marginTop: 1 },
  txAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 14, fontWeight: '700' },
  txFooter: { flexDirection: 'row', gap: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#888' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bottomPadding: { height: 32 }
});

