import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RevenueScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Ionicons name="cash" size={64} color="#059669" />
      <Text style={styles.title}>Revenue</Text>
      <Text style={styles.subtitle}>Tax filing and revenue collection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', alignItems: 'center', justifyContent: 'center', padding: 20 },
  back: { position: 'absolute', top: 60, left: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});
