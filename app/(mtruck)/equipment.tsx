import { View, Text, StyleSheet } from 'react-native';

export default function EquipmentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heavy Equipment</Text>
      <Text style={styles.subtitle}>Coming soon — equipment catalog</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
