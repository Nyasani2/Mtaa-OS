import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  active: '#2196f3',
  expired: '#9e9e9e'
};

export default function AgricultureDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KEPHIS Dashboard</Text>
      <Text>Certificate and pest reporting management.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
