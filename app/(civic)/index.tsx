import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CivicIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Civic Services</Text>
      <Text>Access police, courts, prisons, and other civic modules.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
