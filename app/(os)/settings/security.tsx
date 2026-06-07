import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function SecurityScreen() {
  const router = useRouter();
  const { setPinVerified } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');

  const setPinCode = () => {
    if (pin.length !== 4) {
      setMessage('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setMessage('PINs do not match');
      return;
    }
    // Store PIN securely (in real app, use secure storage)
    setPinVerified(true);
    setMessage('PIN set successfully');
    setTimeout(() => router.back(), 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Security</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="Enter 4-digit PIN"
        placeholderTextColor="#666"
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        placeholder="Confirm PIN"
        placeholderTextColor="#666"
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable style={styles.button} onPress={setPinCode}>
        <Text style={styles.buttonText}>Set PIN</Text>
      </Pressable>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  message: { color: '#0f0', fontSize: 14, marginBottom: 8 },
  button: { backgroundColor: '#0f0', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 12, alignItems: 'center' },
  backText: { color: '#f00', fontSize: 14 },
});
