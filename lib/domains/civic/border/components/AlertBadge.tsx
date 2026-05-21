import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from 'react-native';
import { BorderAlert } from '../hooks/useBorderAlerts';

interface AlertBadgeProps {
  alert: BorderAlert;
}

export function AlertBadge({ alert }: AlertBadgeProps) {
  const severityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
  };

  return (
    <Card style={[styles.card, { borderLeftWidth: 3, borderLeftColor: severityColors[alert.severity] }]}>
      <View style={styles.header}>
        <View style={[styles.severityDot, { backgroundColor: severityColors[alert.severity] }]} />
        <Text style={styles.type}>{alert.alert_type}</Text>
        <Text style={styles.time}>{new Date(alert.created_at).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.message}>{alert.message}</Text>
      {alert.border_post_name && <Text style={styles.post}>📍 {alert.border_post_name}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  type: { color: '#e2e8f0', fontSize: 12, fontWeight: '700', flex: 1 },
  time: { color: '#64748b', fontSize: 10 },
  message: { color: '#cbd5e1', fontSize: 13, marginBottom: 4 },
  post: { color: '#64748b', fontSize: 11 },
});
