import { View, Text, StyleSheet } from 'react-native';
import { railMonitor } from '@/lib/integrations/monitoring/rail-status';

export default function CommandHome() {
  const rails = railMonitor.all();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MTAA Financial Command Centre</Text>

      {rails.length === 0 && (
        <Text style={styles.empty}>No rails registered yet</Text>
      )}

      {rails.map((r, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={[styles.status, r.status === 'online' ? styles.online : styles.offline]}>
            {r.status}
          </Text>
          <Text style={styles.latency}>{r.latency_ms}ms</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1A1A1A', padding: 16, marginBottom: 10, borderRadius: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  status: { marginTop: 4, fontSize: 12 },
  online: { color: '#00D26A' },
  offline: { color: '#EF4444' },
  latency: { color: '#888', marginTop: 2, fontSize: 12 },
});
