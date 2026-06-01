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
import { Ionicons } from '@expo/vector-icons';
import { verifyPin } from '@/lib/security/pin-engine';
import { useOSShell } from '@/lib/shell/use-os-shell';

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
      const { valid, state } = await verifyPin(pin);
      if (valid) {
        await refreshPinState();
        unlock();
        router.replace('/(os)');
      } else {
        setError(`Invalid PIN. ${state.attemptsRemaining} attempts remaining.`);
        if (state.isLocked) {
          Alert.alert('Locked', 'Too many failed attempts. Please wait 30 minutes.');
        }
      }
    } catch (e) {
      setError('Verification failed');
    } finally {
      setLoading(false);
      setPin('');
    }
  }, [pin, router, unlock, refreshPinState]);

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={48} color="#6366F1" />
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Unlock MTAA OS</Text>

      <View style={styles.pinContainer}>
        {pin.split('').map((_, i) => (
          <View key={i} style={styles.pinDot}>
            <View style={styles.pinDotInner} />
          </View>
        ))}
        {Array.from({ length: 6 - pin.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.pinDotEmpty} />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.hiddenInput}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        autoFocus
        caretHidden
        onSubmitEditing={handleUnlock}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUnlock}
        disabled={loading || pin.length < 4}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Unlock</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#999', marginTop: 8, marginBottom: 40 },
  pinContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  pinDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
  pinDotEmpty: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#333' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  button: { backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%', maxWidth: 280 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
