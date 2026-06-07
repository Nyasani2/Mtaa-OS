import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function BodaRequest() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  const handleRequest = () => {
    // TODO: wire to ride service
    router.push('/(mtaxi)/tracking');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Boda Boda</Text>
      <TextInput style={styles.input} placeholder="Pickup location" placeholderTextColor="#666" value={pickup} onChangeText={setPickup} />
      <TextInput style={styles.input} placeholder="Dropoff location" placeholderTextColor="#666" value={dropoff} onChangeText={setDropoff} />
      <TouchableOpacity style={styles.button} onPress={handleRequest}>
        <Text style={styles.buttonText}>Find Rider</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 24 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#00d26a', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
