import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyPin } from '@/lib/security/pin-engine';
import { useOSShell } from '@/lib/shell/use-os-shell';

interface PinVerificationResult {
  valid: boolean;
  state: {
    attemptsRemaining: number;
    isLocked: boolean;
  };
}

export default function LockScreen() {
  const router = useRouter();
  const { unlock, refreshPinState } = useOSShell();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = useCallback(async () => {
    if (pin.length < 4) {
      setError('Enter your PIN');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await verifyPin(pin) as unknown as PinVerificationResult;
      if (result.valid) {
        await refreshPinState();
        unlock();
        router.replace('/(os)');
      } else {
        setError(`Invalid PIN. ${result.state.attemptsRemaining} attempts remaining.`);
        if (result.state.isLocked) {
          Alert.alert('Locked', 'Too many failed attempts. Please wait.');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setLoading(false);
      setPin('');
    }
  }, [pin, router, unlock, refreshPinState]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        secureTextEntry
        maxLength={6}
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={handleUnlock}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleUnlock} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unlock</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 20, textAlign: 'center', letterSpacing: 8 },
  button: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 12 }
});
