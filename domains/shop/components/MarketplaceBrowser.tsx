// domains/shop/components/MarketplaceBrowser.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useMarketplaceSearch } from '../hooks/useMarketplace';

export default function MarketplaceBrowser() {
  const { results, loading, search } = useMarketplaceSearch();
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    search(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search marketplace..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={handleSearch}
      />
      {loading && <Text style={styles.loading}>Loading...</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>KES {(item as any).price?.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  search: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, color: '#fff', marginBottom: 12 },
  loading: { color: '#888', textAlign: 'center', marginVertical: 12 },
  card: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, marginBottom: 8 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#10B981', fontSize: 14, marginTop: 4 },
});
