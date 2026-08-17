import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
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
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              placeholderTextColor={COLORS.textSecondary}
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
              placeholderTextColor={COLORS.textSecondary}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  scroll: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  balanceLabel: { fontFamily: FONTS.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontFamily: FONTS.bold, fontSize: 28, color: '#fff', marginTop: 4 },
  sectionLabel: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  methodRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.lg },
  methodChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodChipActive: { borderColor: COLORS.primary },
  methodIcon: { fontSize: 24, marginBottom: 4 },
  methodLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary },
  methodLabelActive: { color: COLORS.primary, fontFamily: FONTS.bold },
  section: { marginBottom: SIZES.lg },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary, marginBottom: SIZES.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    height: 52,
  },
  inputIcon: { marginRight: SIZES.sm },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    height: 64,
  },
  currency: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary, marginRight: SIZES.sm },
  amountInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text },
  quickRow: { flexDirection: 'row', marginTop: SIZES.md, gap: SIZES.sm },
  quickChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  feeLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary },
  feeValue: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
});

