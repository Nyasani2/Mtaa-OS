import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RegulatoryDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Regulatory Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
});

export default RegulatoryDashboard;
