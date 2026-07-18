import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput style={styles.input} placeholder="Search..." placeholderTextColor="#64748b" />
      </View>
      <Text style={styles.title}>Search</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginTop: 40 },
  input: { flex: 1, color: '#fff', marginLeft: 8, fontSize: 16 },
  title: { fontSize: 24, color: '#fff', fontWeight: '700', marginTop: 24 },
});
