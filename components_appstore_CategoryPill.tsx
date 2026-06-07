import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ label, active, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.container, active && styles.active]} onPress={onPress}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 8 },
  active: { backgroundColor: '#00d26a' },
  text: { color: '#aaa', fontSize: 13 },
  activeText: { color: '#000', fontWeight: '700' },
});

export default CategoryPill;
