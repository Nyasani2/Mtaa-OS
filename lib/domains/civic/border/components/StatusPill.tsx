import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface StatusPillProps {
  status: string;
  color?: string;
}

const statusColors: Record<string, string> = {
  active: '#10b981', pending: '#f59e0b', cleared: '#10b981', flagged: '#ef4444',
  expired: '#ef4444', suspended: '#8b5cf6', held: '#ef4444', in_transit: '#3b82f6', at_border: '#f59e0b',
};

export function StatusPill({ status, color }: StatusPillProps) {
  const bgColor = color || statusColors[status] || '#64748b';
  return (
    <View style={[styles.pill, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
