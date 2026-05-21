import { View, Text, StyleSheet } from 'react-native';
import { railRegistry } from '@/lib/integrations/rails/railRegistry';

export default function CommandHome() {
  const rails = railRegistry.list();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MTAA Financial Command Centre</Text>

      {rails.length === 0 && (
        <Text style={styles.empty}>No rails registered yet</Text>
      )}

      {rails.map((r, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{r}</Text>
          <Text style={styles.status}>● Active Rail</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  status: { color: '#00D26A', marginTop: 4 },
});
