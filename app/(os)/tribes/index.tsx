import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTribes } from '@/lib/tribes/hooks/useTribes';
import { TribeCard } from '@/lib/tribes/components/TribeCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Ethnic', 'Interest', 'Heritage', 'Profession', 'Vehicle', 'Brand'];

export default function TribesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { tribes, loading } = useTribes({
    category: selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
    search: searchQuery || undefined
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tribes</Text>
        <Text style={styles.subtitle}>Find your people, preserve your heritage</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search tribes..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={tribes}
        renderItem={({ item }) => (
          <TribeCard tribe={item} onPress={() => router.push(`/tribes/${item.slug}`)} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tribes/create')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { padding: 20, paddingBottom: 10 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#a0a0a0', fontSize: 14, marginTop: 4 },
  searchInput: { backgroundColor: '#1a1a3e', marginHorizontal: 20, padding: 14, borderRadius: 12, color: '#fff', fontSize: 16, marginBottom: 12 },
  categories: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 50 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a3e', marginRight: 8 },
  categoryBtnActive: { backgroundColor: '#e94560' },
  categoryText: { color: '#a0a0a0', fontSize: 13 },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 20, paddingTop: 0 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' }
});
