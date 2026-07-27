import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

interface Props { onSearch?: (q: string) => void; }

export default function StayFilterBar({ onSearch }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.input} placeholder="Where to?" placeholderTextColor="#9ca3af" onChangeText={onSearch} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  inner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, color: '#1a1a1a' },
});
