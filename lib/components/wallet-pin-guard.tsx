import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { pinEngine } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface WalletPinGuardProps {
  children: React.ReactNode;
  onVerify?: () => void;
}

export const WalletPinGuard: React.FC<WalletPinGuardProps> = ({ children, onVerify }) => {
  const { user } = useAuthStore();
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (verified) return <>{children}</>;

  const handleVerify = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }
    const valid = await pinEngine.verifyPin(user.id, pin);
    if (valid) {
      setVerified(true);
      setError('');
      onVerify?.();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        placeholder="******"
        placeholderTextColor="#555"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={handleVerify}>
        <Text style={styles.btnText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 18, textAlign: 'center', letterSpacing: 8, marginBottom: 12 },
  error: { color: '#ff4444', marginBottom: 12 },
  btn: { backgroundColor: '#00d4ff', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
