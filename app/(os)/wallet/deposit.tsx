// app/(os)/wallet/deposit.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/lib/wallet/store';
import { Ionicons } from '@expo/vector-icons';

const depositMethods = [
  { key: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait', color: '#10B981' },
  { key: 'bank', label: 'Bank Transfer', icon: 'business', color: '#3B82F6' },
  { key: 'card', label: 'Card', icon: 'card', color: '#8B5CF6' },
];

export default function DepositScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedAccount, deposit, loadAccounts } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mpesa');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('Error', 'No account selected');
      return;
    }

    setIsLoading(true);
    try {
      // Find payment method ID for selected method
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('account_id', selectedAccount.id)
        .eq('method_type', method === 'mpesa' ? 'mobile_money' : method === 'bank' ? 'bank_transfer' : 'card')
        .eq('is_default', true)
        .single();

      const methodId = methods?.id || '';
      await deposit(selectedAccount.id, numAmount, methodId);
      Alert.alert('Success', `KES ${numAmount.toLocaleString()} deposited successfully`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balancePreview}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {selectedAccount?.currency || 'KES'} {selectedAccount?.balance?.toLocaleString() || '0.00'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencyLabel}>{selectedAccount?.currency || 'KES'}</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodsRow}>
          {depositMethods.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, method === m.key && styles.methodCardActive]}
              onPress={() => setMethod(m.key)}
            >
              <View style={[styles.methodIcon, { backgroundColor: m.color + '15' }]}>
                <Ionicons name={m.icon as any} size={24} color={m.color} />
              </View>
              <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>KES {parseFloat(amount || '0').toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee</Text>
            <Text style={styles.summaryValue}>KES 0.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Credit</Text>
            <Text style={styles.totalValue}>KES {parseFloat(amount || '0').toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.depositButton} onPress={handleDeposit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.depositText}>Confirm Deposit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

import { supabase } from '@/lib/supabase';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  balancePreview: { backgroundColor: '#0F172A', borderRadius: 16, padding: 20, marginBottom: 20 },
  balanceLabel: { fontSize: 14, color: '#94A3B8' },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, marginTop: 8 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  currencyLabel: { fontSize: 18, fontWeight: '700', color: '#3B82F6', marginRight: 12 },
  input: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1E293B' },
  methodsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  methodCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  methodCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  methodIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  methodLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  methodLabelActive: { color: '#3B82F6' },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  depositButton: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' },
  depositText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
