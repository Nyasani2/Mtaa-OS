import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useAgent } from '../../hooks/useAgent';

export default function AgentTransactionScreen({ mode }: { mode: 'deposit' | 'withdrawal' }) {
  const { agent, deposit, withdraw, loading } = useAgent();
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<any>(null);

  if (!agent || agent.status !== 'active') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>Agent account not active</Text>
      </View>
    );
  }

  const isDeposit = mode === 'deposit';
  const title = isDeposit ? 'Customer Deposit' : 'Customer Withdrawal';
  const actionColor = isDeposit ? '#28a745' : '#dc3545';

  const handleSubmit = async () => {
    if (!customerPhone || !amount || !pin) {
      Alert.alert('Error', 'Fill all fields'); return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Invalid amount'); return; }
    if (pin.length !== 4) { Alert.alert('Error', 'PIN must be 4 digits'); return; }

    const res = isDeposit
      ? await deposit(customerPhone, amt, pin, customerName || undefined)
      : await withdraw(customerPhone, amt, pin, customerName || undefined);

    if (res.success) {
      setResult(res);
      setCustomerPhone(''); setCustomerName(''); setAmount(''); setPin('');
    } else {
      Alert.alert('Error', res.error || 'Transaction failed');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      {/* Float Balance Header */}
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#888' }}>Current Float</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>KES {agent.float_balance?.toLocaleString()}</Text>
        <Text style={{ fontSize: 12, color: actionColor, marginTop: 4 }}>
          {isDeposit ? 'Float will decrease by amount' : 'Float will increase by amount'}
        </Text>
      </View>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{title}</Text>

      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Customer Phone</Text>
        <TextInput
          placeholder="2547XX XXX XXX"
          keyboardType="phone-pad"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Customer Name (optional)</Text>
        <TextInput
          placeholder="Customer name"
          value={customerName}
          onChangeText={setCustomerName}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Amount (KES)</Text>
        <TextInput
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Your PIN</Text>
        <TextInput
          placeholder="4-digit PIN"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={pin}
          onChangeText={setPin}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 20 }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: actionColor, padding: 16, borderRadius: 8, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {loading ? 'Processing...' : isDeposit ? 'Receive Cash & Credit Wallet' : 'Give Cash & Debit Wallet'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal visible={!!result} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 10 }}>✅</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Transaction Complete</Text>

            <View style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 10, marginVertical: 16 }}>
              <Text style={{ fontSize: 14, color: '#333' }}>Reference: <Text style={{ fontWeight: 'bold' }}>{result?.reference}</Text></Text>
              <Text style={{ fontSize: 14, color: '#333', marginTop: 6 }}>Amount: <Text style={{ fontWeight: 'bold' }}>KES {amount}</Text></Text>
              <Text style={{ fontSize: 14, color: '#333', marginTop: 6 }}>Commission: <Text style={{ fontWeight: 'bold', color: '#ffc107' }}>KES {result?.commission}</Text></Text>
            </View>

            {/* WITHDRAWAL ONLY: Disburse Alert */}
            {!isDeposit && result?.confirmation_message && (
              <View style={{ backgroundColor: '#fff3cd', borderWidth: 2, borderColor: '#ffc107', padding: 16, borderRadius: 10, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#856404', marginBottom: 6 }}>🚨 DISBURSE FUNDS NOW</Text>
                <Text style={{ fontSize: 13, color: '#856404' }}>{result?.disburse_instruction}</Text>
                <Text style={{ fontSize: 12, color: '#856404', marginTop: 6 }}>{result?.confirmation_message}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setResult(null)}
              style={{ backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

