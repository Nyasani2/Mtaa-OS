// app/(wallet)/withdraw.tsx — MTAA Wallet Withdrawal Screen
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { requestWithdrawal, getUserWithdrawals, WalletWithdrawal } from '@/lib/services/wallet-deposit-service';

export default function WithdrawScreen() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  async function loadHistory() {
    try {
      const data = await getUserWithdrawals(user!.id);
      setWithdrawals(data);
    } catch (e) {
      console.error('Failed to load withdrawals:', e);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleWithdraw() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (numAmount > 150000) {
      Alert.alert('Error', 'Maximum withdrawal is KES 150,000');
      return;
    }
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid M-Pesa phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await requestWithdrawal(user!.id, numAmount, phone);
      Alert.alert(
        'Withdrawal Initiated',
        `KES ${result.net_amount.toLocaleString()} will be sent to ${phone}. Fee: KES ${result.fee}`
      );
      setAmount('');
      loadHistory();
    } catch (e: any) {
      Alert.alert('Withdrawal Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  const fee = Math.min(Math.max(Math.round(Number(amount || 0) * 0.01), 10), 500);
  const net = Number(amount || 0) - fee;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Withdraw to M-Pesa</Text>

      {/* Withdrawal Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Amount (KES)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#555"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>M-Pesa Phone Number</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="e.g. 0712345678"
          placeholderTextColor="#555"
          value={phone}
          onChangeText={setPhone}
        />

        {Number(amount) > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>KES {Number(amount).toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee (1%)</Text>
              <Text style={styles.summaryValue}>KES {fee.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.netRow]}>
              <Text style={styles.netLabel}>You Receive</Text>
              <Text style={styles.netValue}>KES {net.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Withdraw to M-Pesa'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Withdrawal History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
        {withdrawals.length === 0 ? (
          <Text style={styles.empty}>No withdrawals yet</Text>
        ) : (
          withdrawals.map((w) => (
            <View key={w.id} style={styles.withdrawalCard}>
              <View style={styles.withdrawalHeader}>
                <Text style={styles.amount}>KES {w.amount.toLocaleString()}</Text>
                <Text style={[styles.status, styles[`status_${w.status}`]]}>
                  {w.status}
                </Text>
              </View>
              <Text style={styles.detail}>Net: KES {w.net_amount.toLocaleString()} | Fee: KES {w.fee}</Text>
              <Text style={styles.detail}>To: {w.phone_number}</Text>
              {w.mpesa_receipt && <Text style={styles.receipt}>Receipt: {w.mpesa_receipt}</Text>}
              <Text style={styles.date}>{new Date(w.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  form: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 },
  label: { fontSize: 14, color: '#ccc', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  summary: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#222' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, color: '#ccc' },
  netRow: { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 8, marginTop: 4 },
  netLabel: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  netValue: { fontSize: 14, fontWeight: 'bold', color: '#00ff88' },
  button: { backgroundColor: '#00ff88', borderRadius: 8, paddingVertical: 14, marginTop: 20, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#004422' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  empty: { fontSize: 14, color: '#555', textAlign: 'center', paddingVertical: 20 },
  withdrawalCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  withdrawalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  status: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, textTransform: 'capitalize' },
  status_completed: { backgroundColor: '#00ff8822', color: '#00ff88' },
  status_pending: { backgroundColor: '#0088ff22', color: '#0088ff' },
  status_processing: { backgroundColor: '#ffaa0022', color: '#ffaa00' },
  status_failed: { backgroundColor: '#ff004422', color: '#ff0044' },
  status_cancelled: { backgroundColor: '#55555522', color: '#888' },
  detail: { fontSize: 13, color: '#aaa', marginBottom: 2 },
  receipt: { fontSize: 12, color: '#00ff88', marginTop: 4 },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
});
