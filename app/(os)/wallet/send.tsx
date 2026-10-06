// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function SendMoneyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      // TODO: Implement actual send logic
      Alert.alert('Success', `Sent KES ${amount} to ${recipient}`);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Money</Text>
      <Text style={styles.sub}>Transfer to another user</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Recipient phone or username"
        placeholderTextColor="#8E8E93"
        value={recipient}
        onChangeText={setRecipient}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Amount (KES)"
        placeholderTextColor="#8E8E93"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      
      <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Money'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { color: '#8E8E93', marginBottom: 16, fontSize: 12 },
  input: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  cancel: { color: '#FF3B30', textAlign: 'center', padding: 8 },
});
