import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { name: string; }

export default function AmenityBadge({ name }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#dcfce7' },
  text: { fontSize: 12, color: '#1a5c4b', fontWeight: '500' },
});
