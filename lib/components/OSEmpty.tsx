import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OSEmpty({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message || 'No data available'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#666', fontSize: 16 },
});
