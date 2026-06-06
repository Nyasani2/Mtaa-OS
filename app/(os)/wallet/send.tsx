import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/hooks/useWalletStore';

export default function SendScreen() {
  const router = useRouter();
  const { balance, send } = useWalletStore();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!to || isNaN(amt) || amt <= 0 || amt > balance) return;
    setLoading(true);
    await send(to, amt);
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Send Money</Text>
      <Text style={styles.balance}>Available: {balance.toFixed(2)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Recipient ID or Phone"
        placeholderTextColor="#666"
        value={to}
        onChangeText={setTo}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Pressable style={styles.button} onPress={handleSend} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send'}</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  balance: { fontSize: 14, color: '#888', marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#0f0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 12, alignItems: 'center' },
  backText: { color: '#f00', fontSize: 14 },
});
