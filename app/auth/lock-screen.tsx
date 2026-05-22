import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    const storedPin = await AsyncStorage.getItem('user_pin');
    if (pin === storedPin) {
      router.replace('/' as any);
    } else {
      setError('Invalid PIN');
    }
  };

  const handleForgot = () => {
    router.push('/auth/reset-pin' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <TextInput style={styles.input} placeholder="PIN" value={pin} onChangeText={setPin} keyboardType="numeric" secureTextEntry maxLength={6} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Unlock" onPress={handleUnlock} />
      <Button title="Forgot PIN?" onPress={handleForgot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, marginBottom: 12, fontSize: 16 },
  error: { color: '#f44336', marginBottom: 12, textAlign: 'center' }
});
