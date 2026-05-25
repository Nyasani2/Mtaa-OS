// app/(wallet)/deposit.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { useWalletStore } from '@/hooks/useWalletStore';

type DepositMethod = 'bank' | 'mobile_money' | 'crypto' | 'qr';

export default function DepositScreen() {
  const { wallet } = useWalletStore();
  const [method, setMethod] = useState<DepositMethod>('mobile_money');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      // Process deposit based on method
      Alert.alert('Success', `Deposit of KES ${amt} initiated via ${method}`);
      setAmount('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Deposit Funds</Text>

      <View style={styles.methodContainer}>
        {(['mobile_money', 'bank', 'crypto', 'qr'] as DepositMethod[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.methodButton, method === m && styles.methodActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={method === m ? styles.methodActiveText : styles.methodText}>
              {m.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Amount (KES)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleDeposit} disabled={processing}>
        <Text style={styles.buttonText}>{processing ? 'Processing...' : 'Deposit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  methodContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  methodButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  methodActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  methodText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  methodActiveText: { fontSize: 13, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#059669', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
