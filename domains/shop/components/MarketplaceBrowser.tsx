import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMarketplaceSearch } from '../hooks/useMarketplace';

interface Props {
  shopId?: string;
}

export default function MarketplaceBrowser({ shopId }: Props) {
  const router = useRouter();
  const { listings, loading, search } = useMarketplaceSearch('', '');

  const handlePress = (item: any) => {
    router.push(`/shop/${item.shop_id}/product/${item.id}` as any);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search marketplace..." onChangeText={(text) => search()} />
      {loading && <Text>Loading...</Text>}
      <FlatList
        data={listings}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            {item.images?.[0] && <Image source={{ uri: item.images[0] }} style={styles.image} />}
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.shop}>{item.shops?.name || 'Unknown Shop'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  search: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  image: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#2e7d32', fontWeight: '600', marginTop: 4 },
  shop: { fontSize: 12, color: '#666', marginTop: 4 }
});
