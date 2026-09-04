// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';
import { colors } from '@/constants/theme';
const colors = (colors as any)?.light || colors || {};
const fonts = { regular: 'System', bold: 'System', light: 'System' };
const sizes = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 };


const WITHDRAW_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { id: 'bank', label: 'Bank Account', icon: '🏦' },
  { id: 'crypto', label: 'Crypto Wallet', icon: '₿' },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, withdraw } = useWallet();

  const [method, setMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = useCallback(async () => {
    if (!recipient.trim()) { Alert.alert('Error', 'Enter recipient details'); return; }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount'); return;
    }
    if (Number(amount) > balance) { Alert.alert('Error', 'Insufficient balance'); return; }

    setLoading(true);
    try {
      await withdraw?.({ method, amount: Number(amount), recipient: recipient.trim() });
      Alert.alert('Success', `Withdrew KSh ${amount} to ${recipient}`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Withdraw Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [method, amount, recipient, balance, withdraw, router]);

  const quickAmounts = [500, 1000, 5000, 10000];

  const getPlaceholder = () => {
    if (method === 'mpesa') return 'M-Pesa phone number (2547XXXXXXXX)';
    if (method === 'bank') return 'Bank account number';
    return 'Crypto wallet address';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* Method */}
        <Text style={styles.sectionLabel}>Withdraw To</Text>
        <View style={styles.methodRow}>
          {WITHDRAW_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodChip, method === m.id && styles.methodChipActive]}
              onPress={() => setMethod(m.id)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipient</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              placeholderTextColor={colors.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount (KSh)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>KSh</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.quickRow}>
            {quickAmounts.map(amt => (
              <TouchableOpacity
                key={amt}
                style={styles.quickChip}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={styles.quickText}>KSh {amt.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fee estimate */}
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Estimated Fee</Text>
          <Text style={styles.feeValue}>KSh {Math.max(10, Math.round(Number(amount || 0) * 0.01)).toLocaleString()}</Text>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Withdraw</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  scroll: { paddingHorizontal: sizes.md, paddingBottom: sizes.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: sizes.md,
    padding: sizes.lg,
    marginBottom: sizes.lg,
  },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontFamily: fonts.bold, fontSize: 28, color: '#fff', marginTop: 4 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: sizes.md },
  methodRow: { flexDirection: 'row', gap: sizes.sm, marginBottom: sizes.lg },
  methodChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: sizes.md,
    paddingVertical: sizes.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodChipActive: { borderColor: colors.primary },
  methodIcon: { fontSize: 24, marginBottom: 4 },
  methodLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  methodLabelActive: { color: colors.primary, fontFamily: fonts.bold },
  section: { marginBottom: sizes.lg },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: sizes.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingHorizontal: sizes.md,
    height: 52,
  },
  inputIcon: { marginRight: sizes.sm },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingHorizontal: sizes.md,
    height: 64,
  },
  currency: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary, marginRight: sizes.sm },
  amountInput: { flex: 1, fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  quickRow: { flexDirection: 'row', marginTop: sizes.md, gap: sizes.sm },
  quickChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingVertical: sizes.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: sizes.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: sizes.md,
  },
  feeLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  feeValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: sizes.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
});

