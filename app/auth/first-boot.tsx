import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { pinEngine } from '@/lib/security/pin-engine';

export default function FirstBootScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSetPin() {
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    if (pin !== confirmPin) { setError('PINs do not match'); return; }
    setLoading(true); setError('');
    const ok = await pinEngine.setPin(pin);
    if (ok) { router.replace('/(os)'); }
    else { setError('Failed to set PIN. Try again.'); }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MTAA OS</Text>
      <Text style={styles.subtitle}>Set a PIN to secure your device</Text>
      <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Enter PIN" placeholderTextColor="#999" />
      <TextInput style={styles.input} value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Confirm PIN" placeholderTextColor="#999" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSetPin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Setting...' : 'Set PIN & Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f0f0f' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 12 },
});
