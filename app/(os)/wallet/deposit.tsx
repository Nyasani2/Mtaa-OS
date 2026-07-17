// app/(os)/wallet/deposit.tsx — Clean Deposit Screen
// Uses expo-clipboard (installed), NOT react-native Clipboard (deprecated)

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from '@/domains/wallet/hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const DEPOSIT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait', color: '#00A650', desc: 'STK Push to your phone' },
  { id: 'card', label: 'Card', icon: 'card', color: '#2563EB', desc: 'Visa, Mastercard, Amex' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business', color: '#F59E0B', desc: 'KCB, Equity, Co-op' },
  { id: 'crypto', label: 'Crypto', icon: 'logo-bitcoin', color: '#8B5CF6', desc: 'USDT, BTC, ETH' },
];

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deposit, getAvailableBalance, getFormattedBalance, isProcessing, error, clearError } = useWallet();
  const { user } = useAuthStore();

  const [method, setMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const quickAmounts = ['500', '1000', '5000', '10000'];

  const handleDeposit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const amt = parseFloat(amount);
    if (amt < 10) {
      Alert.alert('Error', 'Minimum deposit is KES 10');
      return;
    }

    setLoading(true);
    clearError?.();

    try {
      const result = await deposit(amt, method, phoneNumber);
      if (!result.success) {
        Alert.alert('Deposit Failed', result.error || 'Unknown error');
        return;
      }
      setDepositResult(result);

      if (method === 'mpesa') {
        Alert.alert(
          'STK Push Sent',
          'Check your phone and enter your M-Pesa PIN to complete the deposit.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (method === 'bank') {
        Alert.alert('Bank Transfer Instructions', 'Please complete the bank transfer using the provided details. Funds will reflect within 1-24 hours.', [{ text: 'OK' }]);
      } else if (method === 'crypto') {
        Alert.alert('Crypto Deposit', 'Send the specified amount to the provided address. Funds will reflect after confirmations.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Deposit Initiated', 'Your deposit is being processed.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  }, [amount, method, phoneNumber, deposit, clearError, router]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>{getFormattedBalance()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Deposit Method</Text>
        <View style={styles.methodGrid}>
          {DEPOSIT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodCard, method === m.id && styles.methodCardActive]}
              onPress={() => { setMethod(m.id); setDepositResult(null); }}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: m.color + '20' }]}>
                <Ionicons name={m.icon as any} size={24} color={m.color} />
              </View>
              <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Amount (KES)</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>KES</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            maxLength={10}
          />
        </View>

        <View style={styles.quickRow}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickChip, amount === amt && styles.quickChipActive]}
              onPress={() => setAmount(amt)}
            >
              <Text style={[styles.quickText, amount === amt && styles.quickTextActive]}>
                KES {parseInt(amt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'mpesa' && (
          <View style={styles.section}>
            <Text style={styles.label}>M-Pesa Phone Number</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="2547XXXXXXXX"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={12}
              />
            </View>
            <Text style={styles.hint}>Enter your M-Pesa registered number</Text>
          </View>
        )}

        {method === 'bank' && depositResult?.instructions && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Bank Transfer Details</Text>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Bank</Text>
              <Text style={styles.instructionValue}>{depositResult.instructions.bank_name}</Text>
            </View>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Account Name</Text>
              <Text style={styles.instructionValue}>{depositResult.instructions.account_name}</Text>
            </View>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Account Number</Text>
              <View style={styles.copyRow}>
                <Text style={styles.instructionValue}>{depositResult.instructions.account_number}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(depositResult.instructions.account_number)}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Reference</Text>
              <View style={styles.copyRow}>
                <Text style={styles.instructionValue}>{depositResult.instructions.reference}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(depositResult.instructions.reference)}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.instructionNote}>{depositResult.instructions.instructions}</Text>
          </View>
        )}

        {method === 'crypto' && depositResult?.instructions && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Crypto Deposit</Text>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Network</Text>
              <Text style={styles.instructionValue}>{depositResult.instructions.network}</Text>
            </View>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Address</Text>
              <View style={styles.copyRow}>
                <Text style={styles.instructionValue} numberOfLines={1}>{depositResult.instructions.address}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(depositResult.instructions.address)}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.instructionNote}>{depositResult.instructions.instructions}</Text>
          </View>
        )}

        {method === 'card' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Card Payment</Text>
            <Text style={styles.instructionNote}>
              Card payment integration is coming soon. For now, please use M-Pesa or Bank Transfer to deposit funds.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.depositBtn, (!amount || loading || isProcessing) && styles.depositBtnDisabled]}
          onPress={handleDeposit}
          disabled={!amount || loading || isProcessing}
        >
          {loading || isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="arrow-down" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.depositBtnText}>Deposit KES {amount || '0'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: SIZES.xl }} />
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
  sectionLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  methodCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: { borderColor: COLORS.primary },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodLabel: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  methodLabelActive: { color: COLORS.primary },
  methodDesc: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    height: 64,
  },
  currency: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary, marginRight: SIZES.sm },
  amountInput: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.text,
  },
  quickRow: {
    flexDirection: 'row',
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  quickChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  quickTextActive: { color: '#fff', fontFamily: FONTS.bold },
  section: { marginTop: SIZES.lg },
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
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginTop: SIZES.lg,
  },
  instructionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  instructionLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary },
  instructionValue: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instructionNote: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: SIZES.md, lineHeight: 20 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginTop: SIZES.lg,
    gap: 8,
  },
  errorText: { fontFamily: FONTS.medium, fontSize: 14, color: '#EF4444', flex: 1 },
  depositBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.lg,
  },
  depositBtnDisabled: { opacity: 0.5 },
  depositBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
});
