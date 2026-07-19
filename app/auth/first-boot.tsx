import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { setPin } from '@/lib/security/pin-engine';

export default function FirstBootScreen() {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSetPin() {
    if (pin.length < 6) { setError('PIN must be at least 6 digits'); return; }
    if (pin !== confirmPin) { setError('PINs do not match'); return; }
    setLoading(true); setError('');
    try {
      await setPin(pin);
      router.replace('/(os)');
    } catch (e: any) {
      setError(e?.message || 'Failed to set PIN. Try again.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MTAA OS</Text>
      <Text style={styles.subtitle}>Set your PIN</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={6}
        value={pin}
        onChangeText={setPinValue}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={6}
        value={confirmPin}
        onChangeText={setConfirmPin}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSetPin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Setting...' : 'Set PIN'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 18 },
  button: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', marginBottom: 12, fontSize: 14 }
});
