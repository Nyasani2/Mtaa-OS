import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { MarketplaceBrowser } from '../../../domains/shop/components/MarketplaceBrowser';
import { useMarketplace } from '../../../domains/shop/hooks/useMarketplace';

export default function ShopMarketplace() {
  const router = useRouter();
  const { listings, isLoading } = useMarketplace();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Marketplace</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/shop/cart')}>
          <FontAwesome5 name="shopping-cart" size={18} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <MarketplaceBrowser listings={listings || []} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
});
