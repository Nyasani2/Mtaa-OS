import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SchoolsPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schools</Text>
      <Text style={styles.subtitle}>Education schools module</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#888', marginTop: 8 },
});
