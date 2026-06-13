import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface Props {
  onSearch?: (q: string) => void;
}

export function AppStoreHeader({ onSearch }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AppStore</Text>
      <TextInput style={styles.search} placeholder="Search apps..." placeholderTextColor="#666" onChangeText={onSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  search: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 12, marginTop: 12 },
});

export default AppStoreHeader;
