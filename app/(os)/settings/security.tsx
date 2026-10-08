// @ts-nocheck
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function SecurityScreen() {
  const router = useRouter();
  const { setPin } = useAuthStore();
  const [pin, setPinState] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      setMessage('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setMessage('PINs do not match');
      return;
    }
    
    setLoading(true);
    try {
      await setPin(pin);
      setMessage('PIN set successfully!');
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setMessage(error.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set App PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPinState}
        placeholder="Enter 4-digit PIN"
        placeholderTextColor="#64748b"
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        placeholder="Confirm PIN"
        placeholderTextColor="#64748b"
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
      {message ? <Text style={[styles.message, message.includes('success') ? styles.success : styles.error]}>{message}</Text> : null}
      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSetPin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Setting...' : 'Set PIN'}</Text>
      </Pressable>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 32 },
  input: { backgroundColor: '#1e293b', color: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 24, letterSpacing: 8, textAlign: 'center', borderWidth: 1, borderColor: '#334155' },
  message: { fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  success: { color: '#10b981' },
  error: { color: '#ef4444' },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 24, alignItems: 'center' },
  backText: { color: '#94a3b8', fontSize: 16 },
});
