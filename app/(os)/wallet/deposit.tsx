import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Clipboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useWallet } from '@/hooks/useWallet';
import { mpesaAdapter } from '@/lib/integrations/rails/mpesaAdapter';

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallet, walletId, deposit } = useWallet();

  const [method, setMethod] = useState<'mpesa' | 'bank' | 'card' | 'crypto'>('mpesa');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyWalletId = useCallback(() => {
    if (walletId) {
      Clipboard.setString(walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [walletId]);

  const handleMpesaDeposit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Enter a valid M-Pesa phone number (2547XXXXXXXX)');
      return;
    }
    setLoading(true);
    try {
      // Use the REAL mpesaAdapter that calls the deployed edge function
      const result = await mpesaAdapter.stkPush({
        phone: phone,
        amount: parseFloat(amount),
        accountReference: walletId || 'MTAA-DEPOSIT',
        description: 'MTAA Wallet Deposit',
      });

      if (result.success) {
        Alert.alert(
          'STK Push Sent',
          `Check your phone ${phone} for M-Pesa prompt. Enter PIN to complete deposit of KES ${amount}.\n\nCheckout ID: ${result.checkoutRequestID || 'N/A'}`,
          [{ text: 'OK', onPress: () => { setAmount(''); setPhone(''); } }]
        );
      } else {
        Alert.alert('Deposit Failed', result.message || 'M-Pesa STK push failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to initiate M-Pesa deposit');
    } finally {
      setLoading(false);
    }
  }, [amount, phone, walletId]);

  const handleBankDeposit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await deposit(parseFloat(amount));
      Alert.alert('Success', `Bank deposit of KES ${amount} initiated. Funds will reflect within 24 hours.`);
      setAmount('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Bank deposit failed');
    } finally {
      setLoading(false);
    }
  }, [amount, deposit]);

  const handleCardDeposit = useCallback(async () => {
    Alert.alert('Coming Soon', 'Card deposits via Stripe/Flutterwave will be available shortly.');
  }, []);

  const handleCryptoDeposit = useCallback(async () => {
    Alert.alert('Coming Soon', 'Crypto deposits via Binance integration will be available shortly.');
  }, []);

  const handleDeposit = useCallback(async () => {
    switch (method) {
      case 'mpesa': return handleMpesaDeposit();
      case 'bank': return handleBankDeposit();
      case 'card': return handleCardDeposit();
      case 'crypto': return handleCryptoDeposit();
    }
  }, [method, handleMpesaDeposit, handleBankDeposit, handleCardDeposit, handleCryptoDeposit]);

  const quickAmounts = ['500', '1000', '5000', '10000'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet ID Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Your Wallet ID</Text>
          <View style={styles.walletIdRow}>
            <Text style={styles.walletId}>{walletId || 'Loading...'}</Text>
            <TouchableOpacity onPress={copyWalletId} style={styles.copyBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.walletHint}>Share this ID to receive funds</Text>
        </View>

        {/* Method Selector */}
        <Text style={styles.sectionTitle}>Deposit Method</Text>
        <View style={styles.methodRow}>
          {(['mpesa', 'bank', 'card', 'crypto'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
            >
              <Ionicons
                name={
                  m === 'mpesa' ? 'phone-portrait' :
                  m === 'bank' ? 'business' :
                  m === 'card' ? 'card' : 'logo-bitcoin'
                }
                size={20}
                color={method === m ? '#fff' : COLORS.textSecondary}
              />
              <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
                {m === 'mpesa' ? 'M-Pesa' : m === 'bank' ? 'Bank' : m === 'card' ? 'Card' : 'Crypto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Input */}
        <Text style={styles.sectionTitle}>Amount (KES)</Text>
        <View style={styles.amountInputBox}>
          <Text style={styles.currency}>KES</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickRow}>
          {quickAmounts.map(amt => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, amount === amt && styles.quickBtnActive]}
              onPress={() => setAmount(amt)}
            >
              <Text style={[styles.quickText, amount === amt && styles.quickTextActive]}>
                {amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* M-Pesa Phone Input */}
        {method === 'mpesa' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>M-Pesa Phone Number</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="2547XXXXXXXX"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
              />
            </View>
            <Text style={styles.hint}>Enter the M-Pesa number to receive STK push</Text>
          </View>
        )}

        {/* Bank Instructions */}
        {method === 'bank' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Bank Transfer</Text>
            <Text style={styles.instructionText}>
              {'Bank: KCB\n'}
              {'Account Name: MTAA Wallet\n'}
              {'Account No: '}
              <Text style={styles.bold}>{walletId || 'your-wallet-id'}</Text>
              {'\nReference: Deposit to Wallet'}
            </Text>
          </View>
        )}

        {/* Card Info */}
        {method === 'card' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Card Payment</Text>
            <Text style={styles.instructionText}>
              Secure card processing powered by Stripe.\nYour card details are encrypted end-to-end.
            </Text>
          </View>
        )}

        {/* Crypto Info */}
        {method === 'crypto' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Crypto Deposit</Text>
            <Text style={styles.instructionText}>
              {'Network: USDT (TRC20)\n'}
              {'Address: '}
              <Text style={styles.bold}>TYvQ...x9Z2</Text>
              {'\nMin deposit: $10'}
            </Text>
          </View>
        )}

        {/* Deposit Button */}
        <TouchableOpacity
          style={[styles.depositBtn, (!amount || loading) && styles.depositBtnDisabled]}
          onPress={handleDeposit}
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.depositBtnText}>
              {method === 'mpesa' ? 'Send M-Pesa Prompt' : 
               method === 'bank' ? 'Confirm Bank Deposit' :
               method === 'card' ? 'Pay with Card' : 'Deposit Crypto'} KES {amount || '0'}
            </Text>
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
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  walletCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  walletLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  walletIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  walletId: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, flex: 1 },
  copyBtn: { padding: SIZES.xs },
  walletHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: SIZES.sm },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  methodRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  methodTextActive: { color: '#fff' },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currency: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary, marginRight: SIZES.sm },
  amountInput: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.text,
    padding: 0,
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary },
  quickTextActive: { color: '#fff', fontFamily: FONTS.bold },
  section: { marginHorizontal: SIZES.md, marginTop: SIZES.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: { marginRight: SIZES.sm },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text },
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: SIZES.sm },
  instructionCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginTop: SIZES.md,
  },
  instructionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text, marginBottom: SIZES.sm },
  instructionText: { fontFamily: FONTS.regular, FontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  bold: { fontFamily: FONTS.bold, color: COLORS.text },
  depositBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
    alignItems: 'center',
  },
  depositBtnDisabled: { opacity: 0.5 },
  depositBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
});
