import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/useAuthStore';

export default function ReceiveScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Receive Money</Text>
      <Text style={styles.label}>Your ID / Phone</Text>
      <Text style={styles.code}>{user?.id ?? 'Not logged in'}</Text>
      <Text style={styles.hint}>Share this with the sender</Text>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  code: { fontSize: 18, color: '#0f0', fontWeight: 'bold', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8 },
  hint: { fontSize: 12, color: '#666', marginTop: 12 },
  backButton: { marginTop: 32, backgroundColor: '#222', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  backText: { color: '#fff', fontWeight: '600' },
});
