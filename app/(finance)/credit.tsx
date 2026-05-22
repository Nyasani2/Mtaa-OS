import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreditIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit</Text>
      <Text>Credit score and lending services.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
