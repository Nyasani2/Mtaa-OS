import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';

const TOPUP_METHODS = [
  { id: 'mpesa', name: 'M-Pesa', icon: 'phone-portrait', color: '#10B981' },
  { id: 'card', name: 'Credit Card', icon: 'card', color: '#3B82F6' },
  { id: 'bank', name: 'Bank Transfer', icon: 'business', color: '#8B5CF6' },
];

export default function TopUpScreen() {
  const router = useRouter();
  const { topUpMpesa, topUpCard, isLoading, pendingMpesaTx, wallets } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (wallets.length === 0) { Alert.alert('No Wallet', 'Create a wallet first'); return; }

    if (method === 'mpesa') {
      if (!phone || phone.length < 10) { Alert.alert('Error', 'Enter valid M-Pesa number (07XX or 254XXX)'); return; }
      await topUpMpesa(phone, numAmount);
      Alert.alert('STK Push Sent', 'Check your phone to enter M-Pesa PIN');
    } else if (method === 'card') {
      if (!cardNumber || cardNumber.length < 14) { Alert.alert('Error', 'Enter valid card number'); return; }
      const mockToken = `tok_${Date.now()}`;
      await topUpCard(numAmount, mockToken);
      Alert.alert('Success', 'Card payment processed');
    } else {
      Alert.alert('Coming Soon', `${method} integration is being set up`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.amountInput} placeholder="0.00" placeholderTextColor="#64748B" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodsGrid}>
          {TOPUP_METHODS.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.methodCard, method === m.id && { borderColor: m.color, backgroundColor: m.color + '15' }]} onPress={() => setMethod(m.id)}>
              <Ionicons name={m.icon as any} size={28} color={method === m.id ? m.color : '#64748B'} />
              <Text style={[styles.methodText, method === m.id && { color: m.color }]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'mpesa' && (
          <>
            <Text style={styles.label}>M-Pesa Phone Number</Text>
            <TextInput style={styles.input} placeholder="07XX XXX XXX or 254XXXXXXXXX" placeholderTextColor="#64748B" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.hint}>You will receive an STK push on this number</Text>
          </>
        )}

        {method === 'card' && (
          <>
            <Text style={styles.label}>Card Number</Text>
            <TextInput style={styles.input} placeholder="1234 5678 9012 3456" placeholderTextColor="#64748B" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={19} />
            <View style={styles.cardRow}>
              <View style={styles.cardHalf}>
                <Text style={styles.label}>Expiry</Text>
                <TextInput style={styles.input} placeholder="MM/YY" placeholderTextColor="#64748B" value={cardExpiry} onChangeText={setCardExpiry} keyboardType="number-pad" maxLength={5} />
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.label}>CVV</Text>
                <TextInput style={styles.input} placeholder="123" placeholderTextColor="#64748B" value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" maxLength={4} secureTextEntry />
              </View>
            </View>
          </>
        )}

        {pendingMpesaTx && (
          <View style={styles.pendingBox}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.pendingText}>Waiting for M-Pesa confirmation...</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.topUpBtn, method === 'mpesa' && { backgroundColor: '#10B981' }, method === 'card' && { backgroundColor: '#3B82F6' }]} onPress={handleTopUp} disabled={isLoading}>
          <Text style={styles.topUpBtnText}>{isLoading ? 'Processing...' : `Pay ${amount || '0'}`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 20 },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 12, marginTop: 16 },
  amountInput: { backgroundColor: '#1E293B', color: '#fff', padding: 20, borderRadius: 16, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { width: '47%', backgroundColor: '#1E293B', padding: 16, borderRadius: 14, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent' },
  methodText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: '#1E293B', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16 },
  hint: { color: '#64748B', fontSize: 12, marginTop: 4 },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardHalf: { flex: 1 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#10B98115', padding: 14, borderRadius: 12, marginTop: 16 },
  pendingText: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  topUpBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  topUpBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
