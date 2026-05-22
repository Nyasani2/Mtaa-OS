import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PoliceScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Ionicons name="shield" size={64} color="#1E40AF" />
      <Text style={styles.title}>Police</Text>
      <Text style={styles.subtitle}>Incident reporting and emergency response</Text>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>Report Incident</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>Emergency SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', alignItems: 'center', justifyContent: 'center', padding: 20 },
  back: { position: 'absolute', top: 60, left: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
  actionBtn: { backgroundColor: '#1E40AF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16, width: 200, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
