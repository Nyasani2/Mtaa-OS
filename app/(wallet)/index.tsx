import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <Text>Manage your balance, transactions, and payments.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
