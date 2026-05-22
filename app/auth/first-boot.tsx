import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FirstBootScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSetPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    await AsyncStorage.setItem('user_pin', pin);
    router.replace('/(os)/home' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up PIN</Text>
      <TextInput style={styles.input} placeholder="Enter PIN" value={pin} onChangeText={setPin} keyboardType="numeric" secureTextEntry maxLength={6} />
      <TextInput style={styles.input} placeholder="Confirm PIN" value={confirmPin} onChangeText={setConfirmPin} keyboardType="numeric" secureTextEntry maxLength={6} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Set PIN" onPress={handleSetPin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, marginBottom: 12, fontSize: 16 },
  error: { color: '#f44336', marginBottom: 12, textAlign: 'center' }
});
