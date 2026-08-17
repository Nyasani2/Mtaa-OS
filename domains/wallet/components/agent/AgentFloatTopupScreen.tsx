import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAgent } from '../../hooks/useAgent';

export default function AgentFloatTopupScreen() {
  const { agent, topup, loading } = useAgent();
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');

  if (!agent || agent.status !== 'active') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>Agent account not active</Text>
      </View>
    );
  }

  const handleTopup = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Invalid amount'); return; }
    if (pin.length !== 4) { Alert.alert('Error', 'PIN must be 4 digits'); return; }

    const res = await topup(amt, pin);
    if (res.success) {
      Alert.alert('Success', `Float topped up! New balance: KES ${res.float_balance?.toLocaleString()}`);
      setAmount(''); setPin('');
    } else {
      Alert.alert('Error', res.error || 'Top-up failed');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 12, color: '#888' }}>Current Float</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold' }}>KES {agent.float_balance?.toLocaleString()}</Text>
      </View>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Top Up Float</Text>

      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Amount (KES)</Text>
        <TextInput
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Wallet PIN</Text>
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
          onPress={handleTopup}
          disabled={loading}
          style={{ backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {loading ? 'Processing...' : 'Top Up Float'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

