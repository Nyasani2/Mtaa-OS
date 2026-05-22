import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HealthIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health</Text>
      <Text>Health records, appointments, and medical services.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
