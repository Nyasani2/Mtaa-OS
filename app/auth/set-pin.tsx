import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SetPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSetPin = () => {
    if (pin.length !== 4) {
      setErrorMsg('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match');
      return;
    }
    // TODO: Store PIN securely
    router.replace('/(os)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set Your PIN</Text>
      <Text style={styles.subtitle}>Create a 4-digit PIN to secure your wallet</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 4-digit PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm PIN"
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
      />
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSetPin}>
        <Text style={styles.buttonText}>Set PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, textAlign: 'center', letterSpacing: 8 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
});
