import { View, Text, Pressable, StyleSheet } from 'react-native';
import { railRegistry } from '@/lib/integrations/rails/rail-registry';

export default function CommandCentre() {
  const rails = railRegistry.list();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MTAA Command Centre</Text>
      <Text style={styles.subtitle}>Active Financial Rails</Text>

      {rails.map((r, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={styles.type}>{r.type}</Text>
          <Text style={styles.status}>● Online</Text>
        </View>
      ))}

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Add New Rail</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  type: { color: '#888', fontSize: 12, marginTop: 4 },
  status: { color: '#00D26A', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#00D26A', borderRadius: 12, padding: 16, marginTop: 24 },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: 'bold' },
});
