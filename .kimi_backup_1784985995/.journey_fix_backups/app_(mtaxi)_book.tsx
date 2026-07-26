import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function BookScreen() {
  const { type, price } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'searching' | 'found' | 'riding' | 'done'>('searching');

  const priceNum = parseFloat(price as string) || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Booking {type}</Text>
      <Text style={styles.price}>KES {priceNum.toFixed(2)}</Text>

      <View style={styles.statusBox}>
        <Text style={styles.status}>Status: {status}</Text>
      </View>

      {status === 'searching' && (
        <Pressable style={styles.button} onPress={() => setStatus('found')}>
          <Text style={styles.buttonText}>Driver Found (Simulate)</Text>
        </Pressable>
      )}

      {status === 'found' && (
        <Pressable style={styles.button} onPress={() => setStatus('riding')}>
          <Text style={styles.buttonText}>Start Ride</Text>
        </Pressable>
      )}

      {status === 'riding' && (
        <Pressable style={styles.button} onPress={() => setStatus('done')}>
          <Text style={styles.buttonText}>Complete Ride</Text>
        </Pressable>
      )}

      {status === 'done' && (
        <Pressable style={styles.button} onPress={() => router.push('/mtaxi' as any)}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  price: { fontSize: 32, color: '#0f0', fontWeight: 'bold', marginBottom: 24 },
  statusBox: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 24 },
  status: { fontSize: 16, color: '#fff', textTransform: 'capitalize' },
  button: { backgroundColor: '#0f0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, minWidth: 200 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
