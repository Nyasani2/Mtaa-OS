import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { useWalletStore } from 'app/(os)/wallet/hooks';
import { depositToWallet, getWalletTransactions } from '@/lib/services/wallet-service';
import { supabase } from '@/lib/supabase';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline' as const },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline' as const },
  { id: 'mobile', label: 'M-Pesa', icon: 'phone-portrait-outline' as const },
  { id: 'crypto', label: 'Crypto Deposit', icon: 'logo-bitcoin' as const },
];

const QUICK_AMOUNTS = [500, 1000, 5000, 10000, 50000];

export default function DepositScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccountId, addTransaction, syncBalance } = useWalletStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickAmount = useCallback((val: number) => {
    setAmount(val.toString());
  }, []);

  const validateCard = useCallback(() => {
    if (!cardNumber.replace(/\s/g, '').match(/^\d{13,19}$/)) {
      Alert.alert('Invalid Card', 'Please enter a valid card number (13-19 digits)');
      return false;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Invalid Expiry', 'Please enter expiry as MM/YY');
      return false;
    }
    if (!cvv.match(/^\d{3,4}$/)) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV (3-4 digits)');
      return false;
    }
    if (cardHolder.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name');
      return false;
    }
    return true;
  }, [cardNumber, expiry, cvv, cardHolder]);

  const validateBank = useCallback(() => {
    if (bankName.trim().length < 2) {
      Alert.alert('Invalid Bank', 'Please enter your bank name');
      return false;
    }
    if (!accountNumber.match(/^\d{8,20}$/)) {
      Alert.alert('Invalid Account', 'Please enter a valid account number');
      return false;
    }
    return true;
  }, [bankName, accountNumber]);

  const validateMobile = useCallback(() => {
    if (!mobileNumber.match(/^\d{9,12}$/)) {
      Alert.alert('Invalid Number', 'Please enter a valid M-Pesa number');
      return false;
    }
    return true;
  }, [mobileNumber]);

  const handleDeposit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount');
      return;
    }
    if (numAmount < 100) {
      Alert.alert('Minimum Deposit', 'Minimum deposit amount is KSh 100');
      return;
    }

    if (selectedMethod === 'card' && !validateCard()) return;
    if (selectedMethod === 'bank' && !validateBank()) return;
    if (selectedMethod === 'mobile' && !validateMobile()) return;

    setLoading(true);
    try {
      const success = await depositToWallet(
        user?.id || '',
        numAmount,
        `Deposit via ${selectedMethod}`,
        undefined,
        selectedMethod
      );

      if (!success) {
        throw new Error('Deposit failed on server');
      }

      // Get updated wallet
      const { data: wallet } = await supabase
        .from("wallet_accounts")
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (wallet) {
        syncBalance(activeAccountId, wallet.balance);
      }

      // Create local transaction record
      addTransaction({
        id: Date.now().toString(),
        type: 'credit',
        amount: numAmount,
        currency: 'KES',
        description: `Deposit via ${selectedMethod}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceAfter: (activeAccount?.balance || 0) + numAmount,
      });

      setLoading(false);
      Alert.alert(
        'Deposit Successful',
        `KSh ${numAmount.toLocaleString()} has been deposited to your wallet.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Deposit Failed', err.message || 'Something went wrong');
    }
  }, [amount, selectedMethod, user, activeAccountId, activeAccount, validateCard, validateBank, validateMobile, syncBalance, addTransaction, router]);

  const formatCardNumber = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 19);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  }, []);

  const formatExpiry = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Deposit</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount Input */}
        <View style={styles.card}>
          <Text style={styles.label}>Amount (KSh)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>KSh</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => handleQuickAmount(val)}
                style={[styles.quickBtn, amount === val.toString() && styles.quickBtnActive]}
              >
                <Text style={[styles.quickText, amount === val.toString() && styles.quickTextActive]}>
                  {val.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.label}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setSelectedMethod(method.id)}
              style={[styles.methodRow, selectedMethod === method.id && styles.methodRowActive]}
            >
              <Ionicons
                name={method.icon}
                size={22}
                color={selectedMethod === method.id ? '#10b981' : '#9ca3af'}
              />
              <Text style={[styles.methodText, selectedMethod === method.id && styles.methodTextActive]}>
                {method.label}
              </Text>
              <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
                {selectedMethod === method.id && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Form */}
        {selectedMethod === 'card' && (
          <View style={styles.card}>
            <Text style={styles.label}>Card Details</Text>
            <TextInput
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              placeholder="Card Number"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              maxLength={23}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                value={expiry}
                onChangeText={(text) => setExpiry(formatExpiry(text))}
                placeholder="MM/YY"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={5}
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                placeholder="CVV"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={[styles.input, { flex: 1, marginLeft: 12 }]}
              />
            </View>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Cardholder Name"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
        )}

        {/* Bank Transfer Form */}
        {selectedMethod === 'bank' && (
          <View style={styles.card}>
            <Text style={styles.label}>Bank Details</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="Bank Name"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
            <TextInput
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\D/g, '').slice(0, 20))}
              placeholder="Account Number"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        )}

        {/* M-Pesa Form */}
        {selectedMethod === 'mobile' && (
          <View style={styles.card}>
            <Text style={styles.label}>M-Pesa Number</Text>
            <TextInput
              value={mobileNumber}
              onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 12))}
              placeholder="2547XXXXXXXX"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Text style={styles.hint}>You will receive an M-Pesa STK push to complete payment</Text>
          </View>
        )}

        {/* Crypto Deposit Info */}
        {selectedMethod === 'crypto' && (
          <View style={styles.card}>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Ionicons name="logo-bitcoin" size={48} color="#f59e0b" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 12 }}>
                Crypto Deposit
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                Use the Crypto tab in your wallet to deposit Bitcoin, Ethereum, or USDT directly.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(os)/wallet/crypto')}
                style={styles.cryptoBtn}
              >
                <Text style={styles.cryptoBtnText}>Go to Crypto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Deposit Button */}
        <TouchableOpacity
          onPress={handleDeposit}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={[styles.confirmBtn, (!amount || parseFloat(amount) <= 0) && styles.confirmBtnDisabled]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.confirmText}>
              Deposit KSh {amount ? parseFloat(amount).toLocaleString() : '0'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { color: '#fff', fontSize: 24, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, color: '#fff', fontSize: 32, fontWeight: '700' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  quickBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  quickText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  quickTextActive: { color: '#fff' },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  methodRowActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' },
  methodText: { flex: 1, marginLeft: 12, color: '#fff', fontSize: 15, fontWeight: '600' },
  methodTextActive: { color: '#10b981' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4b5563', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#10b981', backgroundColor: '#10b981' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  row: { flexDirection: 'row' },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 8 },
  cryptoBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  cryptoBtnText: { color: '#000', fontWeight: '700' },
  confirmBtn: { backgroundColor: '#10b981', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  confirmBtnDisabled: { backgroundColor: '#333', opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

