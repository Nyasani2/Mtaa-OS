import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface FeeRecord {
  id: string; student_name: string; grade: string; amount: number;
  paid: number; balance: number; term: string; status: string; student_id?: string;
}

export default function FeesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [stats, setStats] = useState({ total: 0, collected: 0, outstanding: 0 });

  const loadData = useCallback(async () => {
    try {
      const { data: feeData, error: feeError } = await supabase
        .from('education_fees').select('*').eq('guardian_id', user?.id).order('created_at', { ascending: false });
      if (feeError) throw feeError;
      const mappedFees: FeeRecord[] = (feeData || []).map((f: any) => ({
        id: f.id, student_name: f.student_name || 'Unknown', grade: f.grade || '',
        amount: Number(f.amount) || 0, paid: Number(f.paid) || 0, balance: Number(f.balance) || 0,
        term: f.term || '', status: f.status || 'unpaid', student_id: f.student_id,
      }));
      setFees(mappedFees);
      const total = mappedFees.reduce((s, f) => s + f.amount, 0);
      const collected = mappedFees.reduce((s, f) => s + f.paid, 0);
      setStats({ total, collected, outstanding: total - collected });
      const { data: wallet } = await supabase.from('wallet_accounts')
        .select('balance').eq('user_id', user?.id).eq('currency', 'KES').eq('is_default', true).single();
      setWalletBalance(Number(wallet?.balance) || 0);
    } catch (e: any) { console.error('Failed to load fees:', e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id, loadData]);

  const getStatusColor = (status: string) => {
    switch (status) { case 'paid': return '#10b981'; case 'partial': return '#f59e0b'; case 'unpaid': return '#ef4444'; default: return '#94a3b8'; }
  };

  async function handlePayFee(fee: FeeRecord) {
    if (fee.balance <= 0) { Alert.alert('Already Paid', 'This fee has been fully paid.'); return; }
    setSelectedFee(fee); setPayAmount(fee.balance.toString()); setPayModalVisible(true);
  }

  async function confirmPayment() {
    if (!selectedFee || !user?.id) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    if (amount > selectedFee.balance) { Alert.alert('Error', `Amount exceeds balance of KES ${selectedFee.balance.toLocaleString()}`); return; }
    if (amount > walletBalance) { Alert.alert('Insufficient Balance', `Your wallet has KES ${walletBalance.toLocaleString()}. Please deposit first.`); return; }
    setPaying(true);
    try {
      const { error: transferError } = await supabase.rpc('execute_p2p_transfer', {
        p_sender_id: user.id, p_receiver_id: selectedFee.student_id || 'school_account',
        p_amount: amount, p_currency: 'KES',
        p_description: `School fee payment for ${selectedFee.student_name} - ${selectedFee.term}`,
        p_reference_type: 'education_fee', p_reference_id: selectedFee.id, p_platform_fee: 0,
      });
      if (transferError) throw transferError;
      const newPaid = selectedFee.paid + amount;
      const newBalance = selectedFee.amount - newPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';
      await supabase.from('education_fees').update({ paid: newPaid, balance: newBalance, status: newStatus, updated_at: new Date().toISOString() }).eq('id', selectedFee.id);
      await supabase.from('education_fee_payments').insert({
        fee_id: selectedFee.id, guardian_id: user.id, student_id: selectedFee.student_id,
        amount, term: selectedFee.term, status: 'completed', payment_method: 'wallet',
      });
      Alert.alert('Payment Successful', `KES ${amount.toLocaleString()} paid for ${selectedFee.student_name}`);
      setPayModalVisible(false); setPayAmount(''); setSelectedFee(null); loadData();
    } catch (e: any) { Alert.alert('Payment Failed', e.message); }
    finally { setPaying(false); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Fee Structure</Text>
        <TouchableOpacity onPress={() => router.push('/(wallet)/deposit')}><Ionicons name="wallet-outline" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.walletBanner}>
        <Ionicons name="wallet-outline" size={20} color="#3b82f6" />
        <Text style={styles.walletText}>Wallet: KES {walletBalance.toLocaleString()}</Text>
        <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/(wallet)/deposit')}><Text style={styles.topUpText}>Top Up</Text></TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#10b98115' }]}>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>KES {(stats.collected / 1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Total Collected</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ef444415' }]}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>KES {(stats.outstanding / 1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Outstanding</Text>
        </View>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <ScrollView style={styles.content}>
          {fees.length === 0 ? (
            <View style={styles.emptyState}><Ionicons name="school-outline" size={48} color="#94a3b8" /><Text style={styles.emptyText}>No fee records found</Text></View>
          ) : (
            fees.map((fee) => (
              <View key={fee.id} style={styles.feeCard}>
                <View style={styles.feeHeader}>
                  <View><Text style={styles.feeName}>{fee.student_name}</Text><Text style={styles.feeGrade}>{fee.grade} · {fee.term}</Text></View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(fee.status) }]}>{fee.status}</Text>
                  </View>
                </View>
                <View style={styles.feeDetails}>
                  <View style={styles.feeItem}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeValue}>KES {fee.amount.toLocaleString()}</Text></View>
                  <View style={styles.feeItem}><Text style={styles.feeLabel}>Paid</Text><Text style={[styles.feeValue, { color: '#10b981' }]}>KES {fee.paid.toLocaleString()}</Text></View>
                  <View style={styles.feeItem}><Text style={styles.feeLabel}>Balance</Text><Text style={[styles.feeValue, { color: '#ef4444' }]}>KES {fee.balance.toLocaleString()}</Text></View>
                </View>
                {fee.balance > 0 ? (
                  <TouchableOpacity style={styles.payBtn} onPress={() => handlePayFee(fee)}><Text style={styles.payBtnText}>Pay KES {fee.balance.toLocaleString()}</Text></TouchableOpacity>
                ) : (
                  <View style={styles.paidBadge}><Ionicons name="checkmark-circle" size={16} color="#10b981" /><Text style={styles.paidText}>Fully Paid</Text></View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
      <Modal visible={payModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay School Fee</Text>
            <Text style={styles.modalSubtitle}>{selectedFee?.student_name} — {selectedFee?.term}</Text>
            <Text style={styles.modalBalance}>Balance: KES {selectedFee?.balance.toLocaleString()}</Text>
            <Text style={styles.modalLabel}>Amount to Pay (KES)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} placeholder="Enter amount" placeholderTextColor="#64748b" />
            <Text style={styles.modalWallet}>Wallet Balance: KES {walletBalance.toLocaleString()}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setPayModalVisible(false); setPayAmount(''); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, paying && styles.modalConfirmDisabled]} onPress={confirmPayment} disabled={paying}><Text style={styles.modalConfirmText}>{paying ? 'Processing...' : 'Confirm Payment'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  walletBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  walletText: { color: '#fff', fontSize: 14, flex: 1 },
  topUpBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  topUpText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  content: { paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
  feeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  feeName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  feeGrade: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  feeDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  feeItem: { alignItems: 'center' },
  feeLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  feeValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  payBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 10 },
  paidText: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  modalBalance: { fontSize: 16, color: '#ef4444', fontWeight: '600', marginTop: 8 },
  modalLabel: { fontSize: 13, color: '#64748b', marginTop: 16, marginBottom: 6 },
  modalInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 16, color: '#1e293b' },
  modalWallet: { fontSize: 13, color: '#3b82f6', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { color: '#64748b', fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalConfirmDisabled: { backgroundColor: '#93c5fd' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
});
