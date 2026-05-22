import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalletDashboard } from './WalletDashboard';

export function WalletShell() {
  return (
    <View style={styles.container}>
      <WalletDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
