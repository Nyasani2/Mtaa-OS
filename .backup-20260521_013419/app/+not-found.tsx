import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page not found</Text>
      <Link href="/" style={styles.link}>Go to Launcher</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' },
  title: { fontSize: 72, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 18, color: '#888', marginTop: 8 },
  link: { marginTop: 24, color: '#00D26A', fontSize: 16 },
});
