import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShopPanel } from '../components/ShopPanel';

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <ShopPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
