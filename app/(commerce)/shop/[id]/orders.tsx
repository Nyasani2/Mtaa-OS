// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import OrderManager from '@/domains/shop/components/OrderManager';

export default function ShopOrdersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
    // @ts-ignore
    // @ts-ignore
      <OrderManager shopId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});
