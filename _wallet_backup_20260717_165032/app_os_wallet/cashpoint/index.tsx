import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl, Alert, Share, TextInput, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';

interface AgentData {
  id: string;
  business_name: string;
  agent_type: string;
  status: string;
  float_balance: number;
  daily_transaction_limit: number;
  today_deposited: number;
  today_withdrawn: number;
  total_commission_earned: number;
  today_commission: number;
  monthly_commission: number;
  agent_code: string;
  qr_code_data: string | null;
  approved_at: string | null;
}

interface Transaction {
  id: string;
  tx_type: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  reference_code: string | null;
}

export default function CashPointScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txMode, setTxMode] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [txAmount, setTxAmount] = useState('');
  const [txCustomerCode, setTxCustomerCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [agentType, setAgentType] = useState('kiosk');
  const [businessAddress, setBusinessAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [kraPin, setKraPin] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: agentData } = await supabase
        .from('cashpoint_agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setAgent(agentData || null);

      if (agentData) {
        const { data: txData } = await supabase
          .from('cashpoint_transactions')
          .select('id, tx_type, amount, commission_amount, status, created_at, reference_code')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setTransactions(txData || []);
      }
    } catch (err) {
      console.error('CashPoint load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const applyAsAgent = async () => {
    if (!businessName.trim()) { Alert.alert('Required', 'Business name is required'); return; }
    if (!idNumber.trim()) { Alert.alert('Required', 'ID number is required'); return; }
    setProcessing(true);
    try {
      const agentCode = 'CP' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const { error } = await supabase.from('cashpoint_agents').insert({
        user_id: user!.id,
        business_name: businessName.trim(),
        agent_type: agentType,
        business_address: businessAddress.trim() || null,
        id_number: idNumber.trim(),
        kra_pin: kraPin.trim() || null,
        agent_code: agentCode,
        qr_code_data: agentCode,
        status: 'pending_approval',
      });
      if (error) throw error;
      Alert.alert('Application Submitted', 'Your CashPoint application is under review.');
      setShowApplyModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit');
    } finally {
      setProcessing(false);
    }
  };

  const processTransaction = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    if (!txCustomerCode.trim()) { Alert.alert('Required', 'Enter customer code or phone'); return; }
    if (!agent) return;
    setProcessing(true);
    try {
      const { data: customerData } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${txCustomerCode},phone.eq.${txCustomerCode}`)
        .single();
      if (!customerData) {
        Alert.alert('Customer Not Found', 'No customer found with that code or phone');
        setProcessing(false);
        return;
      }
      const refCode = 'TX' + Date.now().toString(36).toUpperCase();
      const { data: result, error } = await supabase.rpc(
        txMode === 'withdrawal' ? 'process_cashpoint_withdrawal' : 'process_cashpoint_deposit',
        { p_agent_id: agent.id, p_customer_id: customerData.id, p_amount: amount, p_reference_code: refCode }
      );
      if (error) throw error;
      const resultData = typeof result === 'string' ? JSON.parse(result) : result;
      if (resultData.success) {
        Alert.alert('Transaction Complete',
          `${txMode === 'withdrawal' ? 'Withdrawal' : 'Deposit'} of KSh ${amount.toLocaleString()} processed.\nCommission: KSh ${(resultData.commission || 0).toLocaleString()}`,
          [{ text: 'OK', onPress: () => { setShowTxModal(false); setTxAmount(''); setTxCustomerCode(''); loadData(); } }]
        );
      } else {
        Alert.alert('Failed', resultData.error || 'Transaction failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const shareAgentCode = async () => {
    if (!agent) return;
    await Share.share({ message: `Pay me via MTAA CashPoint!\nAgent Code: ${agent.agent_code}\nBusiness: ${agent.business_name}` });
  };

  const copyAgentCode = async () => {
    if (!agent) return;
    await Clipboard.setStringAsync(agent.agent_code);
    Alert.alert('Copied', 'Agent code copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return '#00ff88';
    if (status === 'pending_approval') return '#ffaa00';
    if (status === 'approved') return '#00d4ff';
    if (status === 'suspended') return '#ff4444';
    return '#888';
  };

  const getTxTypeColor = (type: string) => type === 'withdrawal' ? '#ff4444' : '#00ff88';
  const getProgressPct = () => agent ? Math.min(100, ((agent.today_deposited + agent.today_withdrawn) / agent.daily_transaction_limit) * 100) : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  // NOT AN AGENT — Show apply screen
  if (!agent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>CashPoint</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="storefront-outline" size={48} color="#00d4ff" />
            <Text style={styles.heroTitle}>Become a CashPoint Agent</Text>
            <Text style={styles.heroSub}>Earn commissions on every withdrawal and deposit. Join MTAA's agent network.</Text>
          </View>
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Why Become an Agent?</Text>
            {[
              { icon: 'cash-outline', title: 'Earn Commissions', desc: 'KSh 5-20 per withdrawal, 0.5% on deposits', color: '#00ff88' },
              { icon: 'trending-up-outline', title: 'Daily Limits up to KSh 500K', desc: 'Scale your earnings with higher limits', color: '#00d4ff' },
              { icon: 'qr-code-outline', title: 'QR Code Payments', desc: 'Customers scan and pay instantly', color: '#ff00ff' },
              { icon: 'people-outline', title: 'Anyone Can Join', desc: 'Shops, kiosks, mama mboga - all welcome', color: '#ffaa00' },
            ].map(b => (
              <View key={b.title} style={styles.benefitRow}>
                <Ionicons name={b.icon as any} size={20} color={b.color} />
                <View style={styles.benefitInfo}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApplyModal(true)}>
            <Text style={styles.applyBtnText}>Apply as CashPoint Agent</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showApplyModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              <Text style={styles.modalTitle}>Apply as Agent</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Mama Njoro Shop" placeholderTextColor="#555" value={businessName} onChangeText={setBusinessName} />
              <Text style={styles.label}>Agent Type *</Text>
              <View style={styles.typeRow}>
                {['kiosk', 'shop', 'mobile', 'mama_mboga', 'stationary'].map(t => (
                  <TouchableOpacity key={t} style={[styles.typeChip, agentType === t && styles.typeChipActive]} onPress={() => setAgentType(t)}>
                    <Text style={[styles.typeChipText, agentType === t && styles.typeChipTextActive]}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Business Address</Text>
              <TextInput style={styles.input} placeholder="Street, Building, Area" placeholderTextColor="#555" value={businessAddress} onChangeText={setBusinessAddress} />
              <Text style={styles.label}>ID Number *</Text>
              <TextInput style={styles.input} placeholder="National ID Number" placeholderTextColor="#555" value={idNumber} onChangeText={setIdNumber} keyboardType="number-pad" />
              <Text style={styles.label}>KRA PIN (optional)</Text>
              <TextInput style={styles.input} placeholder="KRA PIN" placeholderTextColor="#555" value={kraPin} onChangeText={setKraPin} />
              <TouchableOpacity style={[styles.submitBtn, (!businessName || !idNumber || processing) && styles.submitBtnDisabled]} onPress={applyAsAgent} disabled={!businessName || !idNumber || processing}>
                {processing ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  // AGENT DASHBOARD
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>CashPoint</Text>
        <TouchableOpacity onPress={onRefresh}><Ionicons name="refresh" size={22} color="#00d4ff" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}>
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(agent.status) + '22', borderColor: getStatusColor(agent.status) }]}>
          <Ionicons name={agent.status === 'active' ? 'checkmark-circle' : 'time'} size={18} color={getStatusColor(agent.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(agent.status) }]}>
            {agent.status === 'active' ? 'Active Agent' : agent.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Float Balance</Text>
          <Text style={styles.balanceAmount}>KSh {agent.float_balance.toLocaleString()}</Text>
          <View style={styles.limitBar}><View style={[styles.limitFill, { width: `${getProgressPct()}%` }]} /></View>
          <Text style={styles.limitText}>KSh {(agent.today_deposited + agent.today_withdrawn).toLocaleString()} / KSh {agent.daily_transaction_limit.toLocaleString()} today</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setTxMode('withdrawal'); setShowTxModal(true); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#ff444422' }]}><Ionicons name="arrow-down-circle" size={24} color="#ff4444" /></View>
            <Text style={styles.actionText}>Withdrawal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setTxMode('deposit'); setShowTxModal(true); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#00ff8822' }]}><Ionicons name="arrow-up-circle" size={24} color="#00ff88" /></View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareAgentCode}>
            <View style={[styles.actionIcon, { backgroundColor: '#00d4ff22' }]}><Ionicons name="share-social" size={24} color="#00d4ff" /></View>
            <Text style={styles.actionText}>Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/wallet/cashpoint/qr')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ff00ff22' }]}><Ionicons name="qr-code" size={24} color="#ff00ff" /></View>
            <Text style={styles.actionText}>My QR</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.codeCard} onPress={copyAgentCode}>
          <View><Text style={styles.codeLabel}>Agent Code</Text><Text style={styles.codeValue}>{agent.agent_code}</Text></View>
          <Ionicons name="copy-outline" size={20} color="#00d4ff" />
        </TouchableOpacity>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Today Commission</Text><Text style={styles.statValue}>KSh {agent.today_commission.toLocaleString()}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Monthly Commission</Text><Text style={styles.statValue}>KSh {agent.monthly_commission.toLocaleString()}</Text></View>
        </View>
        <View style={styles.totalCommissionCard}>
          <Text style={styles.totalCommissionLabel}>Total Commission Earned</Text>
          <Text style={styles.totalCommissionValue}>KSh {agent.total_commission_earned.toLocaleString()}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyTx}><Text style={styles.emptyTxText}>No transactions yet</Text></View>
          ) : (
            transactions.map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: getTxTypeColor(tx.tx_type) + '22' }]}>
                  <Ionicons name={tx.tx_type === 'withdrawal' ? 'arrow-down' : 'arrow-up'} size={16} color={getTxTypeColor(tx.tx_type)} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{tx.tx_type === 'withdrawal' ? 'Withdrawal' : 'Deposit'}</Text>
                  <Text style={styles.txRef}>{tx.reference_code || '—'}</Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, { color: getTxTypeColor(tx.tx_type) }]}>{tx.tx_type === 'withdrawal' ? '-' : '+'}KSh {tx.amount.toLocaleString()}</Text>
                  <Text style={styles.txCommission}>+KSh {tx.commission_amount.toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showTxModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.txModalOverlay}>
          <View style={styles.txModalContent}>
            <View style={styles.txModalHeader}>
              <Text style={styles.txModalTitle}>{txMode === 'withdrawal' ? 'Process Withdrawal' : 'Process Deposit'}</Text>
              <TouchableOpacity onPress={() => setShowTxModal(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <Text style={styles.txModalLabel}>Customer Code or Phone *</Text>
            <TextInput style={styles.txModalInput} placeholder="Enter customer username or phone" placeholderTextColor="#555" value={txCustomerCode} onChangeText={setTxCustomerCode} autoFocus />
            <Text style={styles.txModalLabel}>Amount (KSh) *</Text>
            <TextInput style={styles.txModalInput} placeholder="0.00" placeholderTextColor="#555" value={txAmount} onChangeText={setTxAmount} keyboardType="decimal-pad" />
            <View style={styles.quickAmounts}>
              {[100, 500, 1000, 2500, 5000, 10000].map(amt => (
                <TouchableOpacity key={amt} style={styles.quickAmt} onPress={() => setTxAmount(amt.toString())}>
                  <Text style={styles.quickAmtText}>KSh {amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.txModalBtn, (!txAmount || !txCustomerCode || processing) && styles.txModalBtnDisabled]} onPress={processTransaction} disabled={!txAmount || !txCustomerCode || processing}>
              {processing ? <ActivityIndicator color="#000" /> : <Text style={styles.txModalBtnText}>{txMode === 'withdrawal' ? 'Give Cash & Deduct' : 'Take Cash & Credit'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  heroCard: { backgroundColor: '#111', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 20 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 12 },
  heroSub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  benefitsSection: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  benefitInfo: { marginLeft: 12, flex: 1 },
  benefitTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  benefitDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  applyBtn: { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 40 },
  applyBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalContent: { padding: 16 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: '#111', borderRadius: 10, padding: 14, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  typeChipActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  typeChipText: { color: '#888', fontSize: 12 },
  typeChipTextActive: { color: '#00d4ff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitBtnDisabled: { backgroundColor: '#1a1a1a' },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, gap: 6 },
  statusText: { fontSize: 13, fontWeight: '700' },
  balanceCard: { backgroundColor: '#111', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  balanceLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 6 },
  limitBar: { width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  limitFill: { height: '100%', backgroundColor: '#00d4ff', borderRadius: 3 },
  limitText: { color: '#666', fontSize: 11, marginTop: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 16 },
  actionBtn: { alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionText: { color: '#ccc', fontSize: 12, marginTop: 6 },
  codeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  codeLabel: { color: '#888', fontSize: 11 },
  codeValue: { color: '#00d4ff', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  statLabel: { color: '#888', fontSize: 11 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  totalCommissionCard: { backgroundColor: '#00d4ff11', marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#00d4ff33', marginBottom: 16 },
  totalCommissionLabel: { color: '#00d4ff', fontSize: 12, fontWeight: '600' },
  totalCommissionValue: { color: '#00d4ff', fontSize: 24, fontWeight: '700', marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  emptyTx: { backgroundColor: '#111', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyTxText: { color: '#666', fontSize: 13 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1a1a1a' },
  txIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 10 },
  txType: { color: '#fff', fontSize: 13, fontWeight: '600' },
  txRef: { color: '#666', fontSize: 11, marginTop: 1 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txCommission: { color: '#00ff88', fontSize: 11, marginTop: 2 },
  txModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  txModalContent: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  txModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  txModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  txModalLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  txModalInput: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#222' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickAmt: { backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#222' },
  quickAmtText: { color: '#ccc', fontSize: 12 },
  txModalBtn: { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  txModalBtnDisabled: { backgroundColor: '#1a1a1a' },
  txModalBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
