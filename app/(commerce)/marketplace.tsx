import React from 'react';
import { View, StyleSheet } from 'react-native';
import MarketplaceBrowser from '@/domains/shop/components/MarketplaceBrowser';

export default function MarketplaceScreen() {
  return (
    <View style={styles.container}>
      <MarketplaceBrowser />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
