// app/auth/lock-screen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useOSShell } from '@/lib/shell/use-os-shell';

export default function LockScreen() {
  const { unlockWithPin, unlockWithBiometric } = useOSShell();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinUnlock = async () => {
    const success = await unlockWithPin(pin);
    if (!success) setError('Invalid PIN');
  };

  const handleBiometric = async () => {
    await unlockWithBiometric();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MTAA OS Locked</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handlePinUnlock}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.bioButton]} onPress={handleBiometric}>
        <Text style={[styles.buttonText, styles.bioText]}>Use Biometric</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0a0a0a' },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 30 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 16, color: '#fff', fontSize: 18, backgroundColor: '#1a1a1a', marginBottom: 16 },
  button: { width: '100%', backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bioButton: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2563eb' },
  bioText: { color: '#3b82f6' },
  error: { color: '#ef4444', marginBottom: 12 },
});
