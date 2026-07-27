// domains/regulatory/components/RegulatoryReportForm.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RegulatoryReportForm() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Regulatory Report Form</Text>
      <Text style={styles.subtitle}>Submit regulatory reports</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
