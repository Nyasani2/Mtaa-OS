// domains/regulatory/components/AuditLogViewer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuditLogViewer() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audit Log Viewer</Text>
      <Text style={styles.subtitle}>View system audit logs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
