import { View, Text, StyleSheet } from 'react-native';
export default function PoliceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Police</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 24, color: '#fff', fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});
