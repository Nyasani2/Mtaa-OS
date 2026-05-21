import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from 'react-native';

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export function StatsCard({ label, value, icon, color }: StatsCardProps) {
  return (
    <Card style={[styles.card, { borderLeftWidth: 3, borderLeftColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', padding: 14, alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  label: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
});
