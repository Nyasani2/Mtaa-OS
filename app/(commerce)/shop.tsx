import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShopQuickAccess from '@/domains/shop/components/ShopQuickAccess';

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <ShopQuickAccess />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
