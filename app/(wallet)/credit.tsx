// app/(wallet)/credit.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useWalletStore } from '@/hooks/useWalletStore';

export default function CreditScreen() {
  const { wallet } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setRequesting(true);
    try {
      Alert.alert('Success', `Credit request for KES ${amt} submitted`);
      setAmount('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>GoFund Credit</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Credit</Text>
        <Text style={styles.balance}>KES {wallet?.credit_limit?.toLocaleString() ?? '0'}</Text>
      </View>

      <Text style={styles.label}>Request Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleRequest} disabled={requesting}>
        <Text style={styles.buttonText}>{requesting ? 'Requesting...' : 'Request Credit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  balanceCard: { backgroundColor: '#1e40af', padding: 20, borderRadius: 12, marginBottom: 24 },
  balanceLabel: { color: '#93c5fd', fontSize: 14 },
  balance: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
