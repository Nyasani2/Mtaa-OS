import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function MarketplaceBrowser() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shop_items')
        .select('*')
        .ilike('name', `%${q}%`)
        .eq('status', 'active')
        .limit(20);
      setResults(data || []);
    } catch (e) { setResults([]); }
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query)}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/shop/${item.shop_id}` as any)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No products found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  input: { flex: 1, color: '#fff', paddingVertical: 12, marginLeft: 8 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#00d4ff', fontSize: 14, marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
