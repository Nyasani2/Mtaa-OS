import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useDiscover } from '../hooks/useDiscover';
import { DiscoverGrid } from '../components/DiscoverGrid';

export default function DiscoverScreen() {
  const { results, searchQuery, setSearchQuery, activeFilter, setActiveFilter } = useDiscover();
  const [searchText, setSearchText] = useState('');

  const filters = ['All', 'Videos', 'Users', 'Hashtags', 'Shops', 'Jobs', 'Live'];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Streets..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => setSearchQuery(searchText)}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => { setSearchText(''); setSearchQuery(''); }}>
            <Text>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.activeChip]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <DiscoverGrid
        items={results}
        onItemPress={(item) => {
          if (item.type === 'user') router.push(`/streets/profile/${item.id}`);
          else if (item.type === 'live') router.push(`/streets/live/${item.id}`);
          else router.push(`/streets/post/${item.id}`);
        }}
        onHashtagPress={(tag) => setSearchQuery(tag)}
      />
    </View>
  );
}

import { Text } from 'react-native';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', margin: 12, borderRadius: 24 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f5f5f5' },
  activeChip: { backgroundColor: '#E91E63' },
  filterText: { fontSize: 13, color: '#555' },
  activeFilterText: { color: '#fff', fontWeight: '600' },
});
