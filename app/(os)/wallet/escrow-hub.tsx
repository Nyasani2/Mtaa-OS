// app/(os)/wallet/escrow-hub.tsx
// MTAA Escrow Hub -- Buyer-seller escrow with fund/release/dispute flow

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getEscrowTransactions,
  fundEscrow,
  releaseEscrow,
  disputeEscrow,
} from '@/lib/services/escrow-service';

export default function EscrowHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [fundAmount, setFundAmount] = useState('');
  const [fundRecipient, setFundRecipient] = useState('');
  const [fundDesc, setFundDesc] = useState('');

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getEscrowTransactions(user!.id);
      setTransactions(data || []);
    } catch (err) { console.error('[EscrowHub] Load error:', err); }
    finally { setLoading(false); }
  }

  async function handleFund() {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0 || !fundRecipient) {
      Alert.alert('Error', 'Enter valid amount and recipient');
      return;
    }
    try {
      await fundEscrow({
        recipient_id: fundRecipient,
        amount,
        description: fundDesc || 'Escrow funding',
      });
      Alert.alert('Success', 'Escrow funded successfully');
      setFundAmount(''); setFundRecipient(''); setFundDesc('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fund escrow');
    }
  }

  async function handleRelease(escrowId: string) {
    try {
      await releaseEscrow(escrowId, 'Released by payer');
      Alert.alert('Success', 'Funds released to recipient');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to release');
    }
  }

  async function handleDispute(escrowId: string) {
    Alert.prompt(
      'Dispute Escrow',
      'Enter reason for dispute:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await disputeEscrow(escrowId, reason);
              Alert.alert('Success', 'Dispute filed');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to dispute');
            }
          },
        },
      ]
    );
  }

  const activeTxs = transactions.filter((t) => ['pending', 'funded'].includes(t.status));
  const historyTxs = transactions.filter((t) => ['released', 'disputed', 'refunded'].includes(t.status));

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    funded: '#6366f1',
    released: '#10b981',
    disputed: '#ef4444',
    refunded: '#6b7280',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escrow Hub</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View style={styles.fundCard}>
        <Text style={styles.fundTitle}>Fund New Escrow</Text>
        <TextInput
          style={styles.input}
          placeholder="Recipient ID"
          value={fundRecipient}
          onChangeText={setFundRecipient}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (KSh)"
          value={fundAmount}
          onChangeText={setFundAmount}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={fundDesc}
          onChangeText={setFundDesc}
        />
        <TouchableOpacity style={styles.fundBtn} onPress={handleFund}>
          <Text style={styles.fundBtnText}>Fund Escrow</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('active')} style={[styles.tab, activeTab === 'active' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active ({activeTxs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History ({historyTxs.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366f1" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {(activeTab === 'active' ? activeTxs : historyTxs).map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[tx.status] || '#6b7280') + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColors[tx.status] || '#6b7280' }]}>{tx.status}</Text>
                </View>
                <Text style={styles.txAmount}>KSh {(tx.amount || 0).toLocaleString('en-KE')}</Text>
              </View>
              <Text style={styles.txDesc}>{tx.description || 'Escrow transaction'}</Text>
              <Text style={styles.txMeta}>To: {tx.payee_id?.slice(0, 8)}... &middot; {new Date(tx.created_at).toLocaleDateString('en-KE')}</Text>

              {tx.status === 'funded' && (
                <View style={styles.txActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleRelease(tx.id)}>
                    <Text style={styles.actionBtnText}>Release</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleDispute(tx.id)}>
                    <Text style={styles.actionBtnText}>Dispute</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {(activeTab === 'active' ? activeTxs : historyTxs).length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No {activeTab} escrow transactions</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  fundCard: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  fundTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  fundBtn: { backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  fundBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  txCard: { marginHorizontal: 16, marginBottom: 10, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  txAmount: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  txDesc: { fontSize: 14, color: '#334155', marginBottom: 4 },
  txMeta: { fontSize: 12, color: '#94a3b8' },
  txActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});

