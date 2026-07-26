import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function CallScreen() {
  const { number } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'calling' | 'connected' | 'ended'>('calling');

  const endCall = () => {
    setStatus('ended');
    setTimeout(() => router.back(), 500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.status}>{status}</Text>

      <Pressable style={styles.endBtn} onPress={endCall}>
        <Text style={styles.endText}>End Call</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 16 },
  status: { fontSize: 16, color: '#0f0', textTransform: 'capitalize', marginBottom: 40 },
  endBtn: { backgroundColor: '#f00', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 32 },
  endText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
