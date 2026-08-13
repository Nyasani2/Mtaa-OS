// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import POSScreen from '@/domains/shop/components/POSScreen';

export default function ShopPOSScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
    // @ts-ignore
    // @ts-ignore
      <POSScreen shopId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});
