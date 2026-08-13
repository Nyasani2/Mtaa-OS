// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ProductManager from '@/domains/shop/components/ProductManager';

export default function ShopProductsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
    // @ts-ignore
    // @ts-ignore
      <ProductManager shopId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});
