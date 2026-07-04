import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OSHeader({ title }: { title?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'MTAA OS'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#1a1a2e' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
