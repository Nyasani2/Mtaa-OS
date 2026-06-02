import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalletPanel } from '../components/WalletPanel';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <WalletPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
