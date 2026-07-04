import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function OSButton({ title, onPress, disabled }: any) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: 12, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600' },
});
