import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  severe: '#b71c1c'
};

interface Props {
  report: any;
}

export default function PestReportCard({ report }: Props) {
  const severity = report?.severity || 'low';
  const color = SEVERITY_COLORS[severity] || '#4caf50';

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Text style={styles.title}>{report?.pest_name || 'Unknown Pest'}</Text>
      <Text style={[styles.badge, { backgroundColor: color }]}>{severity}</Text>
      <Text>Crop: {report?.crop_affected || 'N/A'}</Text>
      <Text>Location: {report?.location || 'N/A'}</Text>
      <Text>Reported: {report?.reported_date || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  title: { fontWeight: '600', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
