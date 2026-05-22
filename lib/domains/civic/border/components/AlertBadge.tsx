import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlertBadgeProps {
  count: number;
  label: string;
  color?: string;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ count, label, color = '#ef4444' }) => {
  return (
    <View style={[styles.badge, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  count: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  label: { fontSize: 12, color: '#666', marginTop: 4 },
});

export default AlertBadge;
