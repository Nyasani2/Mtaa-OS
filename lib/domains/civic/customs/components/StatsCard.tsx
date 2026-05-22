import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, color = '#3b82f6' }) => {
  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  value: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  title: { fontSize: 12, color: '#666', marginTop: 4 },
  subtitle: { fontSize: 10, color: '#999', marginTop: 2 },
});

export default StatsCard;
