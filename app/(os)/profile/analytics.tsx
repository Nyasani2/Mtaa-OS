import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function AnalyticsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Center</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
        <Text style={styles.message}>Analytics Center screen coming soon.</Text>
        <Text style={styles.sub}>This screen is part of Phase 3-4 build.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#64748b' },
  sub: { marginTop: 4, fontSize: 13, color: '#94a3b8' },
});
